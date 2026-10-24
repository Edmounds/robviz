import asyncio
import logging
import math
import threading
import time
from typing import Dict, Optional

import gi
gi.require_version('Gst', '1.0')
gi.require_version('GstWebRTC', '1.0')
gi.require_version('GstSdp', '1.0')
from gi.repository import Gst, GstWebRTC, GstSdp  # noqa: E402

from rclpy.node import Node  # noqa: E402
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy  # noqa: E402
from sensor_msgs.msg import Image  # noqa: E402
from .video_frames import convert_depth_to_jet

logger = logging.getLogger('TopicStreamer')

COLOR_FORMATS = {
    'rgb8': ('RGB', 3),
    'bgr8': ('BGR', 3),
    'rgba8': ('RGBA', 4),
    'bgra8': ('BGRA', 4),
}


def detect_best_encoder():
    if not Gst.is_initialized():
        Gst.init(None)
    # x264enc is universally reliable across all platforms with zerolatency and WebRTC constrained-baseline
    if Gst.ElementFactory.find('x264enc'):
        return 'x264'
    if Gst.ElementFactory.find('nvh264enc'):
        return 'nvenc'
    if Gst.ElementFactory.find('vaapih264enc'):
        return 'vaapi'
    return 'x264'


class TopicStreamer:
    """One latest-frame encoder per ROS topic, with a separate peer per viewer."""

    def __init__(self, topic: str, ros_node: Node, loop: asyncio.AbstractEventLoop, config: dict,
                 on_empty=None):
        self.topic = topic
        self.ros_node = ros_node
        self.loop = loop
        self.config = config
        self.on_empty = on_empty

        self.latest_msg: Optional[Image] = None
        self.latest_raw_msg = None
        self.latest_raw_time = 0.0
        self.capture_viewers = set()
        self.latest_msg_lock = threading.Lock()
        self.viewers: Dict[str, dict] = {}
        self.current_target_fps = config.get('default_target_fps', 10.0)
        self.current_bitrate_kbps = config.get('start_bitrate_kbps', 1000)
        self.min_bitrate_kbps = config.get('min_bitrate_kbps', 150)
        self.max_bitrate_kbps = config.get('max_bitrate_kbps', 1000)
        self.encoder_type = config.get('encoder_type') or detect_best_encoder()

        self.pipeline: Optional[Gst.Pipeline] = None
        self.appsrc: Optional[Gst.Element] = None
        self.encoder: Optional[Gst.Element] = None
        self.rtp_tee: Optional[Gst.Element] = None
        self.bus = None
        self.video_spec = None
        self.peer_counter = 0
        self.viewer_telemetry = {}
        self.last_bitrate_adjustment = 0.0
        self.reported_encodings = set()
        self.image_error = None
        self.settings_key = None

        self.is_active = False
        self.push_task: Optional[asyncio.Task] = None
        self.subscription = None

    def add_viewer(self, viewer_id: str, send_json_cb, target_fps: float):
        if viewer_id in self.viewers:
            self.viewers[viewer_id]['targetFps'] = target_fps
            self.recalculate_fps()
            return

        self.viewers[viewer_id] = {
            'targetFps': target_fps,
            'send': send_json_cb,
            'webrtc': None,
            'queue': None,
            'capsfilter': None,
            'tee_pad': None,
            'pending_ice': [],
            'remote_description_set': False,
        }
        self.recalculate_fps()
        if not self.is_active:
            self.start_streaming()
        elif self.pipeline:
            self.attach_viewer(viewer_id)
        if self.image_error:
            message, encoding = self.image_error
            self.notify_error(message, viewer_id, encoding=encoding)

    def remove_viewer(self, viewer_id: str):
        self.viewer_telemetry.pop(viewer_id, None)
        self.detach_viewer(viewer_id)
        self.viewers.pop(viewer_id, None)
        if not self.viewers:
            self.stop_streaming()
            if self.on_empty and not self.capture_viewers:
                self.on_empty()
        else:
            self.recalculate_fps()

    def update_viewer_fps(self, viewer_id: str, target_fps: float):
        if viewer_id in self.viewers:
            self.viewers[viewer_id]['targetFps'] = target_fps
            self.recalculate_fps()

    def recalculate_fps(self):
        if not self.viewers:
            return
        requested = max(v['targetFps'] for v in self.viewers.values())
        self.current_target_fps = max(1.0, min(self.config.get('max_fps', 30.0), float(requested)))
        logger.info(f"[{self.topic}] Recalculated target FPS: {self.current_target_fps}")

    def start_streaming(self):
        if self.is_active:
            return
        self.is_active = True
        self.image_error = None  # 新订阅周期重新识别编码，不复用停用期间的旧能力。
        logger.info(f"[{self.topic}] Activating stream (first viewer attached)")
        try:
            self.ensure_subscription()
            self.push_task = asyncio.create_task(self.frame_push_loop())
        except Exception as exc:
            self.is_active = False
            logger.exception("[%s] Failed to subscribe", self.topic)
            self.notify_error(f"Could not subscribe to {self.topic}: {exc}")

    def ensure_subscription(self):
        if self.subscription:
            return
        qos = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            history=HistoryPolicy.KEEP_LAST,
            depth=1,
        )
        self.subscription = self.ros_node.create_subscription(Image, self.topic, self.on_ros_image, qos)

    def add_capture_client(self, viewer_id):
        self.ensure_subscription()
        self.capture_viewers.add(viewer_id)

    def remove_capture_client(self, viewer_id):
        self.capture_viewers.discard(viewer_id)
        if not self.capture_viewers and not self.viewers:
            self.release_subscription()
            if self.on_empty:
                self.on_empty()

    def release_subscription(self):
        if self.subscription and not self.capture_viewers:
            self.ros_node.destroy_subscription(self.subscription)
            self.subscription = None
            with self.latest_msg_lock:
                self.latest_raw_msg = None

    def get_latest_raw_frame(self):
        with self.latest_msg_lock:
            return self.latest_raw_msg, self.latest_raw_time

    def stop_streaming(self):
        if not self.is_active and not self.pipeline:
            return
        self.is_active = False
        logger.info(f"[{self.topic}] Deactivating stream (all viewers removed)")
        if self.push_task:
            self.push_task.cancel()
            self.push_task = None
        self.release_subscription()
        with self.latest_msg_lock:
            self.latest_msg = None
        self.teardown_pipeline()

    def on_ros_image(self, msg: Image):
        with self.latest_msg_lock:
            self.latest_msg = msg
            self.latest_raw_msg = msg
            self.latest_raw_time = time.monotonic()

    def image_bytes(self, msg: Image):
        if msg.encoding == '16UC1':
            data, _, size = convert_depth_to_jet(msg)
            return data, (*size, 'RGB')
        image_format = COLOR_FORMATS.get(msg.encoding.lower())
        if not image_format:
            raise ValueError(f"unsupported color image encoding: {msg.encoding}")
        gst_format, channels = image_format
        width, height = int(msg.width), int(msg.height)
        if width < 1 or height < 1 or width > 8192 or height > 8192:
            raise ValueError(f"invalid image dimensions: {width}x{height}")
        row_bytes = width * channels
        gst_stride = (row_bytes + 3) & ~3
        if gst_stride * height > 64 * 1024 * 1024:
            raise ValueError("color frame exceeds the 64 MiB input limit")
        stride = int(msg.step)
        if stride * height > 64 * 1024 * 1024:
            raise ValueError("color frame exceeds the 64 MiB input limit")
        if stride < row_bytes or len(msg.data) < stride * height:
            raise ValueError("image step/data length does not match dimensions")
        if stride == gst_stride:
            data = bytes(msg.data[:gst_stride * height])
        else:
            # 无 GstVideoMeta 时 RGB/BGR 的默认行步长按 4 字节对齐。
            padding = bytes(gst_stride - row_bytes)
            data = b''.join(
                bytes(msg.data[row * stride:row * stride + row_bytes]) + padding
                for row in range(height)
            )
        return data, (width, height, gst_format)

    def apply_settings(self, msg):
        settings = getattr(self.ros_node, 'settings', None)
        if not settings:
            return
        key = (settings['session'], settings['version'], msg.encoding == '16UC1')
        if self.settings_key == key:
            return
        values = settings['depth' if msg.encoding == '16UC1' else 'rgb']
        self.config = {**self.config, 'max_fps': values['max_fps']}
        self.max_bitrate_kbps = int(values['target_bitrate_mbps'] * 1000)
        self.min_bitrate_kbps = min(150, self.max_bitrate_kbps)
        self.current_bitrate_kbps = self.max_bitrate_kbps
        self.recalculate_fps()
        if self.encoder:
            self.encoder.set_property('bitrate', self.current_bitrate_kbps)
        self.settings_key = key

    def notify_error(self, message: str, viewer_id=None, encoding=None):
        targets = (
            [self.viewers[viewer_id]]
            if viewer_id in self.viewers else list(self.viewers.values())
        )
        for viewer in targets:
            payload = {'type': 'error', 'topic': self.topic, 'message': message}
            if encoding is not None:
                payload.update(code='unsupported_encoding', encoding=encoding)
            asyncio.run_coroutine_threadsafe(viewer['send'](payload), self.loop)

    def encoder_description(self):
        if self.encoder_type == 'vaapi':
            return (
                f"vaapih264enc name=enc rate-control=vbr bitrate={self.current_bitrate_kbps} "
                "target-percentage=80 ! video/x-h264,profile=constrained-baseline"
            )
        if self.encoder_type == 'nvenc':
            return (
                f"nvh264enc name=enc bitrate={self.current_bitrate_kbps} rc-mode=cbr "
                "zerolatency=true ! video/x-h264,profile=constrained-baseline"
            )
        return (
            f"x264enc name=enc tune=zerolatency bitrate={self.current_bitrate_kbps} "
            "speed-preset=ultrafast key-int-max=30 bframes=0 ! "
            "video/x-h264,profile=constrained-baseline"
        )

    def setup_pipeline(self, width: int, height: int, image_format: str):
        caps_str = (
            f"video/x-raw,format={image_format},width={width},height={height},framerate=30/1"
        )
        pipe_str = f"""
            appsrc name=src is-live=true format=time caps="{caps_str}" do-timestamp=false
                block=false max-buffers=1 max-bytes=0 max-time=0 leaky-type=downstream !
            videoconvert !
            {self.encoder_description()} !
            h264parse config-interval=1 ! rtph264pay config-interval=1 pt=96 !
            tee name=rtptee allow-not-linked=true
        """
        logger.info(
            "[%s] Creating shared %s encoder pipeline at %dx%d",
            self.topic, self.encoder_type, width, height,
        )
        self.pipeline = Gst.parse_launch(pipe_str)
        self.appsrc = self.pipeline.get_by_name('src')
        self.encoder = self.pipeline.get_by_name('enc')
        self.rtp_tee = self.pipeline.get_by_name('rtptee')
        self.bus = self.pipeline.get_bus()
        self.bus.add_signal_watch()
        self.bus.connect('message::error', self.on_pipeline_error)
        self.video_spec = (width, height, image_format)
        self.pipeline.set_state(Gst.State.PLAYING)

    def on_pipeline_error(self, _bus, message):
        error, debug = message.parse_error()
        logger.error("[%s] GStreamer error: %s (%s)", self.topic, error, debug)
        self.notify_error(f"GStreamer pipeline error: {error}")

    def teardown_pipeline(self):
        for viewer_id in list(self.viewers):
            self.detach_viewer(viewer_id)
        if self.pipeline:
            logger.info(f"[{self.topic}] Tearing down shared encoder pipeline")
            if self.bus:
                self.bus.remove_signal_watch()
                self.bus = None
            self.pipeline.set_state(Gst.State.NULL)
        self.pipeline = None
        self.appsrc = None
        self.encoder = None
        self.rtp_tee = None
        self.video_spec = None

    def attach_viewer(self, viewer_id: str):
        viewer = self.viewers.get(viewer_id)
        if not viewer or not self.pipeline or not self.rtp_tee:
            return
        self.peer_counter += 1
        queue = Gst.ElementFactory.make('queue', f'viewer_queue_{self.peer_counter}')
        capsfilter = Gst.ElementFactory.make('capsfilter', f'viewer_caps_{self.peer_counter}')
        webrtc = Gst.ElementFactory.make('webrtcbin', f'viewer_webrtc_{self.peer_counter}')
        if not queue or not capsfilter or not webrtc:
            self.notify_error("GStreamer could not create a WebRTC peer", viewer_id)
            return

        queue.set_property('max-size-buffers', 128)
        queue.set_property('max-size-bytes', 64 * 1024)
        queue.set_property('max-size-time', 0)
        webrtc.set_property('bundle-policy', 'max-bundle')
        webrtc.set_property('latency', 0)
        capsfilter.set_property('caps', Gst.Caps.from_string(
            'application/x-rtp,media=video,encoding-name=H264,payload=96,clock-rate=90000',
        ))
        try:
            self.pipeline.add(queue)
            self.pipeline.add(capsfilter)
            self.pipeline.add(webrtc)
        except Exception as exc:
            self.notify_error(f"Could not attach WebRTC peer to the media pipeline: {exc}", viewer_id)
            return
        if not queue.link(capsfilter) or not capsfilter.link(webrtc):
            for element in (webrtc, capsfilter, queue):
                self.pipeline.remove(element)
            self.notify_error("Could not link WebRTC peer to the shared encoder", viewer_id)
            return

        tee_pad = self.rtp_tee.request_pad_simple('src_%u')
        queue_sink = queue.get_static_pad('sink')
        if not tee_pad or tee_pad.link(queue_sink) != Gst.PadLinkReturn.OK:
            if tee_pad:
                self.rtp_tee.release_request_pad(tee_pad)
            webrtc.set_state(Gst.State.NULL)
            capsfilter.set_state(Gst.State.NULL)
            queue.set_state(Gst.State.NULL)
            self.pipeline.remove(webrtc)
            self.pipeline.remove(capsfilter)
            self.pipeline.remove(queue)
            self.notify_error("Could not connect the shared RTP stream", viewer_id)
            return

        viewer.update({
            'webrtc': webrtc,
            'queue': queue,
            'capsfilter': capsfilter,
            'tee_pad': tee_pad,
            'pending_ice': [],
            'remote_description_set': False,
        })
        logger.info("[%s] Attaching viewer peer %s to shared RTP tee", self.topic, viewer_id)
        webrtc.connect(
            'on-ice-candidate',
            lambda element, mline, candidate: self.on_gst_ice_candidate(
                viewer_id, element, mline, candidate,
            ),
        )
        queue.sync_state_with_parent()
        capsfilter.sync_state_with_parent()
        webrtc.sync_state_with_parent()
        logger.info("[%s] Requesting SDP offer for viewer %s", self.topic, viewer_id)
        self.create_offer(viewer_id)

    def detach_viewer(self, viewer_id: str):
        viewer = self.viewers.get(viewer_id)
        if not viewer:
            return
        webrtc = viewer.get('webrtc')
        queue = viewer.get('queue')
        capsfilter = viewer.get('capsfilter')
        tee_pad = viewer.get('tee_pad')
        if tee_pad and self.rtp_tee:
            queue_sink = queue.get_static_pad('sink') if queue else None
            if queue_sink:
                tee_pad.unlink(queue_sink)
            self.rtp_tee.release_request_pad(tee_pad)
        for element in (webrtc, capsfilter, queue):
            if element and self.pipeline:
                element.set_state(Gst.State.NULL)
                self.pipeline.remove(element)
        viewer.update({
            'webrtc': None,
            'queue': None,
            'capsfilter': None,
            'tee_pad': None,
            'pending_ice': [],
            'remote_description_set': False,
        })

    def on_gst_ice_candidate(self, viewer_id, webrtc, mline_index, candidate):
        viewer = self.viewers.get(viewer_id)
        if not viewer:
            return
        payload = {
            'type': 'ice',
            'topic': self.topic,
            'candidate': candidate,
            'sdpMLineIndex': mline_index,
        }
        asyncio.run_coroutine_threadsafe(viewer['send'](payload), self.loop)

    def create_offer(self, viewer_id):
        viewer = self.viewers.get(viewer_id)
        webrtc = viewer.get('webrtc') if viewer else None
        if not webrtc:
            return

        def on_offer_ready(promise, _):
            logger.info("[%s] SDP offer promise completed for viewer %s", self.topic, viewer_id)
            current = self.viewers.get(viewer_id)
            if not current or current.get('webrtc') is not webrtc:
                return
            reply = promise.get_reply()
            offer = reply.get_value('offer') if reply else None
            if not offer:
                self.notify_error("GStreamer failed to create an SDP offer", viewer_id)
                return
            webrtc.emit('set-local-description', offer, Gst.Promise.new())
            payload = {
                'type': 'offer',
                'topic': self.topic,
                'sdp': offer.sdp.as_text(),
                'encoder': self.encoder_type,
                'targetFps': self.current_target_fps,
                'bitrateKbps': self.current_bitrate_kbps,
            }
            asyncio.run_coroutine_threadsafe(current['send'](payload), self.loop)

        promise = Gst.Promise.new_with_change_func(on_offer_ready, None)
        logger.info("[%s] Emitting create-offer for viewer %s", self.topic, viewer_id)
        webrtc.emit('create-offer', None, promise)

    def handle_answer(self, viewer_id: str, sdp_text: str):
        viewer = self.viewers.get(viewer_id)
        webrtc = viewer.get('webrtc') if viewer else None
        if not webrtc or not sdp_text:
            return
        logger.info(
            "[%s] Received answer for viewer %s (%d chars)",
            self.topic, viewer_id, len(sdp_text),
        )
        result, sdp_msg = GstSdp.SDPMessage.new()
        if result != GstSdp.SDPResult.OK:
            self.notify_error("Could not allocate an SDP message", viewer_id)
            return
        result = GstSdp.sdp_message_parse_buffer(sdp_text.encode('utf-8'), sdp_msg)
        if result != GstSdp.SDPResult.OK:
            self.notify_error("The browser sent an invalid SDP answer", viewer_id)
            return
        answer = GstWebRTC.WebRTCSessionDescription.new(
            GstWebRTC.WebRTCSDPType.ANSWER, sdp_msg,
        )

        def on_remote_description_set(promise, _):
            current = self.viewers.get(viewer_id)
            if not current or current.get('webrtc') is not webrtc:
                return
            current['remote_description_set'] = True
            logger.info("[%s] Remote answer applied for viewer %s", self.topic, viewer_id)
            for mline, candidate in current['pending_ice']:
                webrtc.emit('add-ice-candidate', mline, candidate)
            current['pending_ice'].clear()

        promise = Gst.Promise.new_with_change_func(on_remote_description_set, None)
        webrtc.emit('set-remote-description', answer, promise)

    def handle_ice(self, viewer_id: str, candidate_str: str, mline_index: int):
        viewer = self.viewers.get(viewer_id)
        webrtc = viewer.get('webrtc') if viewer else None
        if not webrtc or not candidate_str:
            return
        if viewer['remote_description_set']:
            webrtc.emit('add-ice-candidate', mline_index, candidate_str)
        elif len(viewer['pending_ice']) < 256:
            viewer['pending_ice'].append((mline_index, candidate_str))

    def handle_telemetry(self, viewer_id: str, telemetry: dict):
        try:
            rtt = max(0.0, float(telemetry.get('rtt', 0)))
            loss = max(0.0, min(1.0, float(telemetry.get('packetLoss', 0))))
            inbound_kbps = max(0.0, float(telemetry.get('inboundKbps', 0)))
        except (TypeError, ValueError):
            return
        if not all(math.isfinite(value) for value in (rtt, loss, inbound_kbps)):
            return
        self.viewer_telemetry[viewer_id] = {
            'rtt': rtt,
            'loss': loss,
            'inboundKbps': inbound_kbps,
            'receivedAt': time.monotonic(),
        }
        now = time.monotonic()
        if now - self.last_bitrate_adjustment < 1.0:
            return
        samples = [
            sample for sample in self.viewer_telemetry.values()
            if now - sample['receivedAt'] <= 5.0
        ]
        if not samples:
            return

        old_bitrate = self.current_bitrate_kbps
        worst_loss = max(sample['loss'] for sample in samples)
        worst_rtt = max(sample['rtt'] for sample in samples)
        if worst_loss > 0.02 or worst_rtt > 0.250:
            self.current_bitrate_kbps = max(
                self.min_bitrate_kbps, int(self.current_bitrate_kbps * 0.75),
            )
        elif worst_loss < 0.005 and worst_rtt < 0.100:
            self.current_bitrate_kbps = min(
                self.max_bitrate_kbps, self.current_bitrate_kbps + 50,
            )
        if old_bitrate != self.current_bitrate_kbps:
            self.last_bitrate_adjustment = now
            if self.encoder:
                try:
                    self.encoder.set_property('bitrate', self.current_bitrate_kbps)
                except Exception:
                    logger.exception("[%s] Could not update encoder bitrate", self.topic)
            logger.info(
                "[%s] Encoder bitrate changed %d -> %d kbps",
                self.topic, old_bitrate, self.current_bitrate_kbps,
            )
        payload = {
            'type': 'stats',
            'topic': self.topic,
            'encoderBitrateKbps': self.current_bitrate_kbps,
            'targetFps': self.current_target_fps,
            'encoder': self.encoder_type,
        }
        for viewer in list(self.viewers.values()):
            asyncio.run_coroutine_threadsafe(viewer['send'](payload), self.loop)

    async def frame_push_loop(self):
        pts = 0
        while self.is_active:
            interval = 1.0 / max(1.0, self.current_target_fps)
            started = time.monotonic()
            with self.latest_msg_lock:
                frame_msg = self.latest_msg
                self.latest_msg = None

            if frame_msg is not None:
                try:
                    self.apply_settings(frame_msg)
                    raw_data, spec = self.image_bytes(frame_msg)
                except ValueError as exc:
                    encoding_key = (frame_msg.encoding, str(exc))
                    if encoding_key not in self.reported_encodings:
                        self.reported_encodings.add(encoding_key)
                        logger.warning("[%s] %s", self.topic, exc)
                    image_error = (
                        str(exc),
                        frame_msg.encoding if frame_msg.encoding.lower()
                        not in COLOR_FORMATS else None,
                    )
                    if self.image_error != image_error:
                        self.image_error = image_error
                        self.notify_error(
                            image_error[0], encoding=image_error[1],
                        )
                else:
                    self.image_error = None
                    if not self.pipeline or self.video_spec != spec:
                        self.teardown_pipeline()
                        try:
                            self.setup_pipeline(*spec)
                            for viewer_id in list(self.viewers):
                                self.attach_viewer(viewer_id)
                        except Exception as exc:
                            logger.exception("[%s] Failed to initialize GStreamer", self.topic)
                            self.notify_error(f"Could not initialize H.264 pipeline: {exc}")
                            await asyncio.sleep(0.5)
                            continue
                    if self.appsrc:
                        duration = int(interval * Gst.SECOND)
                        buffer = Gst.Buffer.new_wrapped(raw_data)
                        buffer.pts = pts
                        buffer.dts = pts
                        buffer.duration = duration
                        pts += duration
                        result = self.appsrc.emit('push-buffer', buffer)
                        if result != Gst.FlowReturn.OK:
                            logger.warning(
                                "[%s] appsrc returned %s", self.topic, result.value_nick,
                            )

            elapsed = time.monotonic() - started
            await asyncio.sleep(max(0.001, interval - elapsed))

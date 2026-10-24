#!/usr/bin/env python3
# flake8: noqa: E501
import asyncio
import ipaddress
import json
import logging
import math
from pathlib import Path
import re
import threading
import time
from urllib.parse import urlparse
from typing import Dict, Set

# Step 1: Initialize ROS 2 BEFORE GStreamer to prevent FastDDS / libcrypto symbol conflicts
import rclpy
from rclpy.node import Node
from std_srvs.srv import Trigger
from robviz_web_server.image_settings import load_image_settings
from .video_frames import save_raw_png, validate_and_extract_color

# Step 2: GStreamer imports (Gst.init called in main after rclpy.init)
import gi
gi.require_version('Gst', '1.0')
from gi.repository import Gst, GLib  # noqa: E402

import aiohttp  # noqa: E402
from aiohttp import web  # noqa: E402

try:
    from .topic_streamer import TopicStreamer, detect_best_encoder
except ImportError:
    from topic_streamer import TopicStreamer, detect_best_encoder

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger('RobvizVideoGateway')


def is_lan_or_loopback(host_str: str) -> bool:
    if not host_str:
        return False
    host_only = host_str.split(':')[0].strip().strip('[]')
    if host_only in ('localhost', '127.0.0.1', '::1') or host_only.endswith('.local'):
        return True
    try:
        ip = ipaddress.ip_address(host_only)
        return ip.is_private or ip.is_loopback or ip.is_link_local
    except ValueError:
        return False


class GatewayNode(Node):
    def __init__(self):
        super().__init__('robviz_video_gateway')
        self.declare_parameter('host', '0.0.0.0')
        self.declare_parameter('port', 8787)
        self.declare_parameter('default_target_fps', 10.0)
        self.declare_parameter('min_bitrate_kbps', 150)
        self.declare_parameter('start_bitrate_kbps', 1000)
        self.declare_parameter('max_bitrate_kbps', 1000)
        self.declare_parameter('prefer_hardware', True)
        self.declare_parameter('settings_file', '')
        self.declare_parameter('capture_topic', '')
        self.declare_parameter('capture_output_dir', './data/captures')
        self.declare_parameter('allow_remote_capture', False)
        self.declare_parameter('allowed_hosts', ['localhost:8787', '127.0.0.1:8787'])
        self.declare_parameter('allowed_origins', ['http://localhost:5173', 'http://127.0.0.1:5173'])

        self.host = self.get_parameter('host').get_parameter_value().string_value
        self.port = self.get_parameter('port').get_parameter_value().integer_value
        self.config = {
            'default_target_fps': (
                self.get_parameter('default_target_fps').get_parameter_value().double_value
            ),
            'min_bitrate_kbps': (
                self.get_parameter('min_bitrate_kbps').get_parameter_value().integer_value
            ),
            'start_bitrate_kbps': (
                self.get_parameter('start_bitrate_kbps').get_parameter_value().integer_value
            ),
            'max_bitrate_kbps': (
                self.get_parameter('max_bitrate_kbps').get_parameter_value().integer_value
            ),
            'prefer_hardware': (
                self.get_parameter('prefer_hardware').get_parameter_value().bool_value
            ),
            'encoder_type': 'vaapi',  # default, resolved in main()
        }
        self.settings = None
        self.server = None
        self.reload_service = self.create_service(Trigger, '/robviz/reload_image_settings', self.reload_settings)

    def reload_settings(self, _request, response):
        try:
            filename = str(self.get_parameter('settings_file').value)
            if not filename or not self.server:
                raise ValueError('Configure settings_file to the HTTP service image-settings.json')
            settings = load_image_settings(Path(filename).expanduser().absolute())
            if 'session' not in settings:
                raise ValueError('Runtime settings require a session')
            async def apply():
                for streamer in self.server.streamers.values():
                    values = settings['rgb']
                    # Pixel encoding, not the topic name, selects depth settings.
                    frame, _ = streamer.get_latest_raw_frame()
                    if frame is not None and frame.encoding == '16UC1':
                        values = settings['depth']
                    streamer.config['max_fps'] = values['max_fps']
                    streamer.max_bitrate_kbps = int(values['target_bitrate_mbps'] * 1000)
                    streamer.current_bitrate_kbps = streamer.max_bitrate_kbps
                    streamer.recalculate_fps()
                    if streamer.encoder:
                        streamer.encoder.set_property('bitrate', streamer.current_bitrate_kbps)
                self.settings = settings
            asyncio.run_coroutine_threadsafe(apply(), self.server.loop).result(timeout=5)
            response.success = True
            response.message = json.dumps({'version': settings['version'], 'session': settings['session']})
        except Exception as exc:
            response.success = False
            response.message = str(exc)
        return response


class GatewayServer:
    def __init__(self, ros_node: GatewayNode, loop: asyncio.AbstractEventLoop):
        self.ros_node = ros_node
        self.loop = loop
        self.streamers: Dict[str, TopicStreamer] = {}
        self.ros_node.server = self
        self.capture_saving = False
        self.active_websockets = set()

        # GLib mainloop for GStreamer WebRTC events
        self.glib_loop = GLib.MainLoop()
        self.glib_thread = threading.Thread(target=self.glib_loop.run, daemon=True)
        self.glib_thread.start()

        self.app = web.Application()
        self.app.router.add_get('/', self.handle_index)
        self.app.router.add_get('/ws', self.handle_ws)

    def get_or_create_streamer(self, topic: str) -> TopicStreamer:
        if topic not in self.streamers:
            streamer = TopicStreamer(topic, self.ros_node, self.loop, self.ros_node.config)
            if self.ros_node.settings:
                values = self.ros_node.settings['rgb']
                streamer.config = {**streamer.config, 'max_fps': values['max_fps']}
                streamer.max_bitrate_kbps = int(values['target_bitrate_mbps'] * 1000)
                streamer.current_bitrate_kbps = streamer.max_bitrate_kbps

            def remove_empty_streamer():
                if not streamer.viewers and not streamer.capture_viewers:
                    self.streamers.pop(topic, None)

            streamer.on_empty = remove_empty_streamer
            self.streamers[topic] = streamer
        return self.streamers[topic]

    def metadata(self):
        streams = {name: {'transport': 'webrtc', 'available': self.ros_node.count_publishers(name) > 0}
                   for name, types in self.ros_node.get_topic_names_and_types()
                   if 'sensor_msgs/msg/Image' in types and self.valid_topic(name)}
        return {'type': 'meta', 'streams': streams, 'protocolVersion': 1}

    def check_origin(self, request):
        allowed_hosts = self.ros_node.get_parameter('allowed_hosts').value
        if '*' not in allowed_hosts and request.host not in allowed_hosts and not is_lan_or_loopback(request.host):
            return False
        origin = request.headers.get('Origin')
        if not origin:
            return True  # Non-browser diagnostics. Capture still requires an Origin.
        parsed = urlparse(origin)
        if parsed.scheme not in ('http', 'https') or origin != f'{parsed.scheme}://{parsed.netloc}':
            return False
        return (parsed.netloc == request.host or is_lan_or_loopback(parsed.netloc) or
                origin in self.ros_node.get_parameter('allowed_origins').value)

    async def capture_command(self, data, ws_id, request, selected):
        kind, req_id = data.get('type'), data.get('requestId')
        result_type = {'getCaptureInfo': 'captureInfo', 'setCaptureTopic': 'captureTopicResult', 'captureFrame': 'captureResult'}[kind]
        result = {'type': result_type, 'requestId': req_id if isinstance(req_id, str) else '', 'success': False}
        try:
            if not isinstance(req_id, str) or not 1 <= len(req_id) <= 128:
                raise ValueError('Invalid requestId')
            available = list(self.metadata()['streams'])
            topic = data.get('topic') if kind == 'setCaptureTopic' else (
                selected.topic if selected else str(self.ros_node.get_parameter('capture_topic').value) or next(iter(available), ''))
            if not self.valid_topic(topic) or topic not in available:
                raise ValueError('Capture topic is not an available Image source')
            channel = self.get_or_create_streamer(topic)
            channel.add_capture_client(ws_id)
            if selected is not None and selected is not channel:
                selected.remove_capture_client(ws_id)
            selected = channel
            if kind == 'setCaptureTopic':
                return {**result, 'success': True, 'topic': topic}, selected
            frame, received = selected.get_latest_raw_frame()
            fresh = frame is not None and time.monotonic() - received <= 1
            if fresh:
                try:
                    validate_and_extract_color(frame)
                except ValueError:
                    fresh = False
            output = str(Path(self.ros_node.get_parameter('capture_output_dir').value).expanduser().absolute())
            if kind == 'getCaptureInfo':
                names = sorted(Path(output).glob('*.png'), key=lambda p: p.stat().st_mtime) if Path(output).is_dir() else []
                return {**result, 'topic': topic, 'availableTopics': available, 'outputDir': output,
                        'hasFrame': fresh, 'totalCount': len(names), 'lastFileName': names[-1].name if names else None,
                        'width': int(frame.width) if fresh else 0, 'height': int(frame.height) if fresh else 0}, selected
            if not request.headers.get('Origin') or not self.check_origin(request):
                raise PermissionError('Capture write requires an allowed Origin')
            if not is_lan_or_loopback(request.remote or '') and not self.ros_node.get_parameter('allow_remote_capture').value:
                raise PermissionError('Remote capture writes are disabled. Use an SSH tunnel.')
            if not fresh:
                raise ValueError('No fresh supported color frame')
            if self.capture_saving:
                raise ValueError('A capture task is already in progress')
            self.capture_saving = True
            async def save():
                try:
                    return await asyncio.to_thread(save_raw_png, frame, output)
                finally:
                    self.capture_saving = False
            task = self.loop.create_task(save())
            saved = await asyncio.shield(task)
            return {**result, **saved, 'success': True}, selected
        except Exception as exc:
            logger.warning('Capture request failed: %s', exc)
            return {**result, 'error': str(exc)}, selected

    @staticmethod
    def valid_topic(topic):
        return (
            isinstance(topic, str)
            and len(topic) <= 255
            and re.fullmatch(r"/(?:[A-Za-z_][A-Za-z0-9_]*)(?:/[A-Za-z_][A-Za-z0-9_]*)*", topic)
            is not None
        )

    @staticmethod
    def target_fps(value, default):
        if isinstance(value, bool):
            return default
        try:
            fps = float(value)
        except (TypeError, ValueError):
            return default
        return max(1.0, min(60.0, fps)) if math.isfinite(fps) else default

    async def handle_index(self, request):
        html = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>RobViz WebRTC Video Gateway Diagnostic</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; margin: 0; }
    h2 { margin-top: 0; color: #38bdf8; }
    .controls { display: flex; gap: 8px; align-items: center; margin-bottom: 16px; background: #1e293b; padding: 12px; border-radius: 8px; }
    input, button, select { background: #334155; color: #f8fafc; border: 1px solid #475569; padding: 6px 12px; border-radius: 4px; font-size: 14px; }
    button { background: #0284c7; cursor: pointer; font-weight: bold; border: none; }
    button:hover { background: #0369a1; }
    .video-card { background: #1e293b; border-radius: 8px; overflow: hidden; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); }
    video { display: block; max-width: 800px; height: auto; background: #000; }
    .stats { font-family: monospace; font-size: 13px; color: #94a3b8; padding: 12px; line-height: 1.6; }
    .highlight { color: #4ade80; font-weight: bold; }
    .warn { color: #f87171; font-weight: bold; }
  </style>
</head>
<body>
  <h2>RobViz WebRTC Stream Gateway</h2>
  <div class="controls">
    <label>ROS Topic:</label>
    <input id="topic" value="/camera/front/image_raw" style="width: 280px;">
    <label>FPS:</label>
    <select id="fps">
      <option value="5">5 FPS</option>
      <option value="10" selected>10 FPS</option>
      <option value="15">15 FPS</option>
      <option value="20">20 FPS</option>
      <option value="30">30 FPS</option>
    </select>
    <button onclick="startStream()">Start Preview</button>
    <button onclick="stopStream()" style="background: #475569;">Stop</button>
  </div>
  <div class="video-card">
    <video id="vid" autoplay playsinline muted></video>
    <div class="stats" id="stats">Status: Idle</div>
  </div>

  <script>
    let ws = null;
    let pc = null;
    let currentTopic = '';
    let statsTimer = null;
    let lastBytes = 0;
    let lastFrames = 0;
    let lastPacketsLost = 0;
    let lastPacketsReceived = 0;
    let lastTime = performance.now();
    let pendingIce = [];

    async function startStream() {
      stopStream();
      currentTopic = document.getElementById('topic').value.trim();
      const targetFps = parseFloat(document.getElementById('fps').value) || 10;

      const wsProto = location.protocol === 'https:' ? 'wss://' : 'ws://';
      const wsUrl = `${wsProto}${location.host}/ws`;
      pendingIce = [];
      ws = new WebSocket(wsUrl);

      document.getElementById('stats').innerHTML = `Connecting to ${wsUrl}...`;

      ws.onopen = () => {
        document.getElementById('stats').innerHTML = `Connected. Subscribing to <span class="highlight">${currentTopic}</span> at ${targetFps} FPS...`;
        ws.send(JSON.stringify({ type: 'watch', topic: currentTopic, targetFps }));
      };

      ws.onmessage = async (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'offer') {
          pc = new RTCPeerConnection({ iceServers: [] });
          pc.ontrack = (ev) => {
            const vid = document.getElementById('vid');
            vid.srcObject = ev.streams[0] || new MediaStream([ev.track]);
            vid.play().catch(e => console.warn('Autoplay:', e));
          };
          pc.onicecandidate = (ev) => {
            if (ev.candidate && ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'ice',
                topic: currentTopic,
                candidate: ev.candidate.candidate,
                sdpMLineIndex: ev.candidate.sdpMLineIndex
              }));
            }
          };
          await pc.setRemoteDescription({ type: 'offer', sdp: msg.sdp });
          for (const candidate of pendingIce.splice(0)) await pc.addIceCandidate(candidate);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          ws.send(JSON.stringify({ type: 'answer', topic: currentTopic, sdp: answer.sdp }));
          startStats();
        } else if (msg.type === 'ice') {
          const candidate = { candidate: msg.candidate, sdpMLineIndex: msg.sdpMLineIndex };
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(candidate).catch(e => console.warn('ICE add error:', e));
          } else if (pendingIce.length < 256) {
            pendingIce.push(candidate);
          }
        } else if (msg.type === 'error') {
          document.getElementById('stats').innerText = msg.message || 'Video stream unavailable';
        } else if (msg.type === 'stats') {
          // Server stats broadcast
        }
      };

      ws.onclose = () => {
        document.getElementById('stats').innerText = 'Connection closed';
      };
    }

    function stopStream() {
      if (statsTimer) { clearInterval(statsTimer); statsTimer = null; }
      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'unwatch', topic: currentTopic }));
        }
        ws.close();
        ws = null;
      }
      if (pc) {
        pc.close();
        pc = null;
      }
      document.getElementById('vid').srcObject = null;
      document.getElementById('stats').innerText = 'Status: Stopped';
    }

    function startStats() {
      if (statsTimer) clearInterval(statsTimer);
      lastTime = performance.now();
      lastBytes = 0;
      lastFrames = 0;
      lastPacketsLost = 0;
      lastPacketsReceived = 0;

      statsTimer = setInterval(async () => {
        if (!pc) return;
        const stats = await pc.getStats();
        let fps = 0, kbps = 0, rtt = 0, loss = 0, res = '';
        let inbound = null;
        let selectedPair = null;
        stats.forEach(report => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') inbound = report;
          if (report.type === 'candidate-pair' && report.selected) selectedPair = report;
          if (report.type === 'transport' && report.selectedCandidatePairId) {
            selectedPair = stats.get(report.selectedCandidatePairId);
          }
        });
        if (selectedPair) rtt = selectedPair.currentRoundTripTime || 0;
        if (inbound) {
          const now = performance.now();
          const elapsed = Math.max(0.001, (now - lastTime) / 1000);
          if (lastTime) {
            kbps = Math.max(0, Math.round(((inbound.bytesReceived - lastBytes) * 8) / (elapsed * 1000)));
            fps = Math.max(0, Math.round((inbound.framesDecoded - lastFrames) / elapsed));
          }
          const lostDelta = Math.max(0, (inbound.packetsLost || 0) - lastPacketsLost);
          const receivedDelta = Math.max(0, (inbound.packetsReceived || 0) - lastPacketsReceived);
          loss = lostDelta / Math.max(1, lostDelta + receivedDelta);
          lastBytes = inbound.bytesReceived || 0;
          lastFrames = inbound.framesDecoded || 0;
          lastPacketsLost = inbound.packetsLost || 0;
          lastPacketsReceived = inbound.packetsReceived || 0;
          lastTime = now;
          res = `${inbound.frameWidth || 0}x${inbound.frameHeight || 0}`;

          const lossBadge = loss > 0.02 ? `<span class="warn">Loss: ${(loss * 100).toFixed(1)}%</span>` : `<span class="highlight">Loss: ${(loss * 100).toFixed(1)}%</span>`;
          document.getElementById('stats').innerHTML =
            `Decoded: <span class="highlight">${fps} FPS</span> | Bitrate: <span class="highlight">${kbps} kbps</span> | Resolution: <span class="highlight">${res}</span> | RTT: ${(rtt * 1000).toFixed(0)} ms | ${lossBadge}`;

          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'telemetry', topic: currentTopic, rtt, packetLoss: loss, inboundKbps: kbps, actualFps: fps }));
          }
        }
      }, 1000);
    }
  </script>
</body>
</html>"""
        return web.Response(text=html, content_type='text/html')

    async def handle_ws(self, request):
        if not self.check_origin(request):
            return web.Response(status=403, text='Forbidden Host or Origin')
        ws = web.WebSocketResponse(heartbeat=15, max_msg_size=64 * 1024)
        await ws.prepare(request)
        ws_id = str(id(ws))
        watched_topics: Set[str] = set()
        capture = None
        self.active_websockets.add(ws)
        logger.info(f"Client connected: {ws_id}")

        async def send_json_cb(payload):
            if not ws.closed:
                await ws.send_json(payload)

        try:
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    try:
                        data = json.loads(msg.data)
                    except Exception:
                        continue
                    if not isinstance(data, dict):
                        continue
                    mtype = data.get('type')
                    topic = data.get('topic')
                    if not isinstance(mtype, str):
                        continue

                    if mtype == 'getMeta':
                        await ws.send_json(self.metadata())
                        continue
                    if mtype in ('getCaptureInfo', 'setCaptureTopic', 'captureFrame'):
                        result, capture = await self.capture_command(data, ws_id, request, capture)
                        await ws.send_json(result)
                        continue
                    if mtype == 'unwatchCapture':
                        if capture:
                            capture.remove_capture_client(ws_id)
                            capture = None
                        continue

                    if mtype == 'watch':
                        if not self.valid_topic(topic):
                            await ws.send_json({
                                'type': 'error',
                                'topic': topic,
                                'message': 'Invalid ROS topic name',
                            })
                            continue
                        default_fps = self.ros_node.config['default_target_fps']
                        requested_fps = data.get('targetFps', default_fps)
                        target_fps = self.target_fps(requested_fps, default_fps)
                        streamer = self.get_or_create_streamer(topic)
                        streamer.add_viewer(ws_id, send_json_cb, target_fps)
                        watched_topics.add(topic)
                    elif mtype in {'unwatch', 'setFps', 'answer', 'ice', 'telemetry'}:
                        if not self.valid_topic(topic):
                            await ws.send_json({
                                'type': 'error',
                                'topic': topic,
                                'message': 'Invalid ROS topic name',
                            })
                            continue
                        if mtype == 'unwatch':
                            if topic in self.streamers:
                                self.streamers[topic].remove_viewer(ws_id)
                            watched_topics.discard(topic)
                        elif mtype == 'setFps':
                            if topic in self.streamers:
                                default_fps = self.ros_node.config['default_target_fps']
                                requested_fps = data.get('targetFps', default_fps)
                                target_fps = self.target_fps(requested_fps, default_fps)
                                self.streamers[topic].update_viewer_fps(ws_id, target_fps)
                        elif mtype == 'answer':
                            sdp = data.get('sdp')
                            if (
                                topic in self.streamers
                                and isinstance(sdp, str)
                                and len(sdp) <= 60_000
                            ):
                                self.streamers[topic].handle_answer(ws_id, sdp)
                        elif mtype == 'ice':
                            candidate = data.get('candidate')
                            mline = data.get('sdpMLineIndex', 0)
                            if (isinstance(candidate, str) and len(candidate) <= 4096
                                    and isinstance(mline, int) and not isinstance(mline, bool)
                                    and 0 <= mline < 16 and topic in self.streamers):
                                self.streamers[topic].handle_ice(ws_id, candidate, mline)
                        elif isinstance(data, dict) and topic in self.streamers:
                            self.streamers[topic].handle_telemetry(ws_id, data)
        finally:
            self.active_websockets.discard(ws)
            if capture:
                capture.remove_capture_client(ws_id)
            logger.info(f"Client disconnected: {ws_id}")
            for t in list(watched_topics):
                if t in self.streamers:
                    self.streamers[t].remove_viewer(ws_id)
        return ws


def main(args=None):
    rclpy.init(args=args)
    ros_node = GatewayNode()
    Gst.init(None)
    ros_node.config['encoder_type'] = (
        detect_best_encoder() if ros_node.config['prefer_hardware'] else 'x264'
    )
    ros_node.get_logger().info(
        f"Initialized Video Gateway with encoder: {ros_node.config['encoder_type']}"
    )

    # Run ROS spin in background daemon thread
    ros_thread = threading.Thread(target=rclpy.spin, args=(ros_node,), daemon=True)
    ros_thread.start()

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    server = GatewayServer(ros_node, loop)

    app_runner = web.AppRunner(server.app)
    loop.run_until_complete(app_runner.setup())
    site = web.TCPSite(app_runner, host=ros_node.host, port=ros_node.port)
    loop.run_until_complete(site.start())

    logger.info(f"RobViz WebRTC Video Gateway listening on http://{ros_node.host}:{ros_node.port}")

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        loop.run_until_complete(asyncio.gather(*(ws.close() for ws in list(server.active_websockets))))
        loop.run_until_complete(app_runner.cleanup())
        for streamer in list(server.streamers.values()):
            streamer.capture_viewers.clear()
            streamer.stop_streaming()
            streamer.release_subscription()
        ros_node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()

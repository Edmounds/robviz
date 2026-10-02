import asyncio
import threading
from types import SimpleNamespace

import pytest

from robviz_video_gateway.gateway_node import GatewayServer
from robviz_video_gateway.topic_streamer import TopicStreamer
from gi.repository import Gst


def bare_streamer():
    streamer = object.__new__(TopicStreamer)
    streamer.topic = "/camera/front/image_raw"
    streamer.viewers = {}
    streamer.viewer_telemetry = {}
    streamer.current_bitrate_kbps = 1000
    streamer.min_bitrate_kbps = 150
    streamer.max_bitrate_kbps = 2500
    streamer.current_target_fps = 10
    streamer.encoder_type = "x264"
    streamer.last_bitrate_adjustment = 0
    streamer.encoder = None
    streamer.encoder_type = 'test'
    streamer.image_error = None
    streamer.is_active = True
    streamer.pipeline = None
    streamer.loop = asyncio.new_event_loop()
    return streamer


def test_image_bytes_pads_tightly_packed_color_for_gstreamer():
    streamer = bare_streamer()
    msg = SimpleNamespace(
        encoding="rgb8", width=2, height=1, step=6,
        data=bytearray([1, 2, 3, 4, 5, 6]),
    )

    data, spec = streamer.image_bytes(msg)

    assert data == bytes([1, 2, 3, 4, 5, 6, 0, 0])
    assert spec == (2, 1, "RGB")


def test_image_bytes_preserves_gstreamer_compatible_row_padding():
    streamer = bare_streamer()
    msg = SimpleNamespace(
        encoding="bgr8", width=2, height=2, step=8,
        data=bytearray([1, 2, 3, 4, 5, 6, 90, 91, 7, 8, 9, 10, 11, 12, 92, 93]),
    )

    data, spec = streamer.image_bytes(msg)

    assert data == bytes(msg.data)
    assert spec == (2, 2, "BGR")


def test_image_bytes_repacks_larger_ros_stride():
    streamer = bare_streamer()
    msg = SimpleNamespace(
        encoding="rgb8", width=2, height=2, step=10,
        data=bytearray([1, 2, 3, 4, 5, 6, 90, 91, 92, 93,
                        7, 8, 9, 10, 11, 12, 94, 95, 96, 97]),
    )
    data, _ = streamer.image_bytes(msg)
    assert data == bytes([1, 2, 3, 4, 5, 6, 0, 0, 7, 8, 9, 10, 11, 12, 0, 0])


def test_image_bytes_preserves_native_resolution_with_non_aligned_rgb_width():
    streamer = bare_streamer()
    msg = SimpleNamespace(
        encoding="rgb8", width=642, height=480, step=1926,
        data=bytearray(1926 * 480),
    )
    data, spec = streamer.image_bytes(msg)
    assert spec == (642, 480, "RGB")
    assert len(data) == 1928 * 480


def test_pipeline_bounds_raw_queue_and_drops_oldest_buffers(monkeypatch):
    Gst.init(None)
    streamer = bare_streamer()
    streamer.encoder_description = lambda: "identity name=enc"
    streamer.on_pipeline_error = lambda *args: None
    native_parse_launch = Gst.parse_launch
    blocked = threading.Event()
    consumed_latest = threading.Event()
    received = []
    probes = []

    # Retain the actual appsrc configuration; block before encoding instead of
    # requiring a platform encoder or arbitrarily dropping encoded RTP packets.
    def parse_launch(description):
        appsrc_description = description.split('!')[0].strip()
        pipeline = native_parse_launch(
            appsrc_description + ' ! fakesink name=rtptee async=false sync=false signal-handoffs=true')
        pad = pipeline.get_by_name('src').get_static_pad('src')

        def block_buffer(*args):
            blocked.set()
            return Gst.PadProbeReturn.OK

        probe = pad.add_probe(Gst.PadProbeType.BLOCK | Gst.PadProbeType.BUFFER, block_buffer)
        probes.append((pad, probe))

        def on_buffer(_sink, buffer, _pad):
            received.append(buffer.pts)
            if buffer.pts == 10:
                consumed_latest.set()

        pipeline.get_by_name('rtptee').connect('handoff', on_buffer)
        return pipeline

    monkeypatch.setattr(Gst, 'parse_launch', parse_launch)
    streamer.setup_pipeline(642, 480, 'RGB')
    try:
        appsrc = streamer.appsrc
        assert appsrc.get_property('max-buffers') == 1
        assert appsrc.get_property('block') is False
        assert appsrc.get_property('leaky-type').value_nick == 'downstream'
        initial = Gst.Buffer.new_allocate(None, 1024, None)
        initial.pts = 0
        appsrc.emit('push-buffer', initial)
        assert blocked.wait(2)
        for index in range(1, 11):
            buffer = Gst.Buffer.new_allocate(None, 1024, None)
            buffer.pts = index
            assert appsrc.emit('push-buffer', buffer) == Gst.FlowReturn.OK
        assert appsrc.get_property('current-level-buffers') == 1
        assert appsrc.get_property('current-level-bytes') == 1024
        pad, probe = probes.pop()
        pad.remove_probe(probe)
        assert consumed_latest.wait(2)
        assert received == [0, 10]
    finally:
        for pad, probe in probes:
            pad.remove_probe(probe)
        streamer.teardown_pipeline()
        streamer.loop.close()


def test_late_viewer_receives_cached_depth_encoding_error(monkeypatch):
    streamer = bare_streamer()
    streamer.image_error = ('unsupported color image encoding: 16UC1', '16UC1')
    notify = []
    monkeypatch.setattr(streamer, 'notify_error', lambda message, viewer_id, encoding:
                        notify.append((message, viewer_id, encoding)))
    streamer.add_viewer('new-viewer', None, 10)
    assert notify == [(streamer.image_error[0], 'new-viewer', '16UC1')]
    streamer.loop.close()


def test_image_bytes_rejects_depth_and_malformed_layout():
    streamer = bare_streamer()
    depth = SimpleNamespace(encoding="16UC1", width=2, height=1, step=4, data=bytearray(4))
    malformed = SimpleNamespace(encoding="rgb8", width=2, height=1, step=5, data=bytearray(5))
    oversized = SimpleNamespace(
        encoding="rgb8", width=8192, height=8192,
        step=8192 * 3, data=bytearray(),
    )

    with pytest.raises(ValueError, match="unsupported color image encoding"):
        streamer.image_bytes(depth)
    with pytest.raises(ValueError, match="step/data length"):
        streamer.image_bytes(malformed)
    with pytest.raises(ValueError, match="64 MiB"):
        streamer.image_bytes(oversized)


def test_gateway_validates_topic_names_and_fps():
    assert GatewayServer.valid_topic("/camera/front/image_raw")
    assert not GatewayServer.valid_topic("camera/front")
    assert not GatewayServer.valid_topic("/camera//image")
    assert not GatewayServer.valid_topic("/camera/../secret")
    assert GatewayServer.target_fps(5, 10) == 5
    assert GatewayServer.target_fps(1000, 10) == 30
    assert GatewayServer.target_fps(float("nan"), 10) == 10
    assert GatewayServer.target_fps(True, 10) == 10


def test_telemetry_adapts_bitrate_down_and_recovers(monkeypatch):
    now = [10.0]
    monkeypatch.setattr("robviz_video_gateway.topic_streamer.time.monotonic", lambda: now[0])
    streamer = bare_streamer()

    streamer.handle_telemetry("viewer-a", {"packetLoss": 0.1, "rtt": 0.05})
    assert streamer.current_bitrate_kbps == 750

    now[0] += 2
    streamer.handle_telemetry("viewer-a", {"packetLoss": 0, "rtt": 0.05})
    assert streamer.current_bitrate_kbps == 800

    streamer.loop.close()

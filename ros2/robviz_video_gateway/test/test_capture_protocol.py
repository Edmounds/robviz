"""Synthetic localhost capture protocol. No cameras, hardware or motion commands."""

import asyncio
import json
from pathlib import Path
import tempfile
import threading
import time
import unittest

import aiohttp
import cv2
from aiohttp import web
import rclpy
from rclpy.parameter import Parameter
from rclpy.qos import qos_profile_sensor_data
from sensor_msgs.msg import Image
from std_srvs.srv import Trigger

from robviz_video_gateway.gateway_node import GatewayNode, GatewayServer
from robviz_web_server.image_settings import ImageSettingsStore


class TestCaptureProtocol(unittest.IsolatedAsyncioTestCase):
    async def test_synthetic_capture_discovery_reload_and_cleanup(self):
        # Dedicated ROS domain and localhost transport are set by the runnable command.
        rclpy.init()
        node = GatewayNode()
        stopped = threading.Event()
        def spin():
            while not stopped.is_set():
                rclpy.spin_once(node, timeout_sec=.05)
        thread = threading.Thread(target=spin, daemon=True)
        thread.start()
        server = GatewayServer(node, asyncio.get_running_loop())
        runner = web.AppRunner(server.app)
        await runner.setup()
        site = web.TCPSite(runner, "127.0.0.1", 0)
        await site.start()
        port = runner.addresses[0][1]
        origin = f"http://127.0.0.1:{port}"
        with tempfile.TemporaryDirectory() as temporary:
            node.set_parameters([
                Parameter("allowed_hosts", value=[f"127.0.0.1:{port}"]),
                Parameter("allowed_origins", value=[origin]),
                Parameter("capture_topic", value="/review/image"),
                Parameter("capture_output_dir", value=temporary),
                Parameter("settings_file", value=str(Path(temporary) / "image-settings.json")),
            ])
            publisher = node.create_publisher(Image, "/review/image", qos_profile_sensor_data)
            message = Image(width=2, height=1, encoding="rgb8", step=6, data=[255, 0, 0, 0, 255, 0])
            try:
                async with aiohttp.ClientSession() as client:
                    with self.assertRaises(aiohttp.WSServerHandshakeError):
                        await client.ws_connect(f"http://127.0.0.1:{port}/ws", headers={"Origin": "https://untrusted.example"})
                    async with client.ws_connect(f"http://127.0.0.1:{port}/ws", headers={"Origin": origin}) as ws:
                        await ws.send_json({"type": "getMeta"})
                        meta = await ws.receive_json(timeout=3)
                        self.assertIn("/review/image", meta["streams"])
                        await ws.send_json({"type": "getCaptureInfo", "requestId": "initial"})
                        await ws.receive_json(timeout=3)
                        deadline = time.monotonic() + 3
                        info = {}
                        while time.monotonic() < deadline:
                            publisher.publish(message)
                            await asyncio.sleep(.05)
                            await ws.send_json({"type": "getCaptureInfo", "requestId": "poll"})
                            info = await ws.receive_json(timeout=3)
                            if info.get("hasFrame"):
                                break
                        self.assertTrue(info.get("hasFrame"), info)
                        self.assertIsNone(server.streamers["/review/image"].pipeline)
                        await ws.send_json({"type": "captureFrame", "requestId": "save"})
                        result = await ws.receive_json(timeout=3)
                        self.assertTrue(result["success"], result)
                        self.assertEqual(Path(result["filePath"]).read_bytes()[:8], b"\x89PNG\r\n\x1a\n")
                        self.assertEqual(cv2.imread(result["filePath"]).tolist(), [[[0, 0, 255], [0, 255, 0]]])
                        await ws.send_json({"type": "setCaptureTopic", "requestId": "bad", "topic": "/absent"})
                        self.assertFalse((await ws.receive_json(timeout=3))["success"])
                        await ws.send_json({"type": "unwatchCapture"})
                        await ws.send_json({"type": "getMeta"})
                        await ws.receive_json(timeout=3)
                        self.assertNotIn("/review/image", server.streamers)
                store = ImageSettingsStore(Path(temporary) / "image-settings.json")
                settings, _ = store.update(store.snapshot(), True)
                response = await asyncio.to_thread(node.reload_settings, Trigger.Request(), Trigger.Response())
                self.assertTrue(response.success, response.message)
                self.assertEqual(json.loads(response.message), {"version": settings["version"], "session": settings["session"]})
            finally:
                await runner.cleanup()
                server.glib_loop.quit()
                server.glib_thread.join(timeout=2)
                stopped.set()
                thread.join(timeout=2)
                node.destroy_node()
                rclpy.shutdown()

"""Real local HTTP checks. No ROS or robot connection is created."""

import http.client
import json
from pathlib import Path
import tempfile
import threading
import unittest

from robviz_web_server.web_server_node import create_server


class TestHttp(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / "route.yaml").write_text("schema_version: 2\nframe_id: odom\npoints: []\n")
        self.start()

    def start(self):
        self.server = create_server("127.0.0.1", 0, self.root)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def stop(self):
        self.server.shutdown()
        self.thread.join()
        self.server.server_close()

    def tearDown(self):
        self.stop()
        self.tmp.cleanup()

    def request(self, method, path, payload=None, headers=None):
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=2)
        data = payload if isinstance(payload, bytes) else json.dumps(payload) if payload is not None else None
        connection.request(method, path, data, {"Content-Type": "application/json", **(headers or {})})
        response = connection.getresponse()
        result = response.read()
        connection.close()
        return response.status, result

    def test_rejects_cross_origin_host_traversal_and_invalid_inputs(self):
        for headers in ({"Origin": "https://untrusted.example"}, {"Host": "untrusted.example"}):
            self.assertEqual(self.request("PUT", "/api/document", {}, headers)[0], 403)
        self.assertEqual(self.request("OPTIONS", "/api/document", headers={"Origin": "https://untrusted.example"})[0], 403)
        self.assertEqual(self.request("GET", "/api/document?id=../outside")[0], 400)
        self.assertEqual(self.request("PUT", "/api/document", {"id": "route", "points": []})[0], 409)
        self.assertEqual(self.request("PUT", "/api/document", b"[]")[0], 400)
        self.assertEqual(self.request("PUT", "/api/document", b"x", {"Content-Length": str(4 * 1024 * 1024 + 1)})[0], 413)

    def test_background_round_trip(self):
        self.assertEqual(json.loads(self.request("GET", "/api/background?id=route")[1])["has_image"], False)
        status, data = self.request("POST", "/api/background/image?id=route", b"\x89PNG\r\n\x1a\nimage")
        self.assertEqual(status, 200)
        image = json.loads(data)["image_file"]
        config = dict(center_x=1, center_y=2, meters_per_pixel=.01, rotation_deg=0,
                      opacity=.5, visible=True, pivot_u=0, pivot_v=0, width=10, height=20, image_file=image)
        self.assertEqual(self.request("PUT", "/api/background/config?id=route", config)[0], 200)
        self.assertTrue(json.loads(self.request("GET", "/api/background?id=route")[1])["has_image"])
        self.assertEqual(self.request("GET", "/api/background/image?id=route")[1], b"\x89PNG\r\n\x1a\nimage")
        config["image_file"] = "../outside.png"
        self.assertEqual(self.request("PUT", "/api/background/config?id=route", config)[0], 400)
        self.assertEqual(self.request("DELETE", "/api/background?id=route")[0], 200)
        self.assertFalse(json.loads(self.request("GET", "/api/background?id=route")[1])["has_image"])

    def test_settings_persist_conflict_and_never_claim_ros_applied(self):
        settings = json.loads(self.request("GET", "/api/image-settings")[1])["settings"]
        settings["rgb"]["max_fps"] = 17
        status, data = self.request("POST", "/api/image-settings/defaults", settings)
        result = json.loads(data)
        self.assertEqual(status, 200)
        self.assertTrue(result["saved"])
        self.assertFalse(result["applied"])
        self.assertEqual(self.request("PUT", "/api/image-settings", settings)[0], 409)
        self.stop()
        self.start()
        restored = json.loads(self.request("GET", "/api/image-settings")[1])["settings"]
        self.assertEqual(restored["rgb"]["max_fps"], 17)
        self.assertNotEqual(restored["session"], settings["session"])

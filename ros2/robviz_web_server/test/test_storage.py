"""Unit tests for generic waypoint storage, conflict resolution, and atomic writes."""

import shutil
import tempfile
import unittest
from pathlib import Path
import yaml

from robviz_web_server.storage import (
    VersionConflict,
    load_waypoint_document,
    safe_rel_path,
    save_waypoint_document,
)

class TestStorage(unittest.TestCase):
    def setUp(self):
        self.temp_dir = Path(tempfile.mkdtemp(prefix="test_robviz_storage_"))

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_safe_rel_path_rejects_traversal(self):
        with self.assertRaises(PermissionError):
            safe_rel_path(self.temp_dir, "../outside.yaml")
        with self.assertRaises(PermissionError):
            safe_rel_path(self.temp_dir, "../../etc/passwd")
        with self.assertRaises(PermissionError):
            safe_rel_path(self.temp_dir, f"../{self.temp_dir.name}-outside/file.yaml")
        (self.temp_dir / "link").symlink_to(self.temp_dir, target_is_directory=True)
        with self.assertRaises(PermissionError):
            safe_rel_path(self.temp_dir, "link/file.yaml")

    def test_save_preserves_frame_metadata_and_requires_version(self):
        target = self.temp_dir / "odom.yaml"
        target.write_text('schema_version: 1\nframe_id: odom\nmetadata: {keep: true}\npoints: []\n')
        target.chmod(0o640)
        doc = load_waypoint_document(target)
        with self.assertRaises(VersionConflict):
            save_waypoint_document(target, "", [])
        _, backup = save_waypoint_document(target, doc["version"], [])
        self.assertIn("frame_id: odom", target.read_text())
        self.assertIn("keep: true", target.read_text())
        self.assertEqual(target.stat().st_mode & 0o777, 0o640)
        self.assertTrue(Path(backup).exists())

    def test_invalid_points_do_not_change_original(self):
        target = self.temp_dir / "route.yaml"
        target.write_text('schema_version: 2\nframe_id: map\npoints: []\n')
        original = target.read_bytes()
        version = load_waypoint_document(target)["version"]
        for points in ("not an array", [{}], [{"name": "P", "x": float("nan")}], [None]):
            with self.assertRaises(ValueError):
                save_waypoint_document(target, version, points)
            self.assertEqual(target.read_bytes(), original)

    def test_schema_one_coordinates_quaternion_and_metadata_round_trip(self):
        target = self.temp_dir / "legacy.yaml"
        raw = {"schema_version": 1, "frame_id": "odom", "metadata": {"keep": True}, "points": [
            {"name": "P", "type": "goal", "position": {"x": 1, "y": 2, "z": 3},
             "orientation": {"x": 0, "y": 0, "z": .5**.5, "w": .5**.5}, "speed": .4}]}
        target.write_text(yaml.safe_dump(raw))
        doc = load_waypoint_document(target)
        self.assertAlmostEqual(doc["points"][0]["yaw_deg"], 90)
        self.assertEqual(doc["points"][0]["x"], 1)
        save_waypoint_document(target, doc["version"], doc["points"])
        saved = yaml.safe_load(target.read_text())
        self.assertEqual(saved["frame_id"], "odom")
        self.assertEqual(saved["schema_version"], 1)
        self.assertEqual(saved["points"][0]["position"], {"x": 1, "y": 2, "z": 3})
        self.assertEqual(saved["points"][0]["orientation"], raw["points"][0]["orientation"])
        self.assertEqual(saved["points"][0]["speed"], .4)
        self.assertEqual(saved["metadata"], {"keep": True})

    def test_save_and_load_round_trip(self):
        target = self.temp_dir / "route_a.yaml"
        points = [
            {"name": "P1", "type": "waypoint", "x": 1.0, "y": 2.0, "z": 0.0, "yaw_deg": 90.0, "extra": {}},
            {"name": "G1", "type": "goal", "x": 5.0, "y": 6.0, "z": 0.0, "yaw_deg": 0.0, "extra": {}},
        ]
        version, backup = save_waypoint_document(target, "", points)
        self.assertTrue(target.is_file())
        self.assertTrue(len(version) > 0)

        doc = load_waypoint_document(target)
        self.assertEqual(doc["id"], "route_a")
        self.assertEqual(len(doc["points"]), 2)
        self.assertEqual(doc["points"][0]["name"], "P1")
        self.assertEqual(doc["points"][1]["type"], "goal")

    def test_version_conflict_prevents_overwrite(self):
        target = self.temp_dir / "route_b.yaml"
        points = [{"name": "P1", "type": "waypoint", "x": 0.0, "y": 0.0, "z": 0.0, "yaw_deg": 0.0, "extra": {}}]
        ver1, _ = save_waypoint_document(target, "", points)

        # Mutate document
        points.append({"name": "P2", "type": "waypoint", "x": 1.0, "y": 1.0, "z": 0.0, "yaw_deg": 0.0, "extra": {}})
        ver2, _ = save_waypoint_document(target, ver1, points)
        self.assertNotEqual(ver1, ver2)

        # A concurrent writer presenting stale ver1 must be rejected
        with self.assertRaises(VersionConflict):
            save_waypoint_document(target, ver1, points)

if __name__ == "__main__":
    unittest.main()

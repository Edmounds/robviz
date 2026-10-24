"""Image settings protocol shared by the HTTP service and video gateway."""

import copy
import json
from pathlib import Path
import threading
import uuid

from .storage import VersionConflict, atomic_write, document_lock, finite_number, read_bytes

DEFAULT_IMAGE_SETTINGS = {
    "version": 1,
    "rgb": {"transport": "webrtc", "bandwidth_mbps": 25.0, "max_fps": 10.0,
            "target_bitrate_mbps": 4.0, "quality": 90, "min_quality": 70, "auto_quality": True},
    "depth": {"transport": "webrtc", "bandwidth_mbps": 25.0, "max_fps": 10.0,
              "target_bitrate_mbps": 1.5, "quality": 90, "min_quality": 70, "auto_quality": True},
}


def validate_image_settings(payload):
    if not isinstance(payload, dict):
        raise ValueError("Image settings must be an object")
    result = {}
    for name in ("rgb", "depth"):
        value = payload.get(name)
        if not isinstance(value, dict) or value.get("transport") != "webrtc":
            raise ValueError(f"{name} requires WebRTC settings")
        stream = {"transport": "webrtc"}
        stream["bandwidth_mbps"] = finite_number(value.get("bandwidth_mbps"), "bandwidth_mbps", 0.01, 1000)
        stream["max_fps"] = finite_number(value.get("max_fps"), "max_fps", 1, 60)
        stream["target_bitrate_mbps"] = finite_number(
            value.get("target_bitrate_mbps"), "target_bitrate_mbps", 0.01, stream["bandwidth_mbps"])
        for field, maximum in (("quality", 95), ("min_quality", value.get("quality", 95))):
            number = value.get(field)
            if isinstance(number, bool) or not isinstance(number, int):
                raise ValueError(f"{field} must be an integer")
            stream[field] = finite_number(number, field, 30, maximum)
        if not isinstance(value.get("auto_quality"), bool):
            raise ValueError("auto_quality must be boolean")
        stream["auto_quality"] = value["auto_quality"]
        result[name] = stream
    version = payload.get("version")
    if isinstance(version, bool) or not isinstance(version, int) or not 1 <= version < 2**31:
        raise ValueError("Invalid settings version")
    result["version"] = version
    if "session" in payload:
        session = payload["session"]
        if not isinstance(session, str) or len(session) != 32 or any(c not in "0123456789abcdef" for c in session):
            raise ValueError("Invalid settings session")
        result["session"] = session
    return result


def load_image_settings(path: Path):
    return validate_image_settings(json.loads(read_bytes(path)))


class ImageSettingsStore:
    def __init__(self, path: Path):
        self.path = path
        self.defaults = path.with_name("image-settings-defaults.json")
        self.lock = threading.RLock()
        self.settings = load_image_settings(self.defaults) if self.defaults.exists() else copy.deepcopy(DEFAULT_IMAGE_SETTINGS)
        self.settings["session"] = uuid.uuid4().hex
        with document_lock(path):
            atomic_write(path, json.dumps(self.settings, allow_nan=False).encode())

    def snapshot(self):
        with self.lock:
            return copy.deepcopy(self.settings)

    def update(self, payload, save_default=False):
        value = validate_image_settings(payload)
        with self.lock, document_lock(self.path):
            if (value.get("session"), value["version"]) != (self.settings["session"], self.settings["version"]):
                raise VersionConflict("Image settings changed. Reload before saving.")
            if load_image_settings(self.path) != self.settings:
                raise VersionConflict("Image settings were changed by another service")
            value["version"] += 1
            encoded = json.dumps(value, allow_nan=False).encode()
            # Stage the runtime file first. No response claims that ROS applied it.
            atomic_write(self.path, encoded)
            self.settings = value
            backup = None
            if save_default:
                with document_lock(self.defaults):
                    backup = atomic_write(self.defaults, encoded)
            return copy.deepcopy(value), backup

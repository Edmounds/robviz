"""Bounded file storage with version checks, backups and atomic replacement."""

from contextlib import contextmanager
from datetime import datetime
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import stat
import tempfile
import yaml

MAX_DOCUMENT_BYTES = 4 * 1024 * 1024
MAX_POINT_COUNT = 5000


class VersionConflict(ValueError):
    """The caller must reload the current document before writing."""


def safe_rel_path(base: Path, relative_name: str) -> Path:
    """Reject traversal and symlinks, including intermediate components."""
    parts = relative_name.split("/")
    if (not relative_name or Path(relative_name).is_absolute()
            or any(part in ("", ".", "..") for part in parts)
            or "\\" in relative_name or "\x00" in relative_name):
        raise PermissionError("Invalid relative path")
    target = base.absolute()
    for part in (*target.parents, target):
        if part.is_symlink():
            raise PermissionError("Symlinks are not allowed")
    for part in parts:
        target /= part
        if target.is_symlink():
            raise PermissionError("Symlinks are not allowed")
    target.resolve().relative_to(base.resolve())
    return target


def file_id(value) -> str:
    if not isinstance(value, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,127}", value):
        raise ValueError("Invalid document id")
    return value


def read_bytes(path: Path, maximum=MAX_DOCUMENT_BYTES) -> bytes:
    safe_rel_path(path.parent, path.name)
    with path.open("rb") as stream:
        data = stream.read(maximum + 1)
    if len(data) > maximum:
        raise ValueError("File is too large")
    return data


def document_version(path: Path) -> str:
    return hashlib.sha256(read_bytes(path)).hexdigest()


@contextmanager
def document_lock(path: Path):
    """Serialize writers without following a planted lock symlink."""
    import fcntl
    lock_path = safe_rel_path(path.parent, f".{path.name}.lock")
    fd = os.open(lock_path, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, "r+") as stream:
        fcntl.flock(stream, fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(stream, fcntl.LOCK_UN)


def atomic_write(path: Path, data: bytes) -> str | None:
    """Preserve the original and its mode until the replacement is durable."""
    safe_rel_path(path.parent, path.name)
    backup = None
    mode = stat.S_IMODE(path.stat().st_mode) if path.exists() else 0o600
    if path.exists():
        backup = path.with_name(f"{path.name}.{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.bak")
        with backup.open("xb") as stream:
            stream.write(read_bytes(path, 20 * 1024 * 1024))
            stream.flush()
            os.fsync(stream.fileno())
        shutil.copymode(path, backup)
    fd, temporary = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.")
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.chmod(temporary, mode)
        os.replace(temporary, path)
        directory = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    finally:
        Path(temporary).unlink(missing_ok=True)
    return str(backup) if backup else None


def finite_number(value, label, minimum=-1e12, maximum=1e12):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{label} must be a number")
    if not math.isfinite(value) or not minimum <= value <= maximum:
        raise ValueError(f"{label} is out of range")
    return value


def validate_points(points):
    if not isinstance(points, list) or len(points) > MAX_POINT_COUNT:
        raise ValueError("points must be an array of at most 5000 points")
    names = set()
    for point in points:
        if not isinstance(point, dict):
            raise ValueError("Each point must be an object")
        name = point.get("name")
        if not isinstance(name, str) or not name.strip() or len(name) > 160 or name in names:
            raise ValueError("Point names must be nonempty and unique")
        names.add(name)
        if point.get("type", "waypoint") not in ("waypoint", "goal"):
            raise ValueError("Invalid point type")
        for field in ("x", "y", "z", "yaw_deg"):
            finite_number(point.get(field, None if field in ("x", "y") else 0), field)
        if not isinstance(point.get("extra", {}), dict):
            raise ValueError("Point extra must be an object")
    # Reject NaN, non-JSON values and oversized nested metadata before writing.
    if len(json.dumps(points, allow_nan=False).encode()) > MAX_DOCUMENT_BYTES:
        raise ValueError("Points are too large")
    return points


def legacy_points(points):
    """Project schema-1 position/quaternion files into the flat editor protocol."""
    if not isinstance(points, list) or len(points) > MAX_POINT_COUNT:
        raise ValueError("Invalid schema-1 points")
    normalized = []
    for point in points:
        if not isinstance(point, dict):
            raise ValueError("Schema-1 points require objects")
        position = point.get("position")
        if position is not None and not isinstance(position, dict):
            raise ValueError("Schema-1 point position must be an object")
        if "yaw" in point:
            yaw = finite_number(point["yaw"], "yaw")
        elif point.get("orientation") is not None:
            orientation = point["orientation"]
            if not isinstance(orientation, dict):
                raise ValueError("Schema-1 points require yaw or orientation")
            x, y, z, w = [finite_number(orientation.get(axis), axis) for axis in ("x", "y", "z", "w")]
            norm = math.sqrt(x*x + y*y + z*z + w*w)
            if norm < 1e-12:
                raise ValueError("Invalid zero quaternion")
            x, y, z, w = (value / norm for value in (x, y, z, w))
            yaw = math.atan2(2 * (w*z + x*y), 1 - 2 * (y*y + z*z))
        else:
            yaw = 0.0
        normalized.append({
            "name": point.get("name"), "type": point.get("type", "waypoint"),
            "x": position.get("x", 0.0) if position else 0.0,
            "y": position.get("y", 0.0) if position else 0.0,
            "z": position.get("z", 0.0) if position else 0.0,
            "yaw_deg": math.degrees(yaw),
            "extra": {key: value for key, value in point.items() if key not in ("name", "type", "position", "orientation", "yaw")},
        })
    return validate_points(normalized)


def load_waypoint_document(path: Path) -> dict:
    data = read_bytes(path)
    raw = yaml.safe_load(data)
    if not isinstance(raw, dict):
        raise ValueError("Waypoint document requires an object")
    frame_id = str(raw.get("frame_id", "") or "")
    version = raw.get("schema_version", 2)
    if type(version) is not int or version not in (1, 2):
        raise ValueError("Unsupported waypoint schema_version")
    points = legacy_points(raw.get("points")) if version == 1 else validate_points(raw.get("points"))
    is_template = path.stem.startswith("template") or frame_id == ""
    return {
        "id": path.stem, "label": path.name,
        "schema_version": version, "frame_id": frame_id,
        "points": [{"type": "waypoint", "z": 0, "yaw_deg": 0, "extra": {}, **p} for p in points],
        "template": [], "formal": False,
        "version": hashlib.sha256(data).hexdigest(),
        "map": {"available": not is_template, "reason": "template definition, no coordinates" if is_template else f"{frame_id} coordinate grid"},
    }


def save_waypoint_document(path: Path, expected_version: str, points_data: list) -> tuple:
    validate_points(points_data)
    with document_lock(path):
        if path.exists():
            if not expected_version or expected_version != document_version(path):
                raise VersionConflict("Document changed or version missing. Reload before saving.")
            payload = yaml.safe_load(read_bytes(path))
            if not isinstance(payload, dict) or not isinstance(payload.get("frame_id"), str):
                raise ValueError("Invalid existing document")
        else:
            if expected_version != "":
                raise VersionConflict("Document no longer exists")
            payload = {"schema_version": 2, "frame_id": "map"}
        # Keep frame, schema and unknown top-level metadata exactly as loaded.
        schema = payload.get("schema_version", 2)
        if type(schema) is not int or schema not in (1, 2):
            raise ValueError("Unsupported waypoint schema_version")
        if schema == 1:
            original = {point["name"]: point for point in payload.get("points", [])}
            normalized = {point["name"]: point for point in legacy_points(payload.get("points", []))}
            serialized = []
            for point in points_data:
                yaw = math.radians(point.get("yaw_deg", 0))
                item = {**point.get("extra", {}), "name": point["name"], "type": point.get("type", "waypoint"),
                        "position": {"x": point["x"], "y": point["y"], "z": point.get("z", 0)}, "yaw": yaw,
                        "orientation": {"x": 0, "y": 0, "z": math.sin(yaw / 2), "w": math.cos(yaw / 2)}}
                if point["name"] in original and point.get("yaw_deg", 0) == normalized[point["name"]]["yaw_deg"]:
                    for key in ("orientation", "yaw"):
                        if key in original[point["name"]]:
                            item[key] = original[point["name"]][key]
                serialized.append(item)
            payload["points"] = serialized
        else:
            payload["points"] = points_data
        encoded = yaml.safe_dump(payload, sort_keys=False, allow_unicode=True).encode()
        if len(encoded) > MAX_DOCUMENT_BYTES:
            raise ValueError("Document is too large")
        backup = atomic_write(path, encoded)
        return hashlib.sha256(encoded).hexdigest(), backup

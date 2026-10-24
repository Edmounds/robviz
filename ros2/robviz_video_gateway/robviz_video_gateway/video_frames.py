# Copyright (c) 2026 Edmounds and fruit_ws team
# Licensed under MIT and Apache-2.0.
"""Validated raw image conversion and lossless capture, without ROS side effects."""

import os
from pathlib import Path
import uuid
import cv2
import numpy as np

COLOR_FORMATS = {"rgb8": ("RGB", 3), "bgr8": ("BGR", 3), "rgba8": ("RGBA", 4), "bgra8": ("BGRA", 4)}


def pixels(msg, channels, dtype=np.uint8):
    width, height, stride = int(msg.width), int(msg.height), int(msg.step)
    row_bytes = width * channels * np.dtype(dtype).itemsize
    if not (1 <= width <= 8192 and 1 <= height <= 8192):
        raise ValueError("Invalid image dimensions")
    if stride < row_bytes or stride * height > 64 * 1024 * 1024 or len(msg.data) < stride * height:
        raise ValueError("Invalid image step/data length")
    raw = memoryview(msg.data)
    data = b"".join(raw[r * stride:r * stride + row_bytes] for r in range(height))
    return np.frombuffer(data, dtype=dtype).reshape(height, width, channels)


def validate_and_extract_color(msg):
    encoding = msg.encoding.lower()
    if encoding not in COLOR_FORMATS:
        raise ValueError(f"Unsupported color encoding: {msg.encoding}")
    gst_format, channels = COLOR_FORMATS[encoding]
    image = pixels(msg, channels)
    conversion = {"rgb8": cv2.COLOR_RGB2BGR, "rgba8": cv2.COLOR_RGBA2BGR, "bgra8": cv2.COLOR_BGRA2BGR}
    bgr = cv2.cvtColor(image, conversion[encoding]) if encoding in conversion else image
    padding = bytes((-int(msg.width) * channels) % 4)
    gst = b"".join(row.tobytes() + padding for row in image)
    return gst, bgr, (int(msg.width), int(msg.height), gst_format)


def convert_depth_to_jet(msg):
    if msg.encoding != "16UC1":
        raise ValueError("Depth preview requires 16UC1")
    dtype = np.dtype(">u2" if msg.is_bigendian else "<u2")
    depth = pixels(msg, 1, dtype).reshape(int(msg.height), int(msg.width))
    valid = depth > 0
    normalized = np.zeros(depth.shape, dtype=np.uint8)
    if valid.any():
        low, high = float(depth[valid].min()), float(depth[valid].max())
        normalized[valid] = 128 if low == high else np.clip((depth[valid] - low) * 254 / (high - low) + 1, 1, 255)
    bgr = cv2.applyColorMap(normalized, cv2.COLORMAP_JET)
    bgr[~valid] = 0
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    padding = bytes((-int(msg.width) * 3) % 4)
    return b"".join(row.tobytes() + padding for row in rgb), bgr, (int(msg.width), int(msg.height))


def save_raw_png(msg, directory):
    """Save one validated full-resolution frame with an exclusive random filename."""
    _, bgr, _ = validate_and_extract_color(msg)
    ok, encoded = cv2.imencode(".png", bgr, [cv2.IMWRITE_PNG_COMPRESSION, 3])
    if not ok:
        raise ValueError("PNG encoding failed")
    root = Path(directory).expanduser().absolute()
    if any(p.is_symlink() for p in (*root.parents, root)):
        raise PermissionError("Capture output directory cannot contain symlinks")
    root.mkdir(parents=True, exist_ok=True)
    name = f"frame_{uuid.uuid4().hex}.png"
    target = root / name
    temporary = root / f".{name}.tmp"
    try:
        with temporary.open("xb") as stream:
            stream.write(encoded.tobytes())
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, target)
    finally:
        temporary.unlink(missing_ok=True)
    return {"filePath": str(target), "fileName": name, "width": int(msg.width), "height": int(msg.height),
            "stampSec": int(msg.header.stamp.sec), "stampNsec": int(msg.header.stamp.nanosec),
            "totalCount": sum(1 for item in root.glob("*.png") if item.is_file())}

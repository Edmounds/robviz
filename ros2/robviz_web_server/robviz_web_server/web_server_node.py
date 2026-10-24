"""Same-origin waypoint, background and image settings HTTP service."""

import argparse
import ipaddress
import json
import logging
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse
import uuid
import yaml

from .image_settings import ImageSettingsStore
from .storage import (
    VersionConflict, atomic_write, document_lock, file_id, finite_number,
    load_waypoint_document, read_bytes, safe_rel_path, save_waypoint_document,
)

logger = logging.getLogger("robviz_web_server")


def validate_background(payload):
    result = {}
    for field in ("center_x", "center_y", "rotation_deg", "pivot_u", "pivot_v"):
        result[field] = finite_number(payload.get(field), field)
    result["meters_per_pixel"] = finite_number(payload.get("meters_per_pixel"), "meters_per_pixel", 1e-9, 1000)
    result["opacity"] = finite_number(payload.get("opacity"), "opacity", 0, 1)
    for field in ("width", "height"):
        value = payload.get(field)
        if isinstance(value, bool) or not isinstance(value, int):
            raise ValueError(f"{field} must be an integer")
        result[field] = finite_number(value, field, 1, 32768)
    if not isinstance(payload.get("visible"), bool):
        raise ValueError("visible must be boolean")
    result["visible"] = payload["visible"]
    result["image_file"] = payload.get("image_file")
    return result


def is_lan_or_loopback(host_str: str) -> bool:
    if not host_str:
        return False
    host_only = host_str.split(":")[0].strip().strip("[]")
    if host_only in ("localhost", "127.0.0.1", "::1") or host_only.endswith(".local"):
        return True
    try:
        ip = ipaddress.ip_address(host_only)
        return ip.is_private or ip.is_loopback or ip.is_link_local
    except ValueError:
        return False


class RequestError(ValueError):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


class RobvizHttpHandler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(10)

    def _send(self, status, body, content_type="application/json; charset=utf-8"):
        if not isinstance(body, bytes):
            body = json.dumps(body, ensure_ascii=False, allow_nan=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def _check_request(self, write=False):
        hosts = self.server.allowed_hosts
        host = self.headers.get("Host", "")
        if "*" not in hosts and host not in hosts and not is_lan_or_loopback(host):
            raise RequestError(403, "Host is not configured")
        origin = self.headers.get("Origin")
        if origin:
            parsed = urlparse(origin)
            if parsed.scheme not in ("http", "https") or origin != f"{parsed.scheme}://{parsed.netloc}":
                raise RequestError(403, "Origin does not match Host")
            if parsed.netloc != host and not is_lan_or_loopback(parsed.netloc) and origin not in self.server.allowed_origins:
                raise RequestError(403, "Origin does not match Host or LAN policy")
        client_ip = self.client_address[0]
        if write and not is_lan_or_loopback(client_ip) and not self.server.allow_remote_writes:
            raise RequestError(403, "Remote writes are disabled. Use an SSH tunnel.")

    def _body(self, maximum=4 * 1024 * 1024, binary=False):
        if self.headers.get("Transfer-Encoding"):
            raise RequestError(400, "Transfer-Encoding is not supported")
        length = self.headers.get("Content-Length", "")
        if not length.isdigit():
            raise RequestError(411, "A valid Content-Length is required")
        size = int(length)
        if not 0 < size <= maximum:
            raise RequestError(413, "Request is too large or empty")
        if not binary and self.headers.get_content_type() != "application/json":
            raise RequestError(415, "Expected application/json")
        data = self.rfile.read(size)
        if len(data) != size:
            raise RequestError(400, "Incomplete request")
        if binary:
            return data
        payload = json.loads(data)
        if not isinstance(payload, dict):
            raise ValueError("JSON body must be an object")
        return payload

    def _document(self, identifier):
        path = safe_rel_path(self.server.data_dir, f"{file_id(identifier)}.yaml")
        # API clients may edit only files deliberately placed in the data directory.
        if not path.is_file():
            raise FileNotFoundError("Unknown document")
        return path

    def _background_config(self, identifier):
        return safe_rel_path(self.server.background_dir, f"{identifier}.json")

    def _handle(self):
        method = self.command
        self._check_request(write=method != "GET")
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        query = parse_qs(parsed.query)
        if method == "OPTIONS":
            # Same-origin clients need no CORS. Never authorize cross-origin writes.
            return self._send(204, b"")
        if path == "/api/files" and method == "GET":
            files = []
            for item in sorted(self.server.data_dir.glob("*.yaml")):
                try:
                    file_id(item.stem)
                    doc = load_waypoint_document(self._document(item.stem))
                    mode = "template" if doc["frame_id"] == "" or item.stem.startswith("template") else "freeform"
                    files.append({**doc, "profile": "default", "mode": mode,
                                  "file_name": item.name, "file_available": True})
                except Exception as exc:
                    logger.warning("Skipping invalid YAML file %s: %s", item.name, exc)
            return self._send(200, {"files": files})
        if path == "/api/document":
            if method == "GET":
                return self._send(200, load_waypoint_document(self._document(query.get("id", [""])[0])))
            if method == "PUT":
                payload = self._body()
                target = self._document(payload.get("id"))
                version, backup = save_waypoint_document(target, payload.get("version"), payload.get("points"))
                return self._send(200, {"saved": True, "file": target.name, "backup": backup, "version": version})
        if path in ("/api/image-settings", "/api/image-settings/defaults"):
            if method == "GET" and path == "/api/image-settings":
                settings = self.server.image_settings.snapshot()
                return self._send(200, {"settings": settings, "version": settings["version"]})
            defaults = path.endswith("/defaults")
            if method == ("POST" if defaults else "PUT"):
                settings, backup = self.server.image_settings.update(self._body(), defaults)
                return self._send(200, {"saved": defaults, "applied": False,
                                       "status": "awaiting_ros_reload", "settings": settings,
                                       "version": settings["version"], "backup": backup})
        if path.startswith("/api/background"):
            identifier = file_id(query.get("id", [""])[0])
            self._document(identifier)
            config_path = self._background_config(identifier)
            with document_lock(config_path):
                if path == "/api/background/image" and method == "POST":
                    data = self._body(20 * 1024 * 1024, binary=True)
                    ext = ".png" if data.startswith(b"\x89PNG\r\n\x1a\n") else (
                        ".jpg" if data.startswith(b"\xff\xd8\xff") else (
                            ".webp" if data[:4] == b"RIFF" and data[8:12] == b"WEBP" else None))
                    if ext is None:
                        raise RequestError(415, "Expected PNG, JPEG or WebP")
                    name = f"{identifier}-{uuid.uuid4().hex}{ext}"
                    atomic_write(safe_rel_path(self.server.background_dir, name), data)
                    return self._send(200, {"uploaded": True, "image_file": name, "size": len(data)})
                if path == "/api/background/config" and method == "PUT":
                    config = validate_background(self._body())
                    name = config["image_file"]
                    if not isinstance(name, str) or not name.startswith(f"{identifier}-") or "/" in name:
                        raise ValueError("Image must belong to this document")
                    read_bytes(safe_rel_path(self.server.background_dir, name), 20 * 1024 * 1024)
                    atomic_write(config_path, json.dumps(config, allow_nan=False).encode())
                    return self._send(200, {"saved": True, "config": config})
                config = json.loads(read_bytes(config_path)) if config_path.exists() else None
                if path == "/api/background" and method == "GET":
                    return self._send(200, {"has_image": config is not None, "config": config,
                                           "image_url": f"/api/background/image?id={identifier}" if config else None})
                if path == "/api/background/image" and method == "GET" and config:
                    image = safe_rel_path(self.server.background_dir, config["image_file"])
                    return self._send(200, read_bytes(image, 20 * 1024 * 1024), mimetypes.guess_type(image.name)[0])
                if path == "/api/background" and method == "DELETE":
                    if config:
                        # Keep a recoverable copy before unlinking the active configuration.
                        atomic_write(config_path, read_bytes(config_path))
                        config_path.unlink()
                    return self._send(200, {"deleted": True})
        if method == "GET" and not path.startswith("/api/") and self.server.web_dir:
            target = safe_rel_path(self.server.web_dir, path.lstrip("/") or "index.html")
            return self._send(200, read_bytes(target, 50 * 1024 * 1024), mimetypes.guess_type(target.name)[0] or "application/octet-stream")
        raise RequestError(404, "Endpoint not found")

    def _dispatch(self):
        try:
            self._handle()
        except VersionConflict as exc:
            self._send(409, {"error": str(exc)})
        except RequestError as exc:
            self._send(exc.status, {"error": str(exc)})
        except PermissionError as exc:
            self._send(403, {"error": str(exc)})
        except FileNotFoundError:
            self._send(404, {"error": "File not found"})
        except (ValueError, TypeError, KeyError, UnicodeError, yaml.YAMLError) as exc:
            self._send(400, {"error": str(exc)})
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception:
            logger.exception("File service request failed")
            self._send(500, {"error": "File service failed. Original files were retained."})

    do_GET = do_PUT = do_POST = do_DELETE = do_OPTIONS = _dispatch

    def log_message(self, message, *args):
        logger.info(message, *args)


def create_server(host, port, data_dir, web_dir=None, allowed_hosts=(), allowed_origins=(), allow_remote_writes=False):
    data_dir = Path(data_dir).absolute()
    safe_rel_path(data_dir.parent, data_dir.name)
    data_dir.mkdir(parents=True, exist_ok=True)
    background_dir = safe_rel_path(data_dir, "backgrounds")
    background_dir.mkdir(exist_ok=True)
    server = ThreadingHTTPServer((host, port), RobvizHttpHandler)
    server.data_dir = data_dir
    server.background_dir = background_dir
    server.web_dir = Path(web_dir).absolute() if web_dir else None
    server.allow_remote_writes = allow_remote_writes
    server.allowed_origins = set(allowed_origins)
    server.allowed_hosts = set(allowed_hosts) | {
        f"127.0.0.1:{server.server_port}", f"localhost:{server.server_port}"}
    server.image_settings = ImageSettingsStore(safe_rel_path(data_dir, "image-settings.json"))
    return server


def main():
    parser = argparse.ArgumentParser(description="RobViz file and settings service")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--data-dir", default="./data/waypoints")
    parser.add_argument("--web-dir")
    parser.add_argument("--allowed-host", action="append", default=[], help="Exact Host including port, including a reverse proxy Host")
    parser.add_argument("--allowed-origin", action="append", default=[], help="Explicit allowed Origin")
    parser.add_argument("--allow-remote-writes", action="store_true")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    server = create_server(args.host, args.port, args.data_dir, args.web_dir, args.allowed_host, args.allowed_origin, args.allow_remote_writes)
    logger.info("Listening on %s:%d", args.host, server.server_port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

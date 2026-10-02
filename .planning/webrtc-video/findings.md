# Findings

## Architecture and behavior
- Browser-side `WorkerBridge.subscribe(..., { maxFrequency: 10 })` cannot reduce bytes already sent over Foxglove WebSocket. Color preview uses a separate robot-side WebRTC/H.264 path; TF, point clouds, maps, laser scans, occupancy grids, and other ROS data remain on Foxglove.
- One shared encoder produces a topic stream; each viewer has an independent `webrtcbin` peer. The ROS image subscription and encoder start on demand and stop after the final viewer leaves.
- Image conversion accepts supported color encodings, validates dimensions/step/data length and the 64 MiB input limit, strips row padding, and replaces stale raw frames instead of queueing them. Native resolution is preserved.
- Hardware H.264 is preferred with software encoding as fallback. The tested Intel VA-API path uses VBR; the target did not support the attempted CBR mode.
- RTP packets are kept in bounded non-leaky per-viewer queues because dropping an individual packet can corrupt an H.264 access unit. The latest-frame policy applies before encoding.
- The frontend shares signaling for panels in one page, reports incremental packet-loss telemetry, supports a maximum requested FPS across viewers, and exposes WebRTC/Raw selection. `CompressedImage` stays on the existing canvas path; the explicit Raw selection retains the canvas depth color-map and hover display. Unsupported non-color encodings are rejected by the gateway rather than silently forwarded over WebRTC.
- Browser playback is not yet verified.

## Verified
- Test host: `dev-box` (`192.168.147.144`), Ubuntu 22.04, ROS 2 Humble, GStreamer 1.20.3, Intel UHD Graphics 630, VA-API H.264 and `x264enc` available.
- GStreamer single-viewer and dual-viewer tests decoded 10 frames per viewer at 1280x720 from a shared topic encoder. Last-viewer disconnect tore down the stream.
- Remote gateway package build and ROS logic tests passed (5 tests). Frontend tests passed (133 tests); frontend lint and production build passed. The build emitted its pre-existing large-chunk warning.
- After the first `ament_flake8` failure, formatting/import fixes and local `py_compile` succeeded. A follow-up remote lint/build/test has not completed because SSH to `dev-box` timed out during sync. The final E501 suppression and Python formatting edits are therefore not yet confirmed by `ament_flake8`.

## Outstanding
- Real-browser decode, dimensions, `RTCPeerConnection.getStats()`, duplicate-panel sharing, reconnection, and application-level color/depth behavior remain unverified. Prior browser automation attempts hung.
- No `tc netem` shaping was applied. Bitrate reduction/recovery, end-to-end latency, and frame freshness during congestion remain unverified.
- Confirm the installed runtime has the required ROS, PyGObject/GStreamer, WebRTC typelib, and `aiohttp` dependencies; these are system packages rather than normal Python package dependencies.
- The initial deployment is trusted-LAN only: no TURN, NAT traversal, or public authentication.
- The public test MP4 URL returned Google Cloud Storage `AccessDenied`; integration checks used a generated test video.

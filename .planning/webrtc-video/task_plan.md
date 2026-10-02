# WebRTC Video Gateway Continuation

## Goal
Deliver color-image previews over an independent robot-side WebRTC/H.264 path. Preserve native resolution and ROS image topics, share one encoder per topic across viewers, send fresh frames, and stop the stream when nobody is watching. Keep non-image ROS data on Foxglove.

## Phases
- [x] Implement shared topic encoding, independent viewer peers, signaling, FPS aggregation, input validation, on-demand lifecycle, and browser telemetry.
- [x] Add focused gateway/client tests and validate the ROS-enabled package build and tests.
- [x] Validate GStreamer decode at 1280x720 with one and two viewers, shared topic encoding, and teardown after the last viewer disconnects.
- [in_progress] Resolve `ament_flake8` findings and rerun remote package checks; the test host became unreachable during the latest sync.
- [pending] Validate playback in a real browser, including browser `getStats()`, duplicate panels, reconnect, color-versus-depth handling, and inactive-stream cleanup.
- [pending] Test bitrate response, frame freshness, resolution stability, and latency under controlled network shaping.

## Known limitations
- GStreamer decode tests do not prove browser playback or browser-side stats.
- Congestion shaping has not been performed; adaptation and latency targets remain unverified.
- Trusted LAN is the supported initial deployment scope. TURN, Internet-facing authentication, and NAT traversal are not included.
- Keep root `task_plan.md` unchanged; it belongs to the separate Base Platform Refactoring & Hardening effort.

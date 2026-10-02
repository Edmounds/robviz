# Progress

## 2026-09-29
- Implemented the independent WebRTC image path and corrected signaling, viewer lifecycle, FPS aggregation, image validation, latest-frame delivery, and browser telemetry.
- Confirmed with GStreamer on `dev-box` that one and two independent viewers decode 1280x720 streams; viewers share the topic encoder, and the stream tears down after the last viewer disconnects.
- Gateway package build and ROS tests passed remotely (5 tests). Frontend suite passed (133 tests); frontend lint and build passed, with the existing large-chunk warning.
- `ament_flake8` exposed E501 long lines and an E306 nested-function spacing issue. Source was adjusted and compiles locally, but the host became unreachable during sync, so the final lint/build/test rerun is pending.
- Browser playback and browser `getStats()` have not been validated. No `tc netem` shaping was applied; bitrate adaptation, latency, and freshness under congestion remain unverified.
- Remote SSH to `dev-box` timed out during the last sync attempt. The gateway and test publisher had already been stopped after integration testing; no running service is currently confirmed.

## Remaining
- Reconnect to `dev-box`, sync the latest lint edits, and rerun `ament_flake8`, `colcon build`, and `colcon test`.
- Validate browser decode, dimensions, WebRTC stats, duplicate panels, reconnect behavior, color-versus-depth behavior, and inactive-stream cleanup.
- If safe access to the correct network interface is available, test bitrate downshift/recovery and frame freshness with controlled network shaping.

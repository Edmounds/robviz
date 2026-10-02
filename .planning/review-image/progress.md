# Review progress

- Read package scripts, image panel, WebRTC client, and existing WebRTC implementation notes.
- No business code changes; review notes isolated from existing plans.
- npm test: 29 files / 133 tests passed. Vitest reports a shutdown timeout after passing; no test failure.
- npm run lint: passed. npm run build: passed (existing large-chunk warning).
- Local ROS/GStreamer integration unavailable: gi module and gst-launch-1.0 are absent. Did not connect to remote hosts.
- Read upstream GStreamer documentation through AnySearch extraction to verify appsrc limits and RGB/BGR row alignment.
- npx tsx .planning/review-image/reproduce.ts: confirmed dead-socket reuse, Raw row-padding corruption, and mediaUrl snapshot loss.
- Extended reproduction confirms old teleop config is not migrated. Python AST-extracted image_bytes confirms a 642x480 RGB frame loses padding required by default GstVideoInfo.
- Final report includes two P1 and six P2 findings, clearly distinguishing old Raw defects and source/documentation checks from real integration results.

## User-approved fixes
- Preserved mediaUrl in live snapshots; added existing-teleop migration with unchanged panel ids and dock structure.
- Added validated Worker-side Raw normalization (padding removal and big-endian conversion), with malformed-input checks.
- Added activity-aware media lifecycle, persisted useWebRtc, and gateway-declared encoding routing for depth/grayscale only (no automatic color-gateway failure fallback).
- Added shared-peer reconnect/cleanup, stale SDP/stats guards, and cancellable retries.
- Added drop-oldest bounds to the raw appsrc queue and GStreamer-compatible RGB/BGR row alignment.
- npm test: 30 files / 158 tests passed; npm run lint and npm run build passed.
- Existing Vitest shutdown timeout and bundle-size warning remain; no unrelated fixes were made.
- npx tsx .planning/review-image/fix-check.ts passed: actual snapshot, rendering/hover, media effect gates/cleanup, depth routing and transport callbacks extracted from source. These are not React browser tests.
- python3 .planning/review-image/gateway_checks.py passed (3 stdlib tests): real image_bytes layouts/input validation and actual appsrc configuration; no native GStreamer execution.
- Python syntax compilation passed. Added native GStreamer regression for blocked downstream, one-buffer bound, and latest-frame delivery; cannot execute it locally without gi/ROS.
- ego-browser taskSpace command produced no response for over two minutes and was terminated; browser integration remains unverified. No remote host was accessed.
- Original review report/reproducer retained as historical evidence; fixes.md records the resolution and integration limits.

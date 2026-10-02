# Review: image transport and recent changes

Historical review before fixes. All eight findings now have code fixes; see [fixes.md](fixes.md) for checks and remaining integration limits. References below describe the reviewed pre-fix version.

Scope: latest image/connection/layout changes (7168333, f89656a) plus current uncommitted WebRTC and platform work. Business code was not modified.

## Findings

1. **P1 — Explicit mediaUrl is dropped by session snapshots.** `src/app/App.tsx:636–660` rebuilds the session without mediaUrl; the periodic emit at 681–693 and replacement at 1497–1504 remove an imported/custom gateway URL. The ImagePanel then falls back to the derived port 8787 URL. Preserve the field and callback dependency. Reproduced by evaluating the actual snapshot callback.

2. **P1 — appsrc is not actually bounded to one frame.** `ros2/robviz_video_gateway/robviz_video_gateway/topic_streamer.py:210–214` uses block=false/max-buffers=1, default leaky-type=none. The producer at 516–526 keeps pushing and does not handle enough-data. In GStreamer max-buffers is a flow-control threshold, not automatic eviction; slow encoding/downstream blockage can accumulate raw frames, memory, and latency despite latest_msg. Use a drop-oldest policy at the raw-frame queue, not arbitrary RTP packet dropping. Verified against official appsrc semantics; local Gst runtime unavailable.

3. **P2 — Inactive machine tabs keep WebRTC viewers alive.** `src/panels/ImagePanel.tsx:193–217` only gates watches by topic/collapsed/activeWebRtc, not session active state. App keeps all sessions mounted (`src/app/App.tsx:1663–1683`), and setStreamingActive only affects Foxglove. Hidden image panels retain encoding, transmission, decode, and requested FPS. Pass the session activity state into media watch lifecycle.

4. **P2 — Signaling disconnect cannot recover with existing viewers.** `src/media/WebRtcStreamClient.ts:164–168` sets error but keeps the closed ws, peer, and poller. addViewer (76–78) only connects when ws is null, so even another panel reuses the dead socket after gateway restart/network interruption. Clean up the closed connection and retry while viewers remain; also monitor peer connection failure. Dead-socket reuse reproduced.

5. **P2 — Packed RGB/BGR is incompatible with GStreamer's default row stride.** `ros2/robviz_video_gateway/robviz_video_gateway/topic_streamer.py:165–178` strips padding into width*3 rows, then wraps the bytes without GstVideoMeta (518). RGB/BGR default stride is round-up-to-4(width*3). A valid 642x480 input produces 924480 bytes, while default GstVideoInfo expects 925440; this can yield map failure/no video or misaligned rows. Preserve the appropriate Gst stride or attach explicit stride metadata. Actual image_bytes output compared with documented layout; no local encoder runtime.

6. **P2 — Raw rendering choice is not persisted; restored depth panels default to unsupported WebRTC.** `src/panels/ImagePanel.tsx:163–169,354` always initializes useWebRtc=true and only toggles local state. onTopicChange persists topic/preferRaw (topic preference), not useWebRtc. Since all sensor_msgs/Image schemas are classified as WebRTC-capable, a 16UC1/32FC1 panel switched to Raw reverts after reload to a gateway that rejects depth. Preserve the selected transport and distinguish color from depth before choosing the WebRTC route; do not silently force high-bandwidth fallback for unavailable color gateways.

7. **P2 — Existing Raw decoder ignores row padding and endianness.** `src/panels/ImagePanel.tsx:242–247` discards payload.step; conversion/pixel lookup assume packed little-endian pixels. Worker payload preparation (`src/worker/connection.worker.ts:110–134`) drops is_bigendian. A 2x2 RGB frame with step=8 decodes the second-row pixel as [90,91,7] instead of [7,8,9]. Normalize validated rows/endianness in the common payload path. Padding reproduced. This predates the new WebRTC work.

8. **P2 — Built-in teleop removal does not migrate existing v2 layouts.** `src/core/appConfig.ts:292–299` accepts existing kind=teleop unchanged, while `src/app/App.tsx:1211–1223` only supports the new plugin-section kind. Previous default workspaces render an unknown panel and do not get the replacement automatically (autoAddPluginSections defaults false for old v2 files). Migrate the panel kind and corresponding dock parameters while preserving its id/layout. Old config parser result reproduced.

## Checks and limits

- npm test: 29 files, 133 tests passed; Vitest printed a shutdown timeout warning.
- npm run lint and npm run build passed; build reported large chunks.
- `npx tsx .planning/review-image/reproduce.ts` confirms four source/client defects.
- Actual Python image_bytes extracted via AST confirms 642x480 buffer/layout mismatch.
- Current ImagePanel tests only exercise topic preference; WebRTC tests only exercise URL derivation/signaling sharing/FPS, not real video or recovery.
- Local ROS/GStreamer and gi are unavailable. No robot/remote host accessed; real browser playback, congestion, and multi-viewer isolation remain unverified.
- Upstream references: https://gstreamer.freedesktop.org/documentation/app/appsrc.html and https://gstreamer.freedesktop.org/documentation/additional/design/mediatype-video-raw.html

# Project review: images and recent changes

Review followed by user-approved fixes for all eight findings. Existing implementation plans remain unchanged.

## Phases
- [complete] Inspect uncommitted changes and recent commits; trace image transport end to end.
- [complete] Reproduce concrete defects and run available checks.
- [complete] Report prioritized findings with file/line references and verification limits.
- [complete] Fix configuration persistence/migration and Raw image normalization; add checks.
- [complete] Fix WebRTC routing, saved transport, inactivity, and reconnection; add lifecycle checks.
- [complete] Fix gateway queue bounds and video row layout; add gateway checks.
- [complete] Run full regression/lint/build and report validation limits.

## Next Step
All eight code fixes are implemented. Remaining integration acceptance requires a ROS/GStreamer host and real browser: native queue test, playback/recovery, weak-network and multi-viewer checks. See fixes.md.

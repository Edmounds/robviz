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
Apply the follow-up fix for selectable RGB capture topics and the invalid Foxglove heartbeat parameter name.

## Follow-up Phase
- [x] Use a valid ROS parameter name for the Foxglove heartbeat.
- [x] Select the capture source from managed RGB image topics.
- [x] Run frontend checks and preserve unrelated dirty changes.
- **Status:** complete. Live ROS discovery still requires an authorized Foxglove service restart.

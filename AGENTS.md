# RobViz Project Guidance

RobViz is a single-user ROS 2 visualization and interaction base, not a robot-specific control application. The host provides Foxglove connectivity, message transport/decoding, visualization, workspaces, session lifecycle, extension points, and fault isolation. Keep the core small and reusable.

- Robot-specific topic names, commands, control policies, workflows, and safety behavior belong to the user's code or plugins. Do not add new robot-specific behavior to the host merely because one robot needs it. Existing built-in tools do not imply that every robot workflow belongs in core.
- The host still owns its transport correctness boundaries: while the robot connection is unavailable, page publish/service operations must fail promptly and cannot reach the robot. Offline workspace and file editing remain available. Plugins own their control policies and cleanup, including what to do when their machine tab is inactive; the host does not enforce an inactive-tab command policy.
- Preserve the existing configuration contract: browser storage is the local auto-restore source; explicit file export/import is the portable backup. Do not put SSH credentials in exported workspace configuration.
- Keep connection and rendering contracts robust when an individual topic or panel fails; isolate failures rather than bringing down the whole session. Prefer existing plugin APIs and local patterns over new host abstractions.
- This project is currently for one person. Do not introduce accounts, multi-user authorization, or a new SSH credential storage design without an explicit request.

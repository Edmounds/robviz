# Review observations

- Scope: uncommitted work (new WebRTC gateway/client, platform refactor) and latest commits.
- Existing WebRTC plan explicitly records browser playback and congestion tests as unverified.
- Investigate depth topics defaulting to WebRTC, socket reconnect lifecycle, row padding/endianness on Raw path, gateway per-viewer isolation.
- Confirmed by source: buildSessionConfig omits mediaUrl; periodic snapshots replace the session, so explicit signaling URLs are lost.
- Confirmed by source: inactive sessions remain mounted; ImagePanel does not receive active state, so WebRTC watches are not suspended by WorkerBridge.setStreamingActive.
- Client socket close retains this.ws and RTCPeerConnection and has no retry; adding viewers does not reconnect a closed socket.
- Gateway uses appsrc block=false max-buffers=1 without leaky policy; investigate whether this actually bounds queued raw frames.
- Raw canvas ignores payload.step and worker drops is_bigendian; existing tests named ImagePanel only cover topic sorting/preferences.
- Official appsrc documentation confirms max-buffers emits enough-data; only a leaky policy or producer flow control prevents excessive queueing. Current producer listens to neither enough-data nor need-data and keeps pushing with block=false.
- Official raw-video layout specifies RGB/BGR default stride RU4(width*3). Gateway strips ROS padding into tightly packed buffers without GstVideoMeta, incompatible with widths not divisible by four (e.g. 642x480).
- Existing v2 teleop panel kinds are not migrated after removing the built-in renderer; parser keeps kind=teleop and renderer falls through to unknownPanel.
- Executed read-only reproduction script: dead signaling socket, padded Raw RGB corruption, dropped mediaUrl all reproduced.

import { describe, expect, it } from "vitest";
import { availableImageTopics } from "../../src/core/imageTopics";

describe("probed WebRTC image sources", () => {
  it("lists only verified playable raw sources, not idle publishers or JPEG", () => {
    const topics = availableImageTopics({ streams: {
      "/camera/raw": { available: true, transport: "webrtc" },
      "/camera/idle": { available: false, transport: "webrtc" },
      "/camera/unprobed": { transport: "webrtc" },
      "/camera/compressed": { available: true, transport: "jpeg" },
      "/camera/wrong": { available: "true", transport: "webrtc" },
      "not a topic": { available: true, transport: "webrtc" },
    } });
    expect(topics).toEqual([{ topic: "/camera/raw", schemaName: "sensor_msgs/msg/Image" }]);
  });

  it.each([null, [], {}, { streams: [] }, { streams: null }])("rejects malformed metadata: %j", (value) => {
    expect(availableImageTopics(value)).toEqual([]);
  });
});

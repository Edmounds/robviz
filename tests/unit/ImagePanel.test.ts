import { describe, expect, it } from "vitest";

import {
  preferredImageTopic,
  sortedImageTopics,
} from "../../src/core/imageTopics";
import type { TopicInfo } from "../../src/core/FoxgloveConnection";

const RAW = "sensor_msgs/msg/Image";
const COMPRESSED = "sensor_msgs/msg/CompressedImage";

function topic(topic: string, schemaName: string): TopicInfo {
  return { topic, schemaName };
}

describe("image topic preference", () => {
  it("sorts a compressed transport before its raw topic", () => {
    const topics = [
      topic("/camera/image_raw", RAW),
      topic("/odom", "nav_msgs/msg/Odometry"),
      topic("/camera/image_raw/compressed", COMPRESSED),
    ];

    expect(sortedImageTopics(topics).map((item) => item.topic)).toEqual([
      "/camera/image_raw/compressed",
      "/camera/image_raw",
    ]);
  });

  it("upgrades a restored raw topic when its compressed transport appears", () => {
    const topics = [
      topic("/camera/image_raw", RAW),
      topic("/camera/image_raw/compressed", COMPRESSED),
    ];

    expect(preferredImageTopic(topics, "/camera/image_raw", "/camera/image_raw", false)).toBe(
      "/camera/image_raw/compressed",
    );
  });

  it("keeps a raw topic when no matching compressed transport exists", () => {
    const topics = [topic("/camera/image_raw", RAW)];

    expect(preferredImageTopic(topics, "/camera/image_raw", "/camera/image_raw", false)).toBe(
      "/camera/image_raw",
    );
  });

  it("respects a persisted manual raw selection", () => {
    const topics = [
      topic("/camera/image_raw", RAW),
      topic("/camera/image_raw/compressed", COMPRESSED),
    ];

    expect(preferredImageTopic(topics, "/camera/image_raw", "/camera/image_raw", true)).toBe(
      "/camera/image_raw",
    );
  });

  it("automatically selects compressed for one logical camera", () => {
    const topics = [
      topic("/camera/image_raw", RAW),
      topic("/camera/image_raw/compressed", COMPRESSED),
    ];

    expect(preferredImageTopic(topics, "", undefined, false)).toBe(
      "/camera/image_raw/compressed",
    );
  });

  it("does not choose arbitrarily when multiple cameras are available", () => {
    const topics = [
      topic("/front/image_raw", RAW),
      topic("/front/image_raw/compressed", COMPRESSED),
      topic("/rear/image_raw", RAW),
      topic("/rear/image_raw/compressed", COMPRESSED),
    ];

    expect(preferredImageTopic(topics, "", undefined, false)).toBe("");
  });

  it("does not auto-select when a second camera only has a raw topic", () => {
    const topics = [
      topic("/front/image_raw", RAW),
      topic("/front/image_raw/compressed", COMPRESSED),
      topic("/rear/image_raw", RAW),
    ];

    expect(preferredImageTopic(topics, "", undefined, false)).toBe("");
  });
});

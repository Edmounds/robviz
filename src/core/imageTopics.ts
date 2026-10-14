import type { TopicInfo } from "./FoxgloveConnection";

const RAW_IMAGE_SCHEMA = "sensor_msgs/msg/Image";

/** Only accept sources that the video gateway has probed successfully. */
export function availableImageTopics(metadata: unknown): TopicInfo[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  const streams = (metadata as { streams?: unknown }).streams;
  if (!streams || typeof streams !== "object" || Array.isArray(streams)) return [];
  return Object.entries(streams)
    .slice(0, 64)
    .filter(([topic, value]) => {
      if (!topic.startsWith("/") || topic.length > 256 || /\s/.test(topic)) return false;
      if (!value || typeof value !== "object" || Array.isArray(value)) return false;
      const stream = value as { available?: unknown; transport?: unknown };
      return stream.available === true && stream.transport === "webrtc";
    })
    .map(([topic]) => ({ topic, schemaName: RAW_IMAGE_SCHEMA }))
    .sort((left, right) => left.topic.localeCompare(right.topic));
}

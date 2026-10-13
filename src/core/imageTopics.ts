import type { TopicInfo } from "./FoxgloveConnection";

const RAW_IMAGE_SCHEMA = "sensor_msgs/msg/Image";
const COMPRESSED_IMAGE_SCHEMA = "sensor_msgs/msg/CompressedImage";
const COMPRESSED_SUFFIX = "/compressed";
const IMAGE_SCHEMAS = new Set([RAW_IMAGE_SCHEMA, COMPRESSED_IMAGE_SCHEMA]);

function imageBaseTopic(info: TopicInfo): string {
  return info.schemaName === COMPRESSED_IMAGE_SCHEMA && info.topic.endsWith(COMPRESSED_SUFFIX)
    ? info.topic.slice(0, -COMPRESSED_SUFFIX.length)
    : info.topic;
}

export function sortedImageTopics(topics: TopicInfo[]): TopicInfo[] {
  return topics
    .filter((info) => IMAGE_SCHEMAS.has(info.schemaName))
    .sort((left, right) => {
      const byBase = imageBaseTopic(left).localeCompare(imageBaseTopic(right));
      if (byBase !== 0) return byBase;
      if (left.schemaName !== right.schemaName) {
        return left.schemaName === COMPRESSED_IMAGE_SCHEMA ? -1 : 1;
      }
      return left.topic.localeCompare(right.topic);
    });
}

export function preferredImageTopic(
  topics: TopicInfo[],
  currentTopic: string,
  initialTopic: string | undefined,
  preferRaw: boolean,
): string {
  if (preferRaw) {
    if (currentTopic) {
      if (currentTopic.endsWith(COMPRESSED_SUFFIX)) {
        const raw = currentTopic.slice(0, -COMPRESSED_SUFFIX.length);
        if (topics.some((info) => info.topic === raw && info.schemaName === RAW_IMAGE_SCHEMA)) {
          return raw;
        }
      }
      return currentTopic;
    }
    if (initialTopic) {
      const raw = initialTopic.endsWith(COMPRESSED_SUFFIX)
        ? initialTopic.slice(0, -COMPRESSED_SUFFIX.length)
        : initialTopic;
      if (topics.some((info) => info.topic === raw && info.schemaName === RAW_IMAGE_SCHEMA)) {
        return raw;
      }
      if (topics.some((info) => info.topic === initialTopic)) {
        return initialTopic;
      }
    }
    const rawTopics = topics.filter((info) => info.schemaName === RAW_IMAGE_SCHEMA);
    if (rawTopics.length === 1) return rawTopics[0].topic;
    return "";
  }

  if (currentTopic.endsWith(COMPRESSED_SUFFIX)) return currentTopic;

  if (initialTopic) {
    const compressed = `${initialTopic}${COMPRESSED_SUFFIX}`;
    return topics.some(
      (info) => info.topic === compressed && info.schemaName === COMPRESSED_IMAGE_SCHEMA,
    )
      ? compressed
      : currentTopic;
  }

  if (currentTopic) return currentTopic;
  const rawTopics = topics.filter((info) => info.schemaName === RAW_IMAGE_SCHEMA);
  if (rawTopics.length !== 1) return "";
  const compressed = `${rawTopics[0].topic}${COMPRESSED_SUFFIX}`;
  return topics.some(
    (candidate) =>
      candidate.topic === compressed && candidate.schemaName === COMPRESSED_IMAGE_SCHEMA,
  )
    ? compressed
    : "";
}

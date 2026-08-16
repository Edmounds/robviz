import { describe, expect, it } from "vitest";

import {
  echoPayloadValue,
  flattenEchoFields,
} from "../../src/core/topicEcho";
import type { ImagePayload } from "../../src/worker/protocol";

describe("topic echo fields", () => {
  it("把嵌套消息和小数组展开成可选择的叶子路径", () => {
    const fields = flattenEchoFields({
      header: { stamp: { sec: 12n, nanosec: 300 }, frame_id: "map" },
      pose: { position: { x: 1.25, y: -2 } },
      flags: [true, false],
    });

    expect(fields).toEqual([
      { path: "header.stamp.sec", value: "12" },
      { path: "header.stamp.nanosec", value: "300" },
      { path: "header.frame_id", value: "map" },
      { path: "pose.position.x", value: "1.25" },
      { path: "pose.position.y", value: "-2" },
      { path: "flags[0]", value: "true" },
      { path: "flags[1]", value: "false" },
    ]);
  });

  it("长数组和二进制视图只生成一个有界摘要字段", () => {
    const fields = flattenEchoFields({
      data: new Uint8Array([1, 2, 3, 4, 5, 6]),
      ranges: Array.from({ length: 40 }, (_, index) => index / 10),
    });

    expect(fields).toHaveLength(2);
    expect(fields[0]).toEqual({ path: "data", value: "Uint8Array[6] 1, 2, 3, 4, 5, 6" });
    expect(fields[1]?.path).toBe("ranges");
    expect(fields[1]?.value).toMatch(/^Array\[40\] 0, 0.1, 0.2/);
    expect(fields.some((field) => field.path === "ranges[0]")).toBe(false);
  });

  it("限制异常宽消息的字段数量", () => {
    const message = Object.fromEntries(
      Array.from({ length: 400 }, (_, index) => [`field_${index}`, index]),
    );

    expect(flattenEchoFields(message)).toHaveLength(256);
  });

  it("去掉 Worker 传输层 kind 并保留图像消息元数据", () => {
    const payload: ImagePayload = {
      kind: "image",
      header: { stamp: { sec: 1, nanosec: 2 }, frame_id: "camera" },
      width: 640,
      height: 480,
      encoding: "rgb8",
      step: 1920,
      data: new Uint8Array(640 * 480 * 3),
    };

    const fields = flattenEchoFields(echoPayloadValue(payload));

    expect(fields.some((field) => field.path === "kind")).toBe(false);
    expect(fields).toContainEqual({ path: "width", value: "640" });
    expect(fields).toContainEqual({ path: "data", value: "Uint8Array[921600] 0, 0, 0, 0, 0, 0, 0, 0, …" });
  });
});

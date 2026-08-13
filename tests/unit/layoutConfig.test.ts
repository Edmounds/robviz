import { describe, expect, it } from "vitest";

import type { LayoutConfig } from "../../src/core/layoutConfig";
import { parseLayout, serializeLayout } from "../../src/core/layoutConfig";

function fullConfig(): LayoutConfig {
  return {
    version: 1,
    url: "ws://robot:8765",
    fixedFrame: "odom",
    theme: "light",
    pcdVoxel: 0.05,
    followFrame: "base_link",
    activeTopics: [
      { topic: "/scan", schemaName: "sensor_msgs/msg/LaserScan" },
      { topic: "/cloud_registered", schemaName: "sensor_msgs/msg/PointCloud2", accumulate: true },
    ],
    panels: [
      { kind: "image", state: { topic: "/camera/image_raw" } },
      { kind: "plot", state: { series: [{ topic: "/odom", field: "twist.twist.linear.x" }] } },
    ],
    camera: { position: [8, -8, 8], target: [0, 0, 0] },
  };
}

describe("layoutConfig", () => {
  it("序列化 → 解析往返无损", () => {
    const config = fullConfig();
    expect(parseLayout(serializeLayout(config))).toEqual(config);
  });

  it("最小配置补默认值", () => {
    const parsed = parseLayout(
      JSON.stringify({ version: 1, url: "ws://localhost:8765", fixedFrame: "map" }),
    );
    expect(parsed.theme).toBe("dark");
    expect(parsed.pcdVoxel).toBe(0.1);
    expect(parsed.activeTopics).toEqual([]);
    expect(parsed.panels).toEqual([]);
    expect(parsed.followFrame).toBeUndefined();
    expect(parsed.camera).toBeUndefined();
  });

  it("非 JSON 抛错", () => {
    expect(() => parseLayout("not json {")).toThrow("不是合法 JSON");
  });

  it("版本不符抛错", () => {
    expect(() =>
      parseLayout(JSON.stringify({ version: 2, url: "ws://x", fixedFrame: "map" })),
    ).toThrow("version");
  });

  it("字段类型错误抛错并带路径", () => {
    expect(() =>
      parseLayout(
        JSON.stringify({
          version: 1,
          url: "ws://x",
          fixedFrame: "map",
          camera: { position: [1, 2], target: [0, 0, 0] },
        }),
      ),
    ).toThrow("camera.position");
  });

  it("插件面板任意 state 透传", () => {
    const parsed = parseLayout(
      JSON.stringify({
        version: 1,
        url: "ws://x",
        fixedFrame: "map",
        panels: [{ kind: "my-plugin:gauge", state: { anything: [1, { deep: true }] } }],
      }),
    );
    expect(parsed.panels[0].state).toEqual({ anything: [1, { deep: true }] });
  });
});

import { describe, expect, it } from "vitest";

import type { LayoutConfig } from "../../src/core/layoutConfig";
import { parseLayout, serializeLayout } from "../../src/core/layoutConfig";

function fullConfig(): LayoutConfig {
  return {
    version: 1,
    url: "ws://robot:8765",
    fixedFrame: "odom",
    theme: "light",
    settings: {
      language: "en",
      groundVisible: false,
      tfAxesLineWidth: 3,
      disabledPluginIds: ["example-odom-hud"],
    },
    workspace: {
      sidebarPercent: 24,
      dockPercent: 42,
      urdfInspectorPercent: 38,
    },
    pcdVoxel: 0.05,
    followFrame: "base_link",
    activeTopics: [
      { topic: "/scan", schemaName: "sensor_msgs/msg/LaserScan" },
      {
        topic: "/cloud_registered",
        schemaName: "sensor_msgs/msg/PointCloud2",
        pointCloud: {
          pointSize: 3.5,
          opacity: 0.75,
          colorMode: "height",
          flatColor: "#4ea1ff",
          rangeMode: "manual",
          rangeMin: -1,
          rangeMax: 2,
          accumulate: true,
        },
      },
    ],
    panels: [
      { kind: "image", state: { topic: "/camera/image_raw" }, sizePercent: 40 },
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
    expect(parsed.settings).toEqual({
      language: "zh-CN",
      groundVisible: true,
      tfAxesLineWidth: 1.5,
      disabledPluginIds: [],
    });
    expect(parsed.workspace).toEqual({
      sidebarPercent: 22,
      dockPercent: 35,
      urdfInspectorPercent: 35,
    });
    expect(parsed.pcdVoxel).toBe(0.1);
    expect(parsed.activeTopics).toEqual([]);
    expect(parsed.panels).toEqual([]);
    expect(parsed.followFrame).toBeUndefined();
    expect(parsed.camera).toBeUndefined();
  });

  it("兼容旧 accumulate 字段并校验点云手动范围", () => {
    const legacy = parseLayout(JSON.stringify({
      version: 1,
      url: "ws://x",
      fixedFrame: "map",
      activeTopics: [{ topic: "/cloud", schemaName: "sensor_msgs/msg/PointCloud2", accumulate: true }],
    }));
    expect(legacy.activeTopics[0].accumulate).toBe(true);

    expect(() => parseLayout(JSON.stringify({
      version: 1,
      url: "ws://x",
      fixedFrame: "map",
      activeTopics: [{
        topic: "/cloud",
        schemaName: "sensor_msgs/msg/PointCloud2",
        pointCloud: {
          pointSize: 2,
          opacity: 1,
          colorMode: "field",
          flatColor: "#ffffff",
          rangeMode: "manual",
          rangeMin: 3,
          rangeMax: 2,
          accumulate: false,
        },
      }],
    }))).toThrow("rangeMax");
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

  it("校验通用设置、布局比例与面板尺寸", () => {
    const base = { version: 1, url: "ws://x", fixedFrame: "map" };
    expect(() => parseLayout(JSON.stringify({
      ...base,
      settings: { tfAxesLineWidth: 7 },
    }))).toThrow("settings.tfAxesLineWidth");
    expect(() => parseLayout(JSON.stringify({
      ...base,
      workspace: { sidebarPercent: 101 },
    }))).toThrow("workspace.sidebarPercent");
    expect(() => parseLayout(JSON.stringify({
      ...base,
      panels: [{ kind: "image", sizePercent: 0 }],
    }))).toThrow("panels.0.sizePercent");
  });
});

import { describe, expect, it } from "vitest";

import {
  createDefaultSession,
  parseAppConfig,
  serializeAppConfig,
  type AppConfig,
} from "../../src/core/appConfig";

describe("appConfig", () => {
  it("round-trips a multi-session v2 workspace", () => {
    const first = createDefaultSession("robot-a", "Robot A");
    const second = {
      ...createDefaultSession("robot-b", "Robot B"),
      url: "ws://192.168.8.112:8765",
      scene: { groundVisible: false, tfAxesLineWidth: 3 },
      panels: [
        ...createDefaultSession("robot-b", "Robot B").panels,
        { id: "image-1", kind: "image", state: { topic: "/camera/image_raw" } },
      ],
      dockLayout: { grid: { root: { type: "branch" } } },
    };
    const config: AppConfig = {
      version: 2,
      activeSessionId: second.id,
      theme: "light",
      settings: { language: "en", disabledPluginIds: ["example-odom-hud"] },
      sessions: [first, second],
    };

    expect(parseAppConfig(serializeAppConfig(config))).toEqual(config);
  });

  it("migrates a v1 layout into one machine session", () => {
    const migrated = parseAppConfig(JSON.stringify({
      version: 1,
      url: "ws://robot:8765",
      fixedFrame: "odom",
      theme: "light",
      settings: {
        language: "en",
        groundVisible: false,
        tfAxesLineWidth: 2.5,
        disabledPluginIds: ["example-odom-hud"],
      },
      workspace: { sidebarPercent: 24, dockPercent: 42, urdfInspectorPercent: 38 },
      pcdVoxel: 0.05,
      followFrame: "base_link",
      activeTopics: [{ topic: "/scan", schemaName: "sensor_msgs/msg/LaserScan" }],
      panels: [{ kind: "image", state: { topic: "/camera/image_raw" }, sizePercent: 40 }],
      camera: { position: [8, -8, 8], target: [0, 0, 0] },
    }));

    expect(migrated.version).toBe(2);
    expect(migrated.theme).toBe("light");
    expect(migrated.settings).toEqual({ language: "en", disabledPluginIds: ["example-odom-hud"] });
    expect(migrated.sessions).toHaveLength(1);
    expect(migrated.activeSessionId).toBe(migrated.sessions[0].id);
    expect(migrated.sessions[0]).toMatchObject({
      url: "ws://robot:8765",
      fixedFrame: "odom",
      scene: { groundVisible: false, tfAxesLineWidth: 2.5 },
      urdfInspectorPercent: 38,
      pcdVoxel: 0.05,
      followFrame: "base_link",
    });
    expect(migrated.sessions[0].panels).toContainEqual({
      id: "legacy-panel-1",
      kind: "image",
      state: { topic: "/camera/image_raw" },
    });
    const dockLayout = migrated.sessions[0].dockLayout as {
      grid: { root: { data: Array<{ size: number; data?: Array<{ size: number }> }> } };
    };
    expect(dockLayout.grid.root.data.map((item) => item.size)).toEqual([760, 240]);
    expect(dockLayout.grid.root.data[0].data?.map((item) => item.size)).toEqual([580, 420]);
  });

  it("rejects v2 workspaces whose active session does not exist", () => {
    expect(() => parseAppConfig(JSON.stringify({
      version: 2,
      activeSessionId: "missing",
      theme: "dark",
      settings: { language: "zh-CN", disabledPluginIds: [] },
      sessions: [createDefaultSession("robot-a", "Robot A")],
    }))).toThrow("activeSessionId");
  });

  it("keeps an opaque dock layout for dockview to validate", () => {
    const session = createDefaultSession("robot-a", "Robot A");
    const parsed = parseAppConfig(JSON.stringify({
      version: 2,
      activeSessionId: session.id,
      theme: "dark",
      settings: { language: "zh-CN", disabledPluginIds: [] },
      sessions: [{ ...session, dockLayout: { unexpected: true } }],
    }));

    expect(parsed.sessions[0].dockLayout).toEqual({ unexpected: true });
  });
});

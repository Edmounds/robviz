import { describe, expect, it } from "vitest";

import {
  APP_CONFIG_STORAGE_KEY,
  createDefaultSession,
  parseAppConfig,
  renameAppSession,
  saveAppConfigToStorage,
  serializeAppConfig,
  type AppConfig,
} from "../../src/core/appConfig";

describe("appConfig", () => {
  it("saves the serialized workspace to browser storage", () => {
    const session = createDefaultSession("robot-a", "Robot A");
    const config: AppConfig = {
      version: 2,
      activeSessionId: session.id,
      theme: "dark",
      settings: { language: "zh-CN", disabledPluginIds: [] },
      sessions: [session],
    };
    const values = new Map<string, string>();

    saveAppConfigToStorage(config, {
      setItem(key, value) {
        values.set(key, value);
      },
    });

    expect(values.get(APP_CONFIG_STORAGE_KEY)).toBe(serializeAppConfig(config));
  });

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

  it("renames only the requested session, trims the label, and ignores empty drafts", () => {
    const first = createDefaultSession("robot-a", "Robot A");
    const second = createDefaultSession("robot-b", "Robot B");
    const config: AppConfig = {
      version: 2,
      activeSessionId: first.id,
      theme: "dark",
      settings: { language: "zh-CN", disabledPluginIds: [] },
      sessions: [first, second],
    };

    const renamed = renameAppSession(config, second.id, "  Mobile Base  ");
    expect(renamed.sessions.map((session) => session.name)).toEqual(["Robot A", "Mobile Base"]);
    expect(renameAppSession(config, second.id, "   ")).toBe(config);
    expect(renameAppSession(config, "missing", "Other")).toBe(config);
    expect(parseAppConfig(serializeAppConfig(renamed)).sessions[1].name).toBe("Mobile Base");
  });

  it("retains mediaUrl and explicit Raw mode in storage/file round trips", () => {
    const session = { ...createDefaultSession("robot", "Robot"), mediaUrl: "wss://video.example/ws",
      panels: [{ id: "depth", kind: "image", state: { topic: "/camera/depth", preferRaw: true, useWebRtc: false } }] };
    const config: AppConfig = { version: 2, activeSessionId: session.id, theme: "dark",
      settings: { language: "zh-CN", disabledPluginIds: [] }, sessions: [session] };
    const storage = new Map<string, string>();
    saveAppConfigToStorage(config, { setItem: (key, value) => storage.set(key, value) });
    expect(parseAppConfig(storage.get(APP_CONFIG_STORAGE_KEY)!).sessions[0]).toEqual(session);
  });

  it("migrates old teleop panel and dock params without changing ids/layout or opening other sections", () => {
    const old = { ...createDefaultSession("robot", "Robot"), autoAddPluginSections: false,
      panels: [{ id: "old-teleop", kind: "teleop", state: { retained: true } }],
      dockLayout: { grid: { unchanged: true }, panels: {
        "old-teleop": { id: "old-teleop", params: { panelId: "old-teleop", kind: "teleop", custom: 1 } },
      } } };
    const config = { version: 2, activeSessionId: old.id, theme: "dark",
      settings: { language: "zh-CN", disabledPluginIds: ["teleop"] }, sessions: [old] };
    const migrated = parseAppConfig(JSON.stringify(config));
    expect(migrated.sessions[0].panels).toEqual([
      { id: "old-teleop", kind: "plugin-section:teleop:teleop", state: { retained: true } },
    ]);
    expect(migrated.sessions[0].dockLayout).toEqual({ grid: { unchanged: true }, panels: {
      "old-teleop": { id: "old-teleop", params: { panelId: "old-teleop", kind: "plugin-section:teleop:teleop", custom: 1 } },
    } });
    expect(migrated.sessions[0].initializedPluginSectionIds).toEqual(["teleop:teleop"]);
    expect(migrated.sessions[0].autoAddPluginSections).toBe(false);
    expect(migrated.settings.disabledPluginIds).toEqual(["teleop"]);
    expect(parseAppConfig(serializeAppConfig(migrated))).toEqual(migrated);
  });

  it("does not add teleop to workspaces where it was closed", () => {
    const session = createDefaultSession("robot", "Robot");
    const config = { version: 2, activeSessionId: session.id, theme: "dark",
      settings: { language: "zh-CN", disabledPluginIds: [] }, sessions: [session] };
    expect(parseAppConfig(JSON.stringify(config)).sessions[0].panels).toEqual(session.panels);
  });

  it("round-trips per-session plugin state and uses plugin panels in fresh defaults", () => {
    const session = {
      ...createDefaultSession("robot-a", "Robot A"),
      pluginState: {
        "nav-goals": { goalTopic: "/navigate", initialPoseTopic: "/localize" },
        teleop: { topic: "/base/cmd_vel", maxLin: 0.8, maxAng: 1.5 },
      },
      initializedPluginSectionIds: ["teleop:teleop"],
    };
    expect(session.panels.some((panel) => panel.kind === "teleop")).toBe(false);
    expect(session.autoAddPluginSections).toBe(true);
    const config: AppConfig = {
      version: 2,
      activeSessionId: session.id,
      theme: "dark",
      settings: { language: "zh-CN", disabledPluginIds: [] },
      sessions: [session],
    };

    expect(parseAppConfig(serializeAppConfig(config)).sessions[0].pluginState).toEqual(session.pluginState);
    expect(parseAppConfig(serializeAppConfig(config)).sessions[0].autoAddPluginSections).toBe(true);
    expect(parseAppConfig(serializeAppConfig(config)).sessions[0].initializedPluginSectionIds).toEqual(["teleop:teleop"]);
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
      autoAddPluginSections: false,
    });
    expect(migrated.sessions[0].panels).toContainEqual({
      id: "legacy-panel-1",
      kind: "image",
      state: { topic: "/camera/image_raw" },
    });
    type LayoutNode = { type: "leaf"; data: { views: string[] } } | { type: "branch"; data: LayoutNode[] };
    const migratedLayout = migrated.sessions[0].dockLayout as { grid: { root: LayoutNode } };
    const collectViews = (node: LayoutNode): string[] => node.type === "leaf"
      ? node.data.views
      : node.data.flatMap(collectViews);
    expect(collectViews(migratedLayout.grid.root).every((view) =>
      migrated.sessions[0].panels.some((panel) => panel.id === view),
    )).toBe(true);
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

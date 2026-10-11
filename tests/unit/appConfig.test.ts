import { describe, expect, it } from "vitest";

import {
  APP_CONFIG_STORAGE_KEY,
  computeOrderedTabs,
  createDefaultSession,
  insertModeTab,
  parseAppConfig,
  renameAppSession,
  saveAppConfigToStorage,
  serializeAppConfig,
  type AppConfig,
} from "../../src/core/appConfig";

describe("appConfig", () => {
  it("saves the serialized workspace to browser storage", () => {
    const session = createDefaultSession("robot-a", "Robot A");
    expect(session.panels.map((panel) => panel.kind)).toEqual(["3d", "topics", "tf-tree"]);
    const config: AppConfig = {
      version: 3,
      activeSessionId: session.id,
      theme: "dark",
      settings: { language: "zh-CN", fontScale: 1, disabledPluginIds: [] },
      sessions: [session],
    };
    const values = new Map<string, string>();

    saveAppConfigToStorage(config, {
      setItem(key, value) {
        values.set(key, value);
      },
    });

    expect(APP_CONFIG_STORAGE_KEY).toBe("robviz.layout.v3");
    expect(values.get(APP_CONFIG_STORAGE_KEY)).toBe(serializeAppConfig(config));
  });

  it("round-trips a multi-session v3 workspace", () => {
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
      version: 3,
      activeSessionId: second.id,
      theme: "light",
      settings: { language: "en", fontScale: 1.25, disabledPluginIds: ["example-odom-hud"], modeTabOrder: [] },
      sessions: [first, second],
    };

    expect(parseAppConfig(serializeAppConfig(config))).toEqual(config);
  });

  it("renames only the requested session, trims the label, and ignores empty drafts", () => {
    const first = createDefaultSession("robot-a", "Robot A");
    const second = createDefaultSession("robot-b", "Robot B");
    const config: AppConfig = {
      version: 3,
      activeSessionId: first.id,
      theme: "dark",
      settings: { language: "zh-CN", fontScale: 1, disabledPluginIds: [] },
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
    const config: AppConfig = { version: 3, activeSessionId: session.id, theme: "dark",
      settings: { language: "zh-CN", fontScale: 1, disabledPluginIds: [] }, sessions: [session] };
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
    const config = { version: 3, activeSessionId: old.id, theme: "dark",
      settings: { language: "zh-CN", fontScale: 1, disabledPluginIds: ["teleop"] }, sessions: [old] };
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
    const config = { version: 3, activeSessionId: session.id, theme: "dark",
      settings: { language: "zh-CN", fontScale: 1, disabledPluginIds: [] }, sessions: [session] };
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
      version: 3,
      activeSessionId: session.id,
      theme: "dark",
      settings: { language: "zh-CN", fontScale: 1, disabledPluginIds: [] },
      sessions: [session],
    };

    expect(parseAppConfig(serializeAppConfig(config)).sessions[0].pluginState).toEqual(session.pluginState);
    expect(parseAppConfig(serializeAppConfig(config)).sessions[0].autoAddPluginSections).toBe(true);
    expect(parseAppConfig(serializeAppConfig(config)).sessions[0].initializedPluginSectionIds).toEqual(["teleop:teleop"]);
  });

  it("rejects legacy v1 configurations without migrating", () => {
    expect(() => parseAppConfig(JSON.stringify({
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
    }))).toThrow("version");
  });

  it("rejects legacy v2 configurations without migrating", () => {
    const session = createDefaultSession("robot-a", "Robot A");
    expect(() => parseAppConfig(JSON.stringify({
      version: 2,
      activeSessionId: session.id,
      theme: "dark",
      settings: { language: "zh-CN", fontScale: 1, disabledPluginIds: [] },
      sessions: [session],
    }))).toThrow("version");
  });

  it("rejects v3 workspaces whose active session does not exist", () => {
    expect(() => parseAppConfig(JSON.stringify({
      version: 3,
      activeSessionId: "missing",
      theme: "dark",
      settings: { language: "zh-CN", fontScale: 1, disabledPluginIds: [] },
      sessions: [createDefaultSession("robot-a", "Robot A")],
    }))).toThrow("activeSessionId");
  });

  it("validates fontScale bounds in v3 workspaces", () => {
    const session = createDefaultSession("robot-a", "Robot A");
    expect(() => parseAppConfig(JSON.stringify({
      version: 3,
      activeSessionId: session.id,
      theme: "dark",
      settings: { language: "zh-CN", fontScale: 0.5, disabledPluginIds: [] },
      sessions: [session],
    }))).toThrow("settings.fontScale");
    expect(() => parseAppConfig(JSON.stringify({
      version: 3,
      activeSessionId: session.id,
      theme: "dark",
      settings: { language: "zh-CN", fontScale: 1.8, disabledPluginIds: [] },
      sessions: [session],
    }))).toThrow("settings.fontScale");
  });

  it("keeps an opaque dock layout for dockview to validate", () => {
    const session = createDefaultSession("robot-a", "Robot A");
    const parsed = parseAppConfig(JSON.stringify({
      version: 3,
      activeSessionId: session.id,
      theme: "dark",
      settings: { language: "zh-CN", fontScale: 1, disabledPluginIds: [] },
      sessions: [{ ...session, dockLayout: { unexpected: true } }],
    }));

    expect(parsed.sessions[0].dockLayout).toEqual({ unexpected: true });
  });

  it("purges deprecated services panels from parsed configurations", () => {
    const session = createDefaultSession("robot-a", "Robot A");
    const raw = {
      version: 3,
      activeSessionId: session.id,
      theme: "dark",
      settings: { language: "zh-CN", fontScale: 1, disabledPluginIds: [] },
      sessions: [
        {
          ...session,
          panels: [
            ...session.panels,
            { id: "services", kind: "services" },
          ],
          dockLayout: {
            panels: {
              services: { id: "services" },
              topics: { id: "topics" },
            },
          },
        },
      ],
    };

    const parsed = parseAppConfig(JSON.stringify(raw));
    expect(parsed.sessions[0].panels.some((p) => p.kind === "services" || p.id === "services")).toBe(false);
    const dockPanels = (parsed.sessions[0].dockLayout as { panels: Record<string, unknown> }).panels;
    expect("services" in dockPanels).toBe(false);
    expect("topics" in dockPanels).toBe(true);
  });

  it("round-trips modeTabOrder and validates valid/invalid mode strings", () => {
    const session = createDefaultSession("robot-a", "Robot A");
    session.mode = "map";
    session.urdfInspectorPercent = 42;

    const config: AppConfig = {
      version: 3,
      activeSessionId: session.id,
      theme: "dark",
      settings: {
        language: "zh-CN",
        fontScale: 1,
        disabledPluginIds: ["image-capture"],
        modeTabOrder: ["map", "3d", "urdf", "waypoints", "custom-plugin:custom-page"],
      },
      sessions: [session],
    };

    const parsed = parseAppConfig(serializeAppConfig(config));
    expect(parsed.settings.modeTabOrder).toEqual(["map", "3d", "urdf", "waypoints", "custom-plugin:custom-page"]);
    expect(parsed.sessions[0].mode).toBe("map");
    expect(parsed.sessions[0].urdfInspectorPercent).toBe(42);

    // Also accepts namespaced plugin mode
    const customModeSession = { ...session, mode: "custom-plugin:custom-page" };
    const customConfig = { ...config, sessions: [customModeSession] };
    expect(parseAppConfig(serializeAppConfig(customConfig)).sessions[0].mode).toBe("custom-plugin:custom-page");

    // Rejects invalid mode strings
    expect(() =>
      parseAppConfig(
        JSON.stringify({
          ...config,
          sessions: [{ ...session, mode: "Invalid Mode With Spaces!" }],
        }),
      ),
    ).toThrow("mode");

    // Rejects invalid modeTabOrder strings
    expect(() =>
      parseAppConfig(
        JSON.stringify({
          ...config,
          settings: { ...config.settings, modeTabOrder: ["../../etc/passwd"] },
        }),
      ),
    ).toThrow("settings.modeTabOrder");
  });

  it("insertModeTab precisely inserts before or after target tab", () => {
    const all = ["3d", "map", "urdf", "waypoints", "capture"];
    const base: string[] = [];

    // Drag "3d" to "map", edge: "after" -> inserts between "map" and "urdf"
    expect(insertModeTab(base, all, "3d", "map", "after")).toEqual([
      "map", "3d", "urdf", "waypoints", "capture",
    ]);

    // Drag "capture" to "map", edge: "before" -> inserts between "3d" and "map"
    expect(insertModeTab(base, all, "capture", "map", "before")).toEqual([
      "3d", "capture", "map", "urdf", "waypoints",
    ]);

    // Drag "3d" to "capture", edge: "after" -> inserts at end
    expect(insertModeTab(base, all, "3d", "capture", "after")).toEqual([
      "map", "urdf", "waypoints", "capture", "3d",
    ]);

    // Drag "capture" to "3d", edge: "before" -> inserts at beginning
    expect(insertModeTab(base, all, "capture", "3d", "before")).toEqual([
      "capture", "3d", "map", "urdf", "waypoints",
    ]);

    // Dropping on self is a no-op
    expect(insertModeTab(base, all, "map", "map", "before")).toEqual(base);

    // Retains hidden / unknown tabs in saved order
    const savedWithHidden = ["hidden-plugin:page", "3d", "map", "urdf"];
    const result = insertModeTab(savedWithHidden, all, "urdf", "3d", "before");
    expect(result).toEqual(["hidden-plugin:page", "urdf", "3d", "map", "waypoints", "capture"]);
  });

  it("computeOrderedTabs aligns enabled tabs with saved order and appends new tabs", () => {
    const tabs = [
      { id: "3d", label: "主页" },
      { id: "map", label: "地图" },
      { id: "urdf", label: "URDF" },
      { id: "waypoints", label: "航点" },
    ];
    const saved = ["map", "3d", "missing", "urdf"];
    const ordered = computeOrderedTabs(tabs, saved);
    expect(ordered.map((t) => t.id)).toEqual(["map", "3d", "urdf", "waypoints"]);
  });
});

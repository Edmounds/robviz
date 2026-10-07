import { z } from "zod";

import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_POINT_CLOUD_SETTINGS,
  parseLayout,
  pointCloudSettingsSchema,
} from "./layoutConfig";

export const APP_CONFIG_STORAGE_KEY = "robviz.layout";

const vec3 = z.tuple([z.number(), z.number(), z.number()]);

export const DEFAULT_CORE_PANELS = [
  { id: "3d", kind: "3d" },
  { id: "topics", kind: "topics" },
  { id: "echo", kind: "echo" },
  { id: "services", kind: "services" },
  { id: "tf-tree", kind: "tf-tree" },
] as const;

const panelSchema = z.object({
  id: z.string().min(1),
  kind: z.string().min(1),
  state: z.unknown().optional(),
});

const activeTopicSchema = z.object({
  topic: z.string(),
  schemaName: z.string(),
  pointCloud: pointCloudSettingsSchema.optional(),
});

const robotSessionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string(),
  mediaUrl: z.string().optional(),
  mode: z.enum(["3d", "map", "urdf", "waypoints"]).default("3d"),
  fixedFrame: z.string(),
  scene: z.object({
    groundVisible: z.boolean().default(DEFAULT_APP_SETTINGS.groundVisible),
    tfAxesLineWidth: z.number().min(1).max(6).default(DEFAULT_APP_SETTINGS.tfAxesLineWidth),
  }),
  urdfInspectorPercent: z.number().gt(0).lte(100).default(35),
  pcdVoxel: z.number().nonnegative().default(0.1),
  followFrame: z.string().optional(),
  activeTopics: z.array(activeTopicSchema).default([]),
  pluginState: z.record(z.string(), z.unknown()).default({}),
  initializedPluginSectionIds: z.array(z.string()).default([]),
  autoAddPluginSections: z.boolean().default(false),
  panels: z.array(panelSchema).default([]),
  dockLayout: z.unknown().optional(),
  camera: z.object({ position: vec3, target: vec3 }).optional(),
});

export type RobotSessionConfig = z.infer<typeof robotSessionSchema>;
export type WorkspacePanelConfig = z.infer<typeof panelSchema>;

const appConfigSchema = z
  .object({
    version: z.literal(2),
    activeSessionId: z.string().min(1),
    theme: z.enum(["dark", "light"]).default("dark"),
    settings: z.object({
      language: z.enum(["zh-CN", "en"]).default("zh-CN"),
      disabledPluginIds: z.array(z.string()).default([]),
    }),
    sessions: z.array(robotSessionSchema).min(1),
  })
  .superRefine((config, context) => {
    const sessionIds = new Set<string>();
    for (const [index, session] of config.sessions.entries()) {
      if (sessionIds.has(session.id)) {
        context.addIssue({
          code: "custom",
          path: ["sessions", index, "id"],
          message: "机器标签 id 重复",
        });
      }
      sessionIds.add(session.id);

      const panelIds = new Set<string>();
      for (const [panelIndex, panel] of session.panels.entries()) {
        if (panelIds.has(panel.id)) {
          context.addIssue({
            code: "custom",
            path: ["sessions", index, "panels", panelIndex, "id"],
            message: "面板 id 重复",
          });
        }
        panelIds.add(panel.id);
      }
    }
    if (!sessionIds.has(config.activeSessionId)) {
      context.addIssue({
        code: "custom",
        path: ["activeSessionId"],
        message: "当前机器标签不存在",
      });
    }
  });

export type AppConfig = z.infer<typeof appConfigSchema>;

export function renameAppSession(config: AppConfig, id: string, draft: string): AppConfig {
  const name = draft.trim();
  if (!name || !config.sessions.some((session) => session.id === id)) return config;
  return {
    ...config,
    sessions: config.sessions.map((session) => session.id === id ? { ...session, name } : session),
  };
}

export function getDefaultMediaUrl(foxgloveUrl: string): string {
  try {
    const parsed = new URL(foxgloveUrl);
    const proto = parsed.protocol === "wss:" ? "wss:" : "ws:";
    return `${proto}//${parsed.hostname}:8787/ws`;
  } catch {
    return "ws://localhost:8787/ws";
  }
}

export function createDefaultSession(id: string, name: string): RobotSessionConfig {
  return {
    id,
    name,
    url: "ws://localhost:8765",
    mode: "3d",
    fixedFrame: "map",
    scene: {
      groundVisible: DEFAULT_APP_SETTINGS.groundVisible,
      tfAxesLineWidth: DEFAULT_APP_SETTINGS.tfAxesLineWidth,
    },
    urdfInspectorPercent: 35,
    pcdVoxel: 0.1,
    activeTopics: [],
    pluginState: {},
    initializedPluginSectionIds: [],
    autoAddPluginSections: true,
    panels: DEFAULT_CORE_PANELS.map((panel) => ({ ...panel })),
  };
}

function createMigratedDockLayout(
  panels: WorkspacePanelConfig[],
  workspace: { sidebarPercent: number; dockPercent: number },
  legacyPanelSizes: Array<number | undefined>,
): unknown {
  const width = 1000;
  const height = 1000;
  const sidebarWidth = Math.round(width * workspace.sidebarPercent / 100);
  const centerWidth = width - sidebarWidth;
  const dockHeight = Math.round(height * workspace.dockPercent / 100);
  const viewportHeight = height - dockHeight;
  let groupIndex = 0;
  const leaf = (views: string[], size: number, activeView = views.at(-1)) => ({
    type: "leaf" as const,
    data: { views, activeView, id: `migration-${++groupIndex}` },
    size,
  });

  const extraPanels = panels.filter((panel) => !DEFAULT_CORE_PANELS.some((core) => core.id === panel.id));
  let center: unknown = leaf(["3d"], centerWidth, "3d");
  if (extraPanels.length > 0) {
    const weights = legacyPanelSizes.map((size) => size ?? 1);
    const totalWeight = weights.reduce((sum, size) => sum + size, 0);
    const dockChildren = extraPanels.map((panel, index) =>
      leaf([panel.id], Math.round(centerWidth * weights[index] / totalWeight), panel.id),
    );
    center = {
      type: "branch",
      data: [
        leaf(["3d"], viewportHeight, "3d"),
        dockChildren.length === 1
          ? { ...dockChildren[0], size: dockHeight }
          : { type: "branch", data: dockChildren, size: dockHeight },
      ],
      size: centerWidth,
    };
  }

  const right = {
    type: "branch" as const,
    data: [
      leaf(["topics"], Math.round(height / 2), "topics"),
      leaf(["echo", "services", "tf-tree"], Math.round(height / 2), "tf-tree"),
    ],
    size: sidebarWidth,
  };
  const serializedPanels = Object.fromEntries(panels.map((panel) => [panel.id, {
    id: panel.id,
    contentComponent: "workspace-panel",
    params: { panelId: panel.id, kind: panel.kind },
    title: panel.kind,
    renderer: "always",
    minimumHeight: 30,
    minimumWidth: 30,
  }]));

  return {
    grid: {
      root: { type: "branch", data: [center, right], size: height },
      width,
      height,
      orientation: "HORIZONTAL",
    },
    panels: serializedPanels,
    activeGroup: "migration-1",
  };
}

function migrateV1(raw: unknown): AppConfig {
  const legacy = parseLayout(JSON.stringify(raw));
  const session = createDefaultSession("session-1", "机器 1");
  session.url = legacy.url;
  session.fixedFrame = legacy.fixedFrame;
  session.scene = {
    groundVisible: legacy.settings.groundVisible,
    tfAxesLineWidth: legacy.settings.tfAxesLineWidth,
  };
  session.urdfInspectorPercent = legacy.workspace.urdfInspectorPercent;
  session.pcdVoxel = legacy.pcdVoxel;
  session.followFrame = legacy.followFrame;
  session.activeTopics = legacy.activeTopics.map((topic) => ({
    topic: topic.topic,
    schemaName: topic.schemaName,
    ...(topic.schemaName === "sensor_msgs/msg/PointCloud2"
      ? {
          pointCloud:
            topic.pointCloud ?? {
              ...DEFAULT_POINT_CLOUD_SETTINGS,
              accumulate: topic.accumulate ?? false,
            },
        }
      : {}),
  }));
  session.panels = [
    ...session.panels,
    ...legacy.panels.map((panel, index) => ({
      id: `legacy-panel-${index + 1}`,
      kind: panel.kind,
      state: panel.state,
    })),
  ];
  session.dockLayout = createMigratedDockLayout(
    session.panels,
    legacy.workspace,
    legacy.panels.map((panel) => panel.sizePercent),
  );
  session.camera = legacy.camera;
  session.autoAddPluginSections = false;

  return {
    version: 2,
    activeSessionId: session.id,
    theme: legacy.theme,
    settings: {
      language: legacy.settings.language,
      disabledPluginIds: legacy.settings.disabledPluginIds,
    },
    sessions: [session],
  };
}

export function serializeAppConfig(config: AppConfig): string {
  return JSON.stringify(config, null, 2);
}

export function saveAppConfigToStorage(
  config: AppConfig,
  storage: { setItem(key: string, value: string): void },
): void {
  storage.setItem(APP_CONFIG_STORAGE_KEY, serializeAppConfig(config));
}

/** 保留旧遥控面板的 id/布局，只迁移已经存在的面板，不重新打开用户关闭的区块。 */
function migrateTeleopPanels(config: AppConfig): AppConfig {
  for (const session of config.sessions) {
    const migratedIds = new Set<string>();
    for (const panel of session.panels) {
      if (panel.kind !== "teleop") continue;
      panel.kind = "plugin-section:teleop:teleop";
      migratedIds.add(panel.id);
    }
    if (migratedIds.size === 0) continue;
    if (!session.initializedPluginSectionIds.includes("teleop:teleop")) {
      session.initializedPluginSectionIds.push("teleop:teleop");
    }
    const layout = session.dockLayout;
    if (!layout || typeof layout !== "object" || !("panels" in layout)) continue;
    const dockPanels = layout.panels;
    if (!dockPanels || typeof dockPanels !== "object" || Array.isArray(dockPanels)) continue;
    for (const [id, panel] of Object.entries(dockPanels)) {
      if (!migratedIds.has(id) || !panel || typeof panel !== "object") continue;
      const params = "params" in panel ? panel.params : undefined;
      panel.params = {
        ...(params && typeof params === "object" && !Array.isArray(params) ? params : {}),
        panelId: id,
        kind: "plugin-section:teleop:teleop",
      };
    }
  }
  return config;
}

export function parseAppConfig(text: string): AppConfig {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("配置文件不是合法 JSON");
  }

  if (typeof raw === "object" && raw !== null && "version" in raw && raw.version === 1) {
    return migrateTeleopPanels(migrateV1(raw));
  }

  const result = appConfigSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.join(".") || "(根)";
    throw new Error(`配置格式不合法: ${path}: ${issue?.message ?? "unknown"}`);
  }
  return migrateTeleopPanels(result.data);
}

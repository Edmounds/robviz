import { z } from "zod";

import {
  DEFAULT_APP_SETTINGS,
  pointCloudSettingsSchema,
} from "./layoutConfig";

export const APP_CONFIG_STORAGE_KEY = "robviz.layout.v3";

const vec3 = z.tuple([z.number(), z.number(), z.number()]);

export const DEFAULT_CORE_PANELS = [
  { id: "3d", kind: "3d" },
  { id: "topics", kind: "topics" },
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
  mode: z.string().regex(/^[a-z0-9-]+(:[a-z0-9-]+)?$/).default("3d"),
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
    version: z.literal(3),
    activeSessionId: z.string().min(1),
    theme: z.enum(["dark", "light"]).default("dark"),
    settings: z.object({
      language: z.enum(["zh-CN", "en"]).default("zh-CN"),
      fontScale: z.number().min(0.75).max(1.5).default(1),
      disabledPluginIds: z.array(z.string()).default([]),
      modeTabOrder: z.array(z.string().regex(/^[a-z0-9-]+(:[a-z0-9-]+)?$/)).default([]),
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
    const pageHost = typeof window !== "undefined" && window.location
      ? window.location.hostname
      : "";
    const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
    const host = localHosts.has(parsed.hostname) && pageHost && !localHosts.has(pageHost)
      ? pageHost
      : parsed.hostname;
    const proto = parsed.protocol === "wss:" ? "wss:" : "ws:";
    return `${proto}//${host}:8787/ws`;
  } catch {
    const pageHost = typeof window !== "undefined" && window.location
      ? window.location.hostname
      : "localhost";
    return `ws://${pageHost || "localhost"}:8787/ws`;
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

export function serializeAppConfig(config: AppConfig): string {
  return JSON.stringify(config, null, 2);
}

export function computeOrderedTabs<T extends { id: string }>(
  enabledTabs: T[],
  savedOrder: string[],
): T[] {
  const map = new Map(enabledTabs.map((t) => [t.id, t]));
  const ordered: T[] = [];
  const seen = new Set<string>();

  for (const id of savedOrder) {
    const item = map.get(id);
    if (item && !seen.has(id)) {
      ordered.push(item);
      seen.add(id);
    }
  }

  for (const item of enabledTabs) {
    if (!seen.has(item.id)) {
      ordered.push(item);
      seen.add(item.id);
    }
  }

  return ordered;
}

export function insertModeTab(
  savedOrder: string[],
  allKnownTabIds: string[],
  sourceId: string,
  targetId: string,
  edge: "before" | "after",
): string[] {
  if (sourceId === targetId) return savedOrder;

  const fullOrder: string[] = [];
  const seen = new Set<string>();
  for (const id of savedOrder) {
    if (!seen.has(id)) {
      fullOrder.push(id);
      seen.add(id);
    }
  }
  for (const id of allKnownTabIds) {
    if (!seen.has(id)) {
      fullOrder.push(id);
      seen.add(id);
    }
  }

  const fromIdx = fullOrder.indexOf(sourceId);
  if (fromIdx === -1) return fullOrder;

  const next = [...fullOrder];
  next.splice(fromIdx, 1);

  const targetIdx = next.indexOf(targetId);
  if (targetIdx === -1) return fullOrder;

  const insertIdx = edge === "before" ? targetIdx : targetIdx + 1;
  next.splice(insertIdx, 0, sourceId);

  return next;
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

function purgeServicesPanels(config: AppConfig): AppConfig {
  for (const session of config.sessions) {
    session.panels = session.panels.filter((panel) => panel.kind !== "services" && panel.id !== "services");
    const layout = session.dockLayout;
    if (!layout || typeof layout !== "object" || !("panels" in layout)) continue;
    const dockPanels = layout.panels;
    if (dockPanels && typeof dockPanels === "object" && !Array.isArray(dockPanels)) {
      delete (dockPanels as Record<string, unknown>)["services"];
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

  const result = appConfigSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.join(".") || "(根)";
    throw new Error(`配置格式不合法: ${path}: ${issue?.message ?? "unknown"}`);
  }
  return purgeServicesPanels(migrateTeleopPanels(result.data));
}

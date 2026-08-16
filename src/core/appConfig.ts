import { z } from "zod";

import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_POINT_CLOUD_SETTINGS,
  parseLayout,
  pointCloudSettingsSchema,
} from "./layoutConfig";

const vec3 = z.tuple([z.number(), z.number(), z.number()]);

export const DEFAULT_CORE_PANELS = [
  { id: "3d", kind: "3d" },
  { id: "topics", kind: "topics" },
  { id: "echo", kind: "echo" },
  { id: "teleop", kind: "teleop" },
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
  mode: z.enum(["3d", "map", "urdf"]).default("3d"),
  fixedFrame: z.string(),
  scene: z.object({
    groundVisible: z.boolean().default(DEFAULT_APP_SETTINGS.groundVisible),
    tfAxesLineWidth: z.number().min(1).max(6).default(DEFAULT_APP_SETTINGS.tfAxesLineWidth),
  }),
  urdfInspectorPercent: z.number().gt(0).lte(100).default(35),
  pcdVoxel: z.number().nonnegative().default(0.1),
  followFrame: z.string().optional(),
  activeTopics: z.array(activeTopicSchema).default([]),
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
    panels: DEFAULT_CORE_PANELS.map((panel) => ({ ...panel })),
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
  session.camera = legacy.camera;

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

export function parseAppConfig(text: string): AppConfig {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("配置文件不是合法 JSON");
  }

  if (typeof raw === "object" && raw !== null && "version" in raw && raw.version === 1) {
    return migrateV1(raw);
  }

  const result = appConfigSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.join(".") || "(根)";
    throw new Error(`配置格式不合法: ${path}: ${issue?.message ?? "unknown"}`);
  }
  return result.data;
}

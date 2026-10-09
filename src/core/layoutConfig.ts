/**
 * 页面配置文件（rviz 的 .rviz 之于 RobViz）：连接、fixed frame、主题、
 * 激活话题、面板坞、相机位姿、视角跟踪。导出/导入 JSON 文件，
 * 同一份 schema 也用于 localStorage 自动保存。
 */
import { z } from "zod";

const vec3 = z.tuple([z.number(), z.number(), z.number()]);

export const DEFAULT_APP_SETTINGS = {
  language: "zh-CN" as const,
  groundVisible: true,
  tfAxesLineWidth: 1.5,
  fontScale: 1,
  disabledPluginIds: [] as string[],
};

export const DEFAULT_WORKSPACE_LAYOUT = {
  sidebarPercent: 22,
  dockPercent: 35,
  urdfInspectorPercent: 35,
};

const appSettingsSchema = z
  .object({
    language: z.enum(["zh-CN", "en"]).default(DEFAULT_APP_SETTINGS.language),
    groundVisible: z.boolean().default(DEFAULT_APP_SETTINGS.groundVisible),
    tfAxesLineWidth: z.number().min(1).max(6).default(DEFAULT_APP_SETTINGS.tfAxesLineWidth),
    fontScale: z.number().min(0.75).max(1.5).default(DEFAULT_APP_SETTINGS.fontScale),
    disabledPluginIds: z.array(z.string()).default([]),
  })
  .default(DEFAULT_APP_SETTINGS);

const workspaceLayoutSchema = z
  .object({
    sidebarPercent: z.number().gt(0).lte(100).default(DEFAULT_WORKSPACE_LAYOUT.sidebarPercent),
    dockPercent: z.number().gt(0).lte(100).default(DEFAULT_WORKSPACE_LAYOUT.dockPercent),
    urdfInspectorPercent: z
      .number()
      .gt(0)
      .lte(100)
      .default(DEFAULT_WORKSPACE_LAYOUT.urdfInspectorPercent),
  })
  .default(DEFAULT_WORKSPACE_LAYOUT);

export const pointCloudSettingsSchema = z
  .object({
    pointSize: z.number().min(1).max(10).default(2),
    opacity: z.number().min(0.1).max(1).default(1),
    colorMode: z.enum(["field", "height", "flat"]).default("field"),
    flatColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#4ea1ff"),
    rangeMode: z.enum(["auto", "manual"]).default("auto"),
    rangeMin: z.number().optional(),
    rangeMax: z.number().optional(),
    accumulate: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (value.rangeMode !== "manual") return;
    if (value.rangeMin == null) {
      context.addIssue({ code: "custom", path: ["rangeMin"], message: "手动色域需要最小值" });
    }
    if (value.rangeMax == null || (value.rangeMin != null && value.rangeMax <= value.rangeMin)) {
      context.addIssue({ code: "custom", path: ["rangeMax"], message: "最大值必须大于最小值" });
    }
  });

export type PointCloudSettings = z.infer<typeof pointCloudSettingsSchema>;

export const DEFAULT_POINT_CLOUD_SETTINGS: PointCloudSettings = {
  pointSize: 2,
  opacity: 1,
  colorMode: "field",
  flatColor: "#4ea1ff",
  rangeMode: "auto",
  accumulate: false,
};

export const layoutConfigSchema = z.object({
  version: z.literal(1),
  url: z.string(),
  fixedFrame: z.string(),
  theme: z.enum(["dark", "light"]).default("dark"),
  settings: appSettingsSchema,
  workspace: workspaceLayoutSchema,
  pcdVoxel: z.number().nonnegative().default(0.1),
  followFrame: z.string().optional(),
  activeTopics: z
    .array(
      z.object({
        topic: z.string(),
        schemaName: z.string(),
        /** 旧配置兼容；新配置使用 pointCloud.accumulate。 */
        accumulate: z.boolean().optional(),
        pointCloud: pointCloudSettingsSchema.optional(),
      }),
    )
    .default([]),
  /** kind 开放字符串：内置 "image" / "plot" 或插件面板；state 由面板自定义 */
  panels: z
    .array(
      z.object({
        kind: z.string(),
        state: z.unknown().optional(),
        sizePercent: z.number().gt(0).lte(100).optional(),
      }),
    )
    .default([]),
  camera: z.object({ position: vec3, target: vec3 }).optional(),
});

export type LayoutConfig = z.infer<typeof layoutConfigSchema>;

export function serializeLayout(config: LayoutConfig): string {
  return JSON.stringify(config, null, 2);
}

/** 解析并校验配置。JSON 或 schema 不合法时抛错（带具体字段路径） */
export function parseLayout(text: string): LayoutConfig {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("配置文件不是合法 JSON");
  }
  const result = layoutConfigSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.join(".") || "(根)";
    throw new Error(`配置格式不合法: ${path}: ${issue?.message ?? "unknown"}`);
  }
  return result.data;
}

/**
 * 页面配置文件（rviz 的 .rviz 之于 RobViz）：连接、fixed frame、主题、
 * 激活话题、面板坞、相机位姿、视角跟踪。导出/导入 JSON 文件，
 * 同一份 schema 也用于 localStorage 自动保存。
 */
import { z } from "zod";

const vec3 = z.tuple([z.number(), z.number(), z.number()]);

export const layoutConfigSchema = z.object({
  version: z.literal(1),
  url: z.string(),
  fixedFrame: z.string(),
  theme: z.enum(["dark", "light"]).default("dark"),
  pcdVoxel: z.number().nonnegative().default(0.1),
  followFrame: z.string().optional(),
  activeTopics: z
    .array(
      z.object({
        topic: z.string(),
        schemaName: z.string(),
        accumulate: z.boolean().optional(),
      }),
    )
    .default([]),
  /** kind 开放字符串：内置 "image" / "plot" 或插件面板；state 由面板自定义 */
  panels: z
    .array(
      z.object({
        kind: z.string(),
        state: z.unknown().optional(),
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

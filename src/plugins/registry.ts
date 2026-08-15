/**
 * 插件注册表：构建期自动发现 src/plugins/<dir>/index.tsx 的 default 导出。
 * 收集逻辑抽成纯函数（collectPlugins）便于单测。
 */
import type { ComponentType } from "react";

import type { Display } from "../renderers/SceneManager";
import type { PluginPanelProps, PluginSectionProps, RobvizPlugin } from "./types";

export function collectPlugins(modules: Record<string, unknown>): RobvizPlugin[] {
  const out: RobvizPlugin[] = [];
  const seen = new Set<string>();
  for (const [path, mod] of Object.entries(modules)) {
    const plugin = (mod as { default?: RobvizPlugin } | undefined)?.default;
    if (!plugin || typeof plugin.id !== "string" || !plugin.id) {
      console.warn(`[plugins] ${path} 缺少 default 导出的 RobvizPlugin（含 id），已跳过`);
      continue;
    }
    const folder = path.match(/^\.\/([^/]+)\/index\.tsx$/)?.[1];
    if (folder && plugin.id !== folder) {
      console.warn(`[plugins] 插件 id "${plugin.id}" 与目录名 "${folder}" 不一致，已跳过`);
      continue;
    }
    if (seen.has(plugin.id)) {
      console.warn(`[plugins] 重复插件 id "${plugin.id}"（${path}），已跳过`);
      continue;
    }
    seen.add(plugin.id);
    out.push(plugin);
  }
  return out;
}

export const plugins: RobvizPlugin[] = collectPlugins(
  import.meta.glob("./*/index.tsx", { eager: true }),
);

export interface PluginPanelDef {
  /** 全局唯一 kind：`<插件id>:<面板kind>`，配置文件里也存这个 */
  kind: string;
  title: string;
  component: ComponentType<PluginPanelProps>;
  pluginId: string;
}

export interface PluginSectionDef {
  id: string;
  title: string;
  component: ComponentType<PluginSectionProps>;
  pluginId: string;
}

export interface ResolvedPlugins {
  activePlugins: RobvizPlugin[];
  panels: PluginPanelDef[];
  sections: PluginSectionDef[];
  displays: Record<string, () => Display>;
}

/** 先固定 display schema 的首个所有者，再过滤启用状态，避免运行时切换导致接管。 */
export function resolvePlugins(
  allPlugins: RobvizPlugin[],
  disabledPluginIds: Iterable<string>,
): ResolvedPlugins {
  const disabled = new Set(disabledPluginIds);
  const displayOwners = new Map<string, RobvizPlugin>();
  for (const plugin of allPlugins) {
    for (const display of plugin.displays ?? []) {
      if (!displayOwners.has(display.schema)) displayOwners.set(display.schema, plugin);
    }
  }

  const activePlugins = allPlugins.filter((plugin) => !disabled.has(plugin.id));
  const panels = activePlugins.flatMap((plugin) =>
    (plugin.panels ?? []).map((panel) => ({
      kind: `${plugin.id}:${panel.kind}`,
      title: panel.title,
      component: panel.component,
      pluginId: plugin.id,
    })),
  );
  const sections = activePlugins.flatMap((plugin) =>
    (plugin.sections ?? []).map((section) => ({
      id: `${plugin.id}:${section.id}`,
      title: section.title,
      component: section.component,
      pluginId: plugin.id,
    })),
  );
  const displays: Record<string, () => Display> = {};
  for (const [schema, owner] of displayOwners) {
    if (disabled.has(owner.id)) continue;
    const display = owner.displays?.find((candidate) => candidate.schema === schema);
    if (display) displays[schema] = display.create;
  }
  return { activePlugins, panels, sections, displays };
}

const resolved = resolvePlugins(plugins, []);
export const pluginPanels = resolved.panels;
export const pluginSections = resolved.sections;
export const pluginDisplays = resolved.displays;

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
}

export interface PluginSectionDef {
  id: string;
  title: string;
  component: ComponentType<PluginSectionProps>;
}

export const pluginPanels: PluginPanelDef[] = plugins.flatMap((p) =>
  (p.panels ?? []).map((panel) => ({
    kind: `${p.id}:${panel.kind}`,
    title: panel.title,
    component: panel.component,
  })),
);

export const pluginSections: PluginSectionDef[] = plugins.flatMap((p) =>
  (p.sections ?? []).map((s) => ({
    id: `${p.id}:${s.id}`,
    title: s.title,
    component: s.component,
  })),
);

/** 插件 3D 显示器（内置类型优先，不允许覆盖） */
export const pluginDisplays: Record<string, () => Display> = {};
for (const p of plugins) {
  for (const d of p.displays ?? []) {
    if (d.schema in pluginDisplays) {
      console.warn(`[plugins] schema "${d.schema}" 已被其他插件注册，"${p.id}" 的显示器被跳过`);
      continue;
    }
    pluginDisplays[d.schema] = d.create;
  }
}

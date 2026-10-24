/**
 * 插件注册表：启动时加入已安装的 ESM 插件，不扫描 Core 内部源码插件。
 * 收集逻辑抽成纯函数（collectPlugins）便于单测。
 */
import type { ComponentType } from "react";

import { CORE_NETWORK_SERVICES } from "../core/appConfig";
import type { Display } from "../renderers/SceneManager";
import type {
  PluginContext,
  PluginPageProps,
  PluginPanelProps,
  PluginSectionProps,
  PluginServiceDefinition,
  RobvizPlugin,
  ViewportPoseInteraction,
} from "./types";

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

export const plugins: RobvizPlugin[] = [];

export function registerInstalledPlugins(installed: RobvizPlugin[]): void {
  for (const plugin of installed) {
    if (plugins.some((current) => current.id === plugin.id)) {
      console.warn(`[plugins] 重复插件 id "${plugin.id}"，未替换已有定义`);
      continue;
    }
    plugins.push(plugin);
  }
}

export type PluginPanelDef =
  | {
      /** 全局唯一 kind：`<插件id>:<面板kind>`，配置文件里也存这个 */
      kind: string;
      title: string | ((ctx: PluginContext) => string);
      component: ComponentType<PluginPanelProps>;
      pluginId: string;
      builtinKind?: never;
    }
  | {
      kind: "3d";
      title: string | ((ctx: PluginContext) => string);
      component?: never;
      pluginId: string;
      builtinKind: "3d";
    };

export interface PluginPageDef {
  /** 全局页面 id，如旧模式别名 "map" 或命名空间 id `${plugin.id}:${page.id}` */
  id: string;
  title: string | ((ctx: PluginContext) => string);
  component: ComponentType<PluginPageProps>;
  pluginId: string;
  legacyMode?: string;
}

export interface PluginSectionDef {
  id: string;
  title: string;
  component: ComponentType<PluginSectionProps>;
  pluginId: string;
}

export interface PluginViewportToolDef {
  id: string;
  title: (ctx: PluginContext) => string;
  hint?: (ctx: PluginContext) => string;
  onPoseSelect: (ctx: PluginContext, interaction: ViewportPoseInteraction) => void;
  pluginId: string;
}

export interface ResolvedPlugins {
  activePlugins: RobvizPlugin[];
  panels: PluginPanelDef[];
  sections: PluginSectionDef[];
  displays: Record<string, () => Display>;
  viewportTools: PluginViewportToolDef[];
  pages: PluginPageDef[];
  services: PluginServiceDefinition[];
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
  const seenPanelKinds = new Set<string>(["3d"]);
  const panels: PluginPanelDef[] = [{
    kind: "3d",
    title: (ctx) => ctx.locale === "en" ? "3D View" : "3D 视图",
    pluginId: "@core",
    builtinKind: "3d",
  }];
  for (const plugin of activePlugins) {
    for (const panel of plugin.panels ?? []) {
      if (panel.builtinKind === "3d") {
        console.warn(`[plugins] 3D 是宿主面板，忽略插件绑定（${plugin.id}）`);
        continue;
      } else {
        const kind = `${plugin.id}:${panel.kind}`;
        if (seenPanelKinds.has(kind)) {
          console.warn(`[plugins] 重复面板 kind "${kind}"（${plugin.id}），已跳过`);
          continue;
        }
        seenPanelKinds.add(kind);
        panels.push({
          kind,
          title: panel.title,
          component: panel.component,
          pluginId: plugin.id,
        });
      }
    }
  }

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
  const viewportTools = activePlugins.flatMap((plugin) =>
    (plugin.viewportTools ?? []).map((tool) => {
      const title = tool.title;
      const hint = tool.hint;
      return {
        id: `${plugin.id}:${tool.id}`,
        title: (ctx: PluginContext) => typeof title === "function" ? title(ctx) : title,
        hint: hint === undefined ? undefined : (ctx: PluginContext) => typeof hint === "function" ? hint(ctx) : hint,
        onPoseSelect: tool.onPoseSelect,
        pluginId: plugin.id,
      };
    }),
  );

  const seenPageIds = new Set<string>();
  const pages: PluginPageDef[] = [];
  for (const plugin of activePlugins) {
    for (const page of plugin.pages ?? []) {
      const pageId = page.legacyMode ?? `${plugin.id}:${page.id}`;
      if (seenPageIds.has(pageId)) {
        console.warn(`[plugins] 重复页面 id "${pageId}"（来自插件 ${plugin.id}），已跳过`);
        continue;
      }
      seenPageIds.add(pageId);
      pages.push({
        id: pageId,
        title: page.title,
        component: page.component,
        pluginId: plugin.id,
        legacyMode: page.legacyMode,
      });
    }
  }

  const allServices: PluginServiceDefinition[] = [...CORE_NETWORK_SERVICES];
  const seenServiceIds = new Set<string>(CORE_NETWORK_SERVICES.map((s) => s.id));
  for (const plugin of activePlugins) {
    for (const service of plugin.services ?? []) {
      if (seenServiceIds.has(service.id)) {
        console.warn(`[plugins] 重复服务 id "${service.id}"（来自插件 ${plugin.id}），已跳过`);
        continue;
      }
      seenServiceIds.add(service.id);
      allServices.push(service);
    }
  }

  return { activePlugins, panels, sections, displays, viewportTools, pages, services: allServices };
}

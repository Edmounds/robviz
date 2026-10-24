import { describe, expect, it, vi } from "vitest";

import { collectPlugins, plugins, resolvePlugins } from "../../src/plugins/registry";
import type { RobvizPlugin } from "../../src/plugins/types";

function fake(id: string): { default: RobvizPlugin } {
  return { default: { id, name: id } };
}

describe("plugin registry", () => {
  it("收集 default 导出的插件", () => {
    const out = collectPlugins({ "./a/index.tsx": fake("a"), "./b/index.tsx": fake("b") });
    expect(out.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("缺少 default/id 的模块跳过并告警", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = collectPlugins({
      "./bad/index.tsx": {},
      "./bad2/index.tsx": { default: { name: "无 id" } },
      "./ok/index.tsx": fake("ok"),
    });
    expect(out.map((p) => p.id)).toEqual(["ok"]);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it("重复 id 只保留第一个", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = collectPlugins({ "virtual:a": fake("dup"), "virtual:b": fake("dup") });
    expect(out).toHaveLength(1);
    warn.mockRestore();
  });

  it("没有安装插件时注册表为空", () => {
    expect(plugins).toEqual([]);
  });

  it("跳过与目录名不一致的插件 id", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = collectPlugins({ "./folder/index.tsx": fake("other") });
    expect(out).toEqual([]);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("按禁用 id 解析启用扩展并保留 schema 固定归属", () => {
    const displayA = () => ({ root: {} }) as never;
    const displayB = () => ({ root: {} }) as never;
    const all: RobvizPlugin[] = [
      {
        id: "a",
        name: "A",
        displays: [{ schema: "custom/Thing", create: displayA }],
        panels: [{ kind: "main", title: "A panel", component: (() => null) as never }],
      },
      {
        id: "b",
        name: "B",
        displays: [{ schema: "custom/Thing", create: displayB }],
        sections: [{ id: "main", title: "B section", component: (() => null) as never }],
      },
    ];

    const enabled = resolvePlugins(all, []);
    expect(enabled.panels.map((panel) => panel.kind)).toEqual(["3d", "a:main"]);
    expect(enabled.sections.map((section) => section.id)).toEqual(["b:main"]);
    expect(enabled.displays["custom/Thing"]).toBe(displayA);

    const disabledOwner = resolvePlugins(all, ["a"]);
    expect(disabledOwner.panels.map((panel) => panel.kind)).toEqual(["3d"]);
    expect(disabledOwner.sections.map((section) => section.id)).toEqual(["b:main"]);
    expect(disabledOwner.displays["custom/Thing"]).toBeUndefined();
  });

  it("resolves viewport tools and removes them with the owning plugin", () => {
    const all: RobvizPlugin[] = [
      {
        id: "nav",
        name: "Nav",
        viewportTools: [
          {
            id: "goal",
            title: (ctx) => ctx.locale === "en" ? "Goal" : "目标",
            hint: "Click and drag",
            onPoseSelect: vi.fn(),
          },
        ],
      },
    ];
    const context = { locale: "en" } as never;
    const enabled = resolvePlugins(all, []);
    expect(enabled.viewportTools).toHaveLength(1);
    expect(enabled.viewportTools[0].id).toBe("nav:goal");
    expect(enabled.viewportTools[0].title(context)).toBe("Goal");
    expect(enabled.viewportTools[0].hint?.(context)).toBe("Click and drag");
    expect(resolvePlugins(all, ["nav"]).viewportTools).toEqual([]);
  });

  it("resolves topbar pages with legacyMode and custom namespaced ids", () => {
    const all: RobvizPlugin[] = [
      {
        id: "map-editor",
        name: "Map",
        pages: [
          {
            id: "main",
            legacyMode: "map",
            title: (ctx) => (ctx.locale === "en" ? "Map" : "地图"),
            component: (() => null) as never,
          },
        ],
      },
      {
        id: "custom-plugin",
        name: "Custom",
        pages: [
          {
            id: "analytics",
            title: "Analytics",
            component: (() => null) as never,
          },
        ],
      },
    ];

    const ctx = { locale: "en" } as never;
    const enabled = resolvePlugins(all, []);
    expect(enabled.pages.map((p) => p.id)).toEqual(["map", "custom-plugin:analytics"]);
    expect(typeof enabled.pages[0].title === "function" ? enabled.pages[0].title(ctx) : enabled.pages[0].title).toBe("Map");

    const disabled = resolvePlugins(all, ["map-editor"]);
    expect(disabled.pages.map((p) => p.id)).toEqual(["custom-plugin:analytics"]);
  });

  it("keeps builtin 3D available without any plugin", () => {
    const enabled = resolvePlugins([], []);
    const threeDPanel = enabled.panels.find((p) => p.kind === "3d");
    expect(threeDPanel).toBeDefined();
    expect(threeDPanel?.builtinKind).toBe("3d");

    const disabledThreeD = resolvePlugins(plugins, ["view-3d"]);
    expect(disabledThreeD.panels.some((p) => p.kind === "3d")).toBe(true);
    expect(resolvePlugins([], ["view-3d"]).panels.map((panel) => panel.kind)).toEqual(["3d"]);
  });
});

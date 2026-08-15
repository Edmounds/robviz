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

  it("示例插件被自动发现", () => {
    expect(plugins.some((p) => p.id === "example-odom-hud")).toBe(true);
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
    expect(enabled.panels.map((panel) => panel.kind)).toEqual(["a:main"]);
    expect(enabled.sections.map((section) => section.id)).toEqual(["b:main"]);
    expect(enabled.displays["custom/Thing"]).toBe(displayA);

    const disabledOwner = resolvePlugins(all, ["a"]);
    expect(disabledOwner.panels).toEqual([]);
    expect(disabledOwner.sections.map((section) => section.id)).toEqual(["b:main"]);
    expect(disabledOwner.displays["custom/Thing"]).toBeUndefined();
  });
});

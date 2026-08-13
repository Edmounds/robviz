import { describe, expect, it, vi } from "vitest";

import { collectPlugins, plugins } from "../../src/plugins/registry";
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
    const out = collectPlugins({ "./a/index.tsx": fake("dup"), "./b/index.tsx": fake("dup") });
    expect(out).toHaveLength(1);
    warn.mockRestore();
  });

  it("示例插件被自动发现", () => {
    expect(plugins.some((p) => p.id === "example-odom-hud")).toBe(true);
  });
});

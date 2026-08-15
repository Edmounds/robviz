import { describe, expect, it } from "vitest";

import { applyPanelLayout, buildPanelLayout } from "../../src/core/workspaceLayout";

describe("workspace layout", () => {
  it("补齐未保存面板并把比例归一到 100", () => {
    expect(buildPanelLayout([
      { id: 1, sizePercent: 20 },
      { id: 2 },
    ])).toEqual({ "dock-1": 20 / 70 * 100, "dock-2": 50 / 70 * 100 });
  });

  it("只更新当前布局中的可见面板，隐藏插件面板保留原尺寸", () => {
    const panels = [
      { id: 1, kind: "image", sizePercent: 40 },
      { id: 2, kind: "plugin:panel", sizePercent: 35 },
      { id: 3, kind: "plot", sizePercent: 25 },
    ];
    expect(applyPanelLayout(panels, { "dock-1": 1, "dock-3": 3 })).toEqual([
      { id: 1, kind: "image", sizePercent: 25 },
      { id: 2, kind: "plugin:panel", sizePercent: 35 },
      { id: 3, kind: "plot", sizePercent: 75 },
    ]);
  });
});

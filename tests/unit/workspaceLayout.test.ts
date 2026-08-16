import { describe, expect, it } from "vitest";

import {
  applyPanelLayout,
  buildPanelLayout,
  setGroupLayout,
  WORKSPACE_PANEL_MIN_SIZE,
} from "../../src/core/workspaceLayout";

describe("workspace layout", () => {
  it("窄桌面窗口仍保留可用的面板拖动范围", () => {
    const narrowDesktopWidth = 693;
    const mainRange =
      narrowDesktopWidth -
      WORKSPACE_PANEL_MIN_SIZE.mainCenter -
      WORKSPACE_PANEL_MIN_SIZE.sidebar;

    expect(mainRange).toBeGreaterThanOrEqual(160);
    expect(440 - WORKSPACE_PANEL_MIN_SIZE.dockPanel * 2).toBeGreaterThanOrEqual(160);
  });

  it("动态面板尚未注册完成时不下发布局", () => {
    let setCalls = 0;
    const group = {
      getLayout: () => ({ "dock-1": 100 }),
      setLayout: () => {
        setCalls += 1;
        throw new Error("Invalid 1 panel layout: 50%, 50%");
      },
    };

    expect(setGroupLayout(group, { "dock-1": 50, "dock-2": 50 })).toBe(false);
    expect(setCalls).toBe(0);
  });

  it("已注册面板 ID 与目标布局一致时才下发布局", () => {
    let applied: Record<string, number> | undefined;
    const group = {
      getLayout: () => ({ "dock-1": 60, "dock-2": 40 }),
      setLayout: (layout: Record<string, number>) => {
        applied = layout;
        return layout;
      },
    };

    expect(setGroupLayout(group, { "dock-1": 25, "dock-2": 75 })).toBe(true);
    expect(applied).toEqual({ "dock-1": 25, "dock-2": 75 });
    expect(setGroupLayout(group, { "dock-1": 25, "dock-3": 75 })).toBe(false);
  });

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

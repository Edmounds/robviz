import { describe, expect, it } from "vitest";

import { appendPoints, applyMask, selectInRect } from "../../src/core/cloudEdit";

// 恒等 MVP（w=1，NDC = xyz）
const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function cloud() {
  // 5 个点：2 个在矩形 [-0.5,0.5]² 内
  const positions = new Float32Array([
    0, 0, 0, // 内
    0.4, -0.4, 0.5, // 内
    0.9, 0, 0, // 外（x）
    0, 0.9, 0, // 外（y）
    0, 0, 2, // 外（z 超出裁剪体）
  ]);
  const intensity = new Float32Array([10, 20, 30, 40, 50]);
  return { count: 5, positions, intensity };
}

const RECT = { minX: -0.5, minY: -0.5, maxX: 0.5, maxY: 0.5 };

describe("cloudEdit", () => {
  it("矩形框选（NDC + 裁剪体）", () => {
    const mask = selectInRect(cloud(), IDENTITY, RECT);
    expect([...mask]).toEqual([1, 1, 0, 0, 0]);
  });

  it("删除选中", () => {
    const c = cloud();
    const mask = selectInRect(c, IDENTITY, RECT);
    const { kept, removed } = applyMask(c, mask, true);
    expect(kept.count).toBe(3);
    expect(removed.count).toBe(2);
    expect([...kept.intensity!]).toEqual([30, 40, 50]);
    expect([...removed.intensity!]).toEqual([10, 20]);
  });

  it("仅保留选中（裁剪）", () => {
    const c = cloud();
    const mask = selectInRect(c, IDENTITY, RECT);
    const { kept, removed } = applyMask(c, mask, false);
    expect(kept.count).toBe(2);
    expect([...kept.intensity!]).toEqual([10, 20]);
    expect(removed.count).toBe(3);
  });

  it("撤销 = 追加回移除的点", () => {
    const c = cloud();
    const mask = selectInRect(c, IDENTITY, RECT);
    const { kept, removed } = applyMask(c, mask, true);
    const restored = appendPoints(kept, removed);
    expect(restored.count).toBe(5);
    const sum = [...restored.intensity!].reduce((a, b) => a + b, 0);
    expect(sum).toBe(150); // 全部强度找回（顺序无关）
  });

  it("相机后方的点不可选", () => {
    // 透视型 MVP：w = -z（点在 z>0 时 w<0 视为背后）
    const mvp = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1, 0, 0, 0, 0];
    const c = {
      count: 2,
      positions: new Float32Array([0, 0, -1, 0, 0, 1]),
    };
    const mask = selectInRect(c, mvp, RECT);
    expect(mask[0]).toBe(1); // z=-1 → w=1，NDC(0,0)
    expect(mask[1]).toBe(0); // z=1 → w=-1，背后
  });
});

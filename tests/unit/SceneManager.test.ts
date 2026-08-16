import { describe, expect, it, vi } from "vitest";

import { stopHandledPointerDown } from "../../src/renderers/SceneManager";

describe("SceneManager pointer input", () => {
  it("不把已由面板分隔条处理的 pointerdown 传给轨道相机", () => {
    const stopImmediatePropagation = vi.fn();

    stopHandledPointerDown({ defaultPrevented: true, stopImmediatePropagation });

    expect(stopImmediatePropagation).toHaveBeenCalledOnce();
  });

  it("视口内未处理的 pointerdown 仍交给轨道相机", () => {
    const stopImmediatePropagation = vi.fn();

    stopHandledPointerDown({ defaultPrevented: false, stopImmediatePropagation });

    expect(stopImmediatePropagation).not.toHaveBeenCalled();
  });
});

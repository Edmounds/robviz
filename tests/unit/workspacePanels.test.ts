import { describe, expect, it } from "vitest";

import {
  canAddPanel,
  createPanelId,
  isSingletonPanelKind,
  removeMissingPanels,
} from "../../src/core/workspacePanels";

describe("workspace panels", () => {
  it("treats core tools and plugin sections as singletons", () => {
    expect(isSingletonPanelKind("3d")).toBe(true);
    expect(isSingletonPanelKind("topics")).toBe(true);
    expect(isSingletonPanelKind("plugin-section:example:status")).toBe(true);
    expect(isSingletonPanelKind("image")).toBe(false);
    expect(isSingletonPanelKind("plot")).toBe(false);
    expect(isSingletonPanelKind("example:custom-chart")).toBe(false);
  });

  it("prevents a second singleton but permits repeated image panels", () => {
    const panels = [
      { id: "3d", kind: "3d" },
      { id: "image-1", kind: "image" },
    ];

    expect(canAddPanel(panels, "3d")).toBe(false);
    expect(canAddPanel(panels, "image")).toBe(true);
  });

  it("creates stable readable ids without colliding with existing panels", () => {
    const existing = new Set(["image-1", "image-2", "image-4"]);
    expect(createPanelId("image", existing)).toBe("image-3");
    expect(createPanelId("plugin:chart", existing)).toBe("plugin-chart-1");
  });

  it("removes only panels no longer present in dockview", () => {
    const panels = [
      { id: "3d", kind: "3d" },
      { id: "image-1", kind: "image", state: { topic: "/camera" } },
      { id: "plot-1", kind: "plot" },
    ];

    expect(removeMissingPanels(panels, new Set(["3d", "plot-1"]))).toEqual([
      { id: "3d", kind: "3d" },
      { id: "plot-1", kind: "plot" },
    ]);
  });
});

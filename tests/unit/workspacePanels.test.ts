import { describe, expect, it } from "vitest";

import {
  canAddPanel,
  createPanelId,
  getWorkspacePanelPluginOwner,
  isSingletonPanelKind,
  removeMissingPanels,
  shouldRetainWorkspacePanelOnClose,
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

  it("identifies plugin owners for 3d, sections and namespaced panels", () => {
    const pluginPanelOwners = new Map([
      ["custom-plugin:my-panel", "custom-plugin"],
      ["3d", "view-3d"],
    ]);

    expect(getWorkspacePanelPluginOwner("3d", pluginPanelOwners)).toBe("view-3d");
    expect(getWorkspacePanelPluginOwner("plugin-section:teleop:main", pluginPanelOwners)).toBe("teleop");
    expect(getWorkspacePanelPluginOwner("custom-plugin:my-panel", pluginPanelOwners)).toBe("custom-plugin");
    expect(getWorkspacePanelPluginOwner("unknown-plugin:widget", pluginPanelOwners)).toBe("unknown-plugin");
    expect(getWorkspacePanelPluginOwner("image", pluginPanelOwners)).toBeUndefined();
    expect(getWorkspacePanelPluginOwner("plot", pluginPanelOwners)).toBeUndefined();
    expect(getWorkspacePanelPluginOwner("topics", pluginPanelOwners)).toBeUndefined();
  });

  it("retains disabled plugin panels and sections upon dockview reconciliation, but permits user closure", () => {
    const disabledPlugins = ["custom-plugin", "view-3d", "teleop"];
    const pluginPanelOwners = new Map([
      ["custom-plugin:my-panel", "custom-plugin"],
      ["active-plugin:panel", "active-plugin"],
      ["3d", "view-3d"],
    ]);

    // Disabled plugins: must be retained when filtered out by dockview
    expect(shouldRetainWorkspacePanelOnClose("3d", disabledPlugins, pluginPanelOwners)).toBe(true);
    expect(shouldRetainWorkspacePanelOnClose("plugin-section:teleop:main", disabledPlugins, pluginPanelOwners)).toBe(true);
    expect(shouldRetainWorkspacePanelOnClose("custom-plugin:my-panel", disabledPlugins, pluginPanelOwners)).toBe(true);

    // Active plugins: must NOT be retained (user clicked close on an enabled panel)
    expect(shouldRetainWorkspacePanelOnClose("active-plugin:panel", disabledPlugins, pluginPanelOwners)).toBe(false);

    // Built-in panels: must NOT be retained (user clicked close)
    expect(shouldRetainWorkspacePanelOnClose("image", disabledPlugins, pluginPanelOwners)).toBe(false);
    expect(shouldRetainWorkspacePanelOnClose("plot", disabledPlugins, pluginPanelOwners)).toBe(false);
    expect(shouldRetainWorkspacePanelOnClose("topics", disabledPlugins, pluginPanelOwners)).toBe(false);
  });
});

export interface WorkspacePanel {
  id: string;
  kind: string;
  state?: unknown;
}

const SINGLETON_PANEL_KINDS = new Set([
  "3d",
  "topics",
  "teleop",
  "tf-tree",
]);

export function isSingletonPanelKind(kind: string): boolean {
  return SINGLETON_PANEL_KINDS.has(kind) || kind.startsWith("plugin-section:");
}

export function canAddPanel(panels: WorkspacePanel[], kind: string): boolean {
  return !isSingletonPanelKind(kind) || !panels.some((panel) => panel.kind === kind);
}

export function createPanelId(kind: string, existingIds: ReadonlySet<string>): string {
  const prefix = kind.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-|-$/g, "") || "panel";
  let index = 1;
  while (existingIds.has(`${prefix}-${index}`)) index++;
  return `${prefix}-${index}`;
}

export function removeMissingPanels<T extends WorkspacePanel>(
  panels: T[],
  presentIds: ReadonlySet<string>,
): T[] {
  return panels.filter((panel) => presentIds.has(panel.id));
}

export function getWorkspacePanelPluginOwner(
  kind: string,
  pluginPanelOwners?: ReadonlyMap<string, string>,
): string | undefined {
  if (pluginPanelOwners?.has(kind)) {
    return pluginPanelOwners.get(kind);
  }
  if (kind === "3d") {
    return "view-3d";
  }
  if (kind.startsWith("plugin-section:")) {
    return kind.slice("plugin-section:".length).split(":")[0];
  }
  if (kind.includes(":")) {
    return kind.split(":")[0];
  }
  return undefined;
}

export function shouldRetainWorkspacePanelOnClose(
  kind: string,
  disabledPluginIds: ReadonlySet<string> | readonly string[],
  pluginPanelOwners?: ReadonlyMap<string, string>,
): boolean {
  const disabled = disabledPluginIds instanceof Set ? disabledPluginIds : new Set(disabledPluginIds);
  const owner = getWorkspacePanelPluginOwner(kind, pluginPanelOwners);
  return Boolean(owner && disabled.has(owner));
}

export interface WorkspacePanel {
  id: string;
  kind: string;
  state?: unknown;
}

const SINGLETON_PANEL_KINDS = new Set([
  "3d",
  "topics",
  "echo",
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

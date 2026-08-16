export interface SizedPanel {
  id: number;
  sizePercent?: number;
}

export const WORKSPACE_PANEL_MIN_SIZE = {
  mainCenter: 320,
  sidebar: 180,
  viewport: 180,
  dock: 120,
  dockPanel: 140,
  urdfViewport: 320,
  urdfInspector: 220,
} as const;

interface ResizableGroup {
  getLayout(): Record<string, number>;
  setLayout(layout: Record<string, number>): unknown;
}

export function setGroupLayout(
  group: ResizableGroup | null,
  layout: Record<string, number>,
): boolean {
  if (!group) return false;

  const current = group.getLayout();
  const currentIds = Object.keys(current);
  const targetIds = Object.keys(layout);
  if (
    currentIds.length !== targetIds.length ||
    targetIds.some((id) => !Object.hasOwn(current, id))
  ) {
    return false;
  }

  group.setLayout(layout);
  return true;
}

export function layoutPercent(layout: Record<string, number>, id: string): number {
  const total = Object.values(layout).reduce((sum, value) => sum + value, 0);
  return total > 0 ? ((layout[id] ?? 0) / total) * 100 : 0;
}

export function buildPanelLayout(panels: SizedPanel[]): Record<string, number> {
  const fallback = 100 / Math.max(1, panels.length);
  const raw = Object.fromEntries(panels.map((panel) => [
    `dock-${panel.id}`,
    panel.sizePercent ?? fallback,
  ]));
  const total = Object.values(raw).reduce((sum, value) => sum + value, 0);
  return Object.fromEntries(Object.entries(raw).map(([id, value]) => [id, (value / total) * 100]));
}

export function applyPanelLayout<T extends SizedPanel>(
  panels: T[],
  layout: Record<string, number>,
): T[] {
  return panels.map((panel) => {
    const id = `dock-${panel.id}`;
    return id in layout ? { ...panel, sizePercent: layoutPercent(layout, id) } : panel;
  });
}

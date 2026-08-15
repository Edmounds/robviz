export interface SizedPanel {
  id: number;
  sizePercent?: number;
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

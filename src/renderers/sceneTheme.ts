/**
 * 3D 场景主题色:UI chrome 用 CSS 令牌,three.js 材质无法读 CSS 变量,
 * 由本模块提供当前主题的场景配色 + 变更订阅(Grid/Path 等骨架线条用;
 * TF 轴 RGB、点云 colormap 属数据色,不跟随主题)。
 */

export type Theme = "dark" | "light";

export interface SceneColors {
  /** 视口背景 */
  background: number;
  /** 骨架线条(网格、路径) */
  foreground: number;
  /** 无强度点云的回退色(纯白/纯黑点在对应背景上不可见) */
  flatPoint: number;
}

const COLORS: Record<Theme, SceneColors> = {
  dark: { background: 0x000000, foreground: 0xf5f5f5, flatPoint: 0xebebeb },
  light: { background: 0xffffff, foreground: 0x0a0a0a, flatPoint: 0x3c3c3c },
};

let current: Theme = "dark";
const listeners = new Set<(theme: Theme) => void>();

export function getSceneTheme(): Theme {
  return current;
}

export function sceneColors(theme: Theme = current): SceneColors {
  return COLORS[theme];
}

export function setSceneTheme(theme: Theme): void {
  if (theme === current) return;
  current = theme;
  for (const fn of listeners) fn(theme);
}

/** 订阅主题变更,返回取消函数 */
export function onSceneTheme(fn: (theme: Theme) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

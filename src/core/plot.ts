export function relativeArrivalSec(nowMs: number, startedAtMs: number): number {
  return Math.max(0, (nowMs - startedAtMs) / 1000);
}

export function seriesKey(topic: string, field: string): string {
  return `${topic}\0${field}`;
}

export function computeSharedRange(
  series: readonly (readonly number[])[],
  padding = 0.05,
): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const values of series) {
    for (const value of values) {
      if (!Number.isFinite(value)) continue;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [-1, 1];
  const span = max - min;
  const pad = span > 0 ? span * padding : Math.max(Math.abs(min) * padding, 1e-3);
  return [min - pad, max + pad];
}

/** 缩放时间窗口，保持锚点时间不变 */
export function zoomTimeWindow(
  current: [number, number],
  anchorSec: number,
  factor: number,
  minSpan = 1,
  maxSpan = 300,
): [number, number] {
  const [min, max] = current;
  const currentSpan = Math.max(0.1, max - min);
  const nextSpan = Math.max(minSpan, Math.min(maxSpan, currentSpan * factor));
  const ratio = currentSpan > 0 ? (anchorSec - min) / currentSpan : 0.5;
  const clampedRatio = Math.max(0, Math.min(1, ratio));

  const nextMin = Math.max(0, anchorSec - nextSpan * clampedRatio);
  const nextMax = nextMin + nextSpan;
  return [nextMin, nextMax];
}

/** 平移时间窗口 */
export function panTimeWindow(
  current: [number, number],
  deltaSec: number,
  minSec = 0,
): [number, number] {
  const span = current[1] - current[0];
  const nextMin = Math.max(minSec, current[0] + deltaSec);
  return [nextMin, nextMin + span];
}

/** 计算落在指定时间窗口内的数据值 Y 轴范围 */
export function computeRangeInWindow(
  seriesList: ReadonlyArray<{ ts: readonly number[]; vs: readonly number[]; visible?: boolean }>,
  windowRange: [number, number],
  padding = 0.05,
): [number, number] {
  const [wMin, wMax] = windowRange;
  const visibleValues: number[][] = [];
  for (const s of seriesList) {
    if (s.visible === false) continue;
    const inWindow: number[] = [];
    for (let i = 0; i < s.ts.length; i++) {
      const t = s.ts[i];
      if (t >= wMin && t <= wMax) {
        inWindow.push(s.vs[i]);
      }
    }
    if (inWindow.length > 0) visibleValues.push(inWindow);
  }
  return computeSharedRange(visibleValues, padding);
}

export function relativeArrivalSec(nowMs: number, startedAtMs: number): number {
  return Math.max(0, (nowMs - startedAtMs) / 1000);
}

export function seriesKey(topic: string, field: string): string {
  return `${topic}\0${field}`;
}

export function computeSharedRange(series: readonly (readonly number[])[], padding = 0.05): [number, number] {
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

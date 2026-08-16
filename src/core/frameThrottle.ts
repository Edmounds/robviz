/** Return whether a frame may be delivered at the requested maximum rate. */
export function isFrameDue(
  lastDeliveredAt: number,
  now: number,
  maxFrequency?: number,
): boolean {
  if (!(maxFrequency && maxFrequency > 0)) return true;
  return now - lastDeliveredAt >= 1000 / maxFrequency;
}

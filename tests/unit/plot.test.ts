import { describe, expect, it } from "vitest";

import {
  computeRangeInWindow,
  computeSharedRange,
  panTimeWindow,
  relativeArrivalSec,
  seriesKey,
  zoomTimeWindow,
} from "../../src/core/plot";

describe("plot utilities", () => {
  it("uses one relative arrival-time domain for every topic", () => {
    expect(relativeArrivalSec(12_500, 10_000)).toBe(2.5);
    expect(relativeArrivalSec(9_000, 10_000)).toBe(0);
  });

  it("fits all visible finite values with padding", () => {
    expect(computeSharedRange([[0, 10], [-5, Number.NaN]], 0.05)).toEqual([-5.75, 10.75]);
  });

  it("gives constant data a useful non-zero range", () => {
    const [min, max] = computeSharedRange([[24.6, 24.6]], 0.05);
    expect(min).toBeCloseTo(23.37);
    expect(max).toBeCloseTo(25.83);
  });

  it("falls back when no visible finite values exist", () => {
    expect(computeSharedRange([[], [Number.NaN]])).toEqual([-1, 1]);
  });

  it("builds an unambiguous duplicate key", () => {
    expect(seriesKey("/odom", "twist.linear.x")).toBe("/odom\u0000twist.linear.x");
  });

  it("zooms time window anchored at cursor time", () => {
    const original: [number, number] = [10, 30]; // span 20
    const anchor = 20; // middle
    const zoomed = zoomTimeWindow(original, anchor, 0.5); // zoom in by 2x -> span 10
    expect(zoomed[1] - zoomed[0]).toBeCloseTo(10, 4);
    expect(zoomed[0]).toBeCloseTo(15, 4);
    expect(zoomed[1]).toBeCloseTo(25, 4);
  });

  it("pans time window without altering span", () => {
    const original: [number, number] = [10, 30];
    const panned = panTimeWindow(original, 5);
    expect(panned).toEqual([15, 35]);
  });

  it("computes range only for samples within visible time window", () => {
    const series = [
      {
        ts: [0, 5, 10, 15, 20, 25],
        vs: [100, 100, 1, 2, 100, 100], // extreme values outside [8, 18]
        visible: true,
      },
    ];
    const [min, max] = computeRangeInWindow(series, [8, 18], 0.05);
    // Samples in [8, 18] are 1 and 2
    expect(min).toBeLessThanOrEqual(1);
    expect(max).toBeGreaterThanOrEqual(2);
    expect(max).toBeLessThan(10); // 100 is excluded!
  });
});

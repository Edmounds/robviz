import { describe, expect, it } from "vitest";

import { computeSharedRange, relativeArrivalSec, seriesKey } from "../../src/core/plot";

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
});

import { describe, expect, it } from "vitest";

import { isFrameDue } from "../../src/core/frameThrottle";

describe("isFrameDue", () => {
  it("allows the first frame immediately", () => {
    expect(isFrameDue(-Infinity, 0, 5)).toBe(true);
  });

  it("holds frames until the configured interval has elapsed", () => {
    expect(isFrameDue(0, 199, 5)).toBe(false);
    expect(isFrameDue(0, 200, 5)).toBe(true);
  });

  it("allows every frame when no positive limit is configured", () => {
    expect(isFrameDue(100, 101, undefined)).toBe(true);
    expect(isFrameDue(100, 101, 0)).toBe(true);
  });
});

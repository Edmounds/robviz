import { describe, expect, it } from "vitest";

import { canTeleopWrite, readTeleopState } from "../../src/plugins/teleop";

describe("bundled Teleop plugin state", () => {
  it("permits control only for the active connected session", () => {
    expect(canTeleopWrite(true, "open")).toBe(true);
    expect(canTeleopWrite(false, "open")).toBe(false);
    expect(canTeleopWrite(true, "connecting")).toBe(false);
    expect(canTeleopWrite(true, "closed")).toBe(false);
  });

  it("validates imported topic and speed settings", () => {
    expect(readTeleopState({ topic: " /base/cmd_vel ", maxLin: 1.2, maxAng: 2.2 })).toEqual({
      topic: "/base/cmd_vel",
      maxLin: 1.2,
      maxAng: 2.2,
    });
    expect(readTeleopState({ topic: " ", maxLin: 200, maxAng: -1 })).toEqual({
      topic: "/cmd_vel",
      maxLin: 0.5,
      maxAng: 1,
    });
    expect(readTeleopState(null)).toEqual({ topic: "/cmd_vel", maxLin: 0.5, maxAng: 1 });
  });
});

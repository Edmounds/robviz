import { describe, expect, it } from "vitest";

import { connectionTargetLabel } from "../../src/core/connectionTarget";

describe("App session tabs", () => {
  it.each([
    ["ws://192.168.1.42:8765", "192.168.1.42"],
    ["wss://robot.local/bridge", "robot.local"],
    ["ws://[2001:db8::42]:8765", "[2001:db8::42]"],
  ])("shows the connection target for %s", (url, target) => {
    expect(connectionTargetLabel(url)).toBe(target);
  });

  it("keeps an incomplete connection address visible while it is edited", () => {
    expect(connectionTargetLabel("ws://")).toBe("ws://");
  });
});

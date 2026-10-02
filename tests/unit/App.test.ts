import { describe, expect, it } from "vitest";

import { connectionTargetLabel, validateWebSocketUrl } from "../../src/core/connectionTarget";

describe("App session tabs", () => {
  it.each([
    ["ws://192.168.1.42:8765", "192.168.1.42"],
    ["wss://robot.local/bridge", "robot.local"],
    ["ws://[2001:db8::42]:8765", "[2001:db8::42]"],
  ])("shows the connection target for %s", (url, target) => {
    expect(connectionTargetLabel(url)).toBe(target);
  });

  it("rejects malformed WebSocket URLs before constructing a socket", () => {
    expect(validateWebSocketUrl("http://robot:8765").ok).toBe(false);
    expect(validateWebSocketUrl("ws:").ok).toBe(false);
    expect(validateWebSocketUrl("ws://robot:8765/#fragment").ok).toBe(false);
    expect(validateWebSocketUrl("ws://user:password@robot:8765").ok).toBe(false);
    expect(validateWebSocketUrl(" wss://robot.example:8765/bridge ")).toEqual({
      ok: true,
      url: "wss://robot.example:8765/bridge",
    });
  });
});

import { describe, expect, it } from "vitest";

import {
  parseTerminalTarget,
  terminalClientMessageSchema,
  validateTerminalUsername,
} from "../../src/core/terminalProtocol";

describe("terminal protocol", () => {
  it.each([
    ["ws://192.168.1.42:8765", "192.168.1.42"],
    ["wss://robot.local/bridge", "robot.local"],
    ["ws://[2001:db8::42]:8765", "[2001:db8::42]"],
  ])("extracts the SSH host from %s", (url, host) => {
    expect(parseTerminalTarget(url)).toBe(host);
  });

  it.each(["http://robot.local", "not-a-url", "ftp://robot.local"])(
    "rejects a non-WebSocket bridge URL: %s",
    (url) => {
      expect(() => parseTerminalTarget(url)).toThrow("Foxglove WebSocket URL");
    },
  );

  it("accepts Linux SSH usernames and rejects argument-like values", () => {
    expect(validateTerminalUsername("robot-user_1")).toBe("robot-user_1");
    expect(() => validateTerminalUsername("-oProxyCommand=sh")).toThrow("SSH username");
    expect(() => validateTerminalUsername("robot@example.com")).toThrow("SSH username");
  });

  it("bounds terminal dimensions and input messages", () => {
    expect(
      terminalClientMessageSchema.safeParse({
        type: "open",
        bridgeUrl: "ws://robot.local:8765",
        username: "robot",
        password: "secret",
        cols: 120,
        rows: 32,
      }).success,
    ).toBe(true);
    expect(
      terminalClientMessageSchema.safeParse({ type: "resize", cols: 10_000, rows: 32 })
        .success,
    ).toBe(false);
    expect(
      terminalClientMessageSchema.safeParse({ type: "input", data: "x".repeat(65_537) })
        .success,
    ).toBe(false);
    expect(
      terminalClientMessageSchema.safeParse({
        type: "open",
        bridgeUrl: "ws://robot.local:8765",
        username: "robot",
        password: "line\nbreak",
        cols: 80,
        rows: 24,
      }).success,
    ).toBe(false);
  });
});

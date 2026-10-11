import { describe, expect, it } from "vitest";

import {
  CORE_NETWORK_SERVICES,
  createDefaultSession,
  parseAppConfig,
  resolveBaseHost,
  resolveServiceUrl,
  serializeAppConfig,
  type AppConfig,
  type PluginServiceDefinition,
} from "../../src/core/appConfig";

describe("networkServices", () => {
  it("extracts base host from various session url formats", () => {
    expect(resolveBaseHost("ws://192.168.8.112:8765")).toBe("192.168.8.112");
    expect(resolveBaseHost("ws://localhost:8765")).toBe("localhost");
    expect(resolveBaseHost("http://[::1]:8000")).toBe("::1");
    expect(resolveBaseHost("192.168.8.112:8765")).toBe("192.168.8.112");
    expect(resolveBaseHost("")).toBe("localhost");
  });

  it("derives default service URLs using the session base host and protocol", () => {
    const session = {
      ...createDefaultSession("robot-1", "Robot 1"),
      url: "ws://192.168.8.112:8765",
    };

    const foxglove = CORE_NETWORK_SERVICES.find((s) => s.id === "foxglove")!;
    const video = CORE_NETWORK_SERVICES.find((s) => s.id === "video")!;
    const terminal = CORE_NETWORK_SERVICES.find((s) => s.id === "terminal")!;
    const web = CORE_NETWORK_SERVICES.find((s) => s.id === "web")!;
    const runtime: PluginServiceDefinition = {
      id: "runtime",
      label: "运行管理",
      defaultPort: 8001,
      protocol: "http",
    };

    expect(resolveServiceUrl(foxglove, session)).toBe("ws://192.168.8.112:8765");
    expect(resolveServiceUrl(video, session)).toBe("ws://192.168.8.112:8787");
    expect(resolveServiceUrl(terminal, session)).toBe("ws://192.168.8.112:8767");
    expect(resolveServiceUrl(web, session)).toBe("http://192.168.8.112:8000");
    expect(resolveServiceUrl(runtime, session)).toBe("http://192.168.8.112:8001");
  });

  it("upgrades ws to wss when base session URL uses wss, while keeping http", () => {
    const session = {
      ...createDefaultSession("robot-1", "Robot 1"),
      url: "wss://secure-robot.local:8765",
    };

    const video = CORE_NETWORK_SERVICES.find((s) => s.id === "video")!;
    const runtime: PluginServiceDefinition = {
      id: "runtime",
      label: "运行管理",
      defaultPort: 8001,
      protocol: "http",
    };

    expect(resolveServiceUrl(video, session)).toBe("wss://secure-robot.local:8787");
    expect(resolveServiceUrl(runtime, session)).toBe("http://secure-robot.local:8001");
  });

  it("applies port, host, and full URL overrides per service", () => {
    const session = {
      ...createDefaultSession("robot-1", "Robot 1"),
      url: "ws://192.168.8.112:8765",
      networkOverrides: {
        runtime: { port: 8005 },
        video: { host: "192.168.8.200", port: 9000 },
        terminal: { url: "ws://terminal-proxy:8767/shell" },
      },
    };

    const runtime: PluginServiceDefinition = {
      id: "runtime",
      label: "运行管理",
      defaultPort: 8001,
      protocol: "http",
    };
    const video = CORE_NETWORK_SERVICES.find((s) => s.id === "video")!;
    const terminal = CORE_NETWORK_SERVICES.find((s) => s.id === "terminal")!;

    expect(resolveServiceUrl(runtime, session)).toBe("http://192.168.8.112:8005");
    expect(resolveServiceUrl(video, session)).toBe("ws://192.168.8.200:9000");
    expect(resolveServiceUrl(terminal, session)).toBe("ws://terminal-proxy:8767/shell");
  });

  it("round-trips networkOverrides within AppConfig JSON serialization", () => {
    const session = {
      ...createDefaultSession("robot-1", "Robot 1"),
      url: "ws://192.168.8.112:8765",
      networkOverrides: {
        runtime: { port: 8005 },
      },
    };
    const config: AppConfig = {
      version: 3,
      activeSessionId: session.id,
      theme: "dark",
      settings: { language: "zh-CN", fontScale: 1, disabledPluginIds: [] },
      sessions: [session],
    };

    const parsed = parseAppConfig(serializeAppConfig(config));
    expect(parsed.sessions[0].networkOverrides?.runtime?.port).toBe(8005);
  });
});

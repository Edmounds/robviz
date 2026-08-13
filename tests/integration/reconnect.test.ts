/** 网络韧性：服务端被掐断后，客户端指数退避重连并自动恢复订阅 */
import { WebSocket } from "ws";
import { describe, expect, it } from "vitest";

import { startMockServer } from "../../mock/server";
import { FoxgloveConnection } from "../../src/core/FoxgloveConnection";
import type { ConnectionState } from "../../src/core/FoxgloveConnection";
import type { IWebSocket } from "@foxglove/ws-protocol";

const PORT = 18790;

function waitFor(check: () => boolean, timeoutMs: number, what: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const timer = setInterval(() => {
      if (check()) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - t0 > timeoutMs) {
        clearInterval(timer);
        reject(new Error(`timeout waiting for ${what}`));
      }
    }, 50);
  });
}

describe("断线重连", () => {
  it("服务端重启后自动重连并恢复订阅、数据继续流动", async () => {
    let server = await startMockServer(PORT);

    const states: ConnectionState[] = [];
    let scanCount = 0;
    const conn = new FoxgloveConnection(`ws://localhost:${PORT}`, {
      createWebSocket: (u, p) => new WebSocket(u, p) as unknown as IWebSocket,
      reconnectMs: 100, // 测试用小退避基数
      onStateChange: (s) => states.push(s),
    });
    conn.subscribe("/scan", () => scanCount++);

    // 第一段连接有数据
    await waitFor(() => scanCount > 2, 8000, "initial scan messages");

    // 掐断服务端（terminate 所有连接 + 关端口）
    await server.close();
    await waitFor(() => states.includes("closed"), 5000, "close event");

    const countAtRestart = scanCount;
    server = await startMockServer(PORT);

    // 重连后订阅自动恢复，数据继续
    await waitFor(
      () => scanCount > countAtRestart + 2,
      10000,
      "scan messages after reconnect",
    );
    expect(states.filter((s) => s === "open").length).toBeGreaterThanOrEqual(2);

    conn.close();
    await server.close();
  });
});

import { once } from "node:events";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";

async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("failed to allocate test port");
  const port = address.port;
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  return port;
}

async function waitForGateway(port: number, timeoutMs = 5_000): Promise<WebSocket> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("gateway connection timeout")), 500);
        socket.once("open", () => {
          clearTimeout(timer);
          resolve();
        });
        socket.once("error", (error) => {
          clearTimeout(timer);
          reject(error);
        });
      });
      return socket;
    } catch {
      socket.close();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("npm run dev did not start the terminal gateway");
}

async function closeSocket(socket: WebSocket): Promise<void> {
  if (socket.readyState === WebSocket.CLOSED) return;
  await new Promise<void>((resolve) => {
    socket.once("close", () => resolve());
    socket.close();
  });
}

let devProcess: ChildProcess | undefined;

afterEach(async () => {
  if (!devProcess || devProcess.exitCode !== null) return;
  devProcess.kill("SIGTERM");
  await once(devProcess, "exit");
  devProcess = undefined;
});

describe("Vite development startup", () => {
  it("starts the terminal gateway only when explicitly requested", async () => {
    const vitePort = await freePort();
    const gatewayPort = await freePort();
    devProcess = spawn(process.execPath, [
      join(process.cwd(), "node_modules/vite/bin/vite.js"),
      "--host",
      "127.0.0.1",
      "--port",
      String(vitePort),
    ], {
      env: { ...process.env, ROBVIZ_START_TERMINAL: "1", ROBVIZ_TERMINAL_GATEWAY_PORT: String(gatewayPort) },
      stdio: "ignore",
    });

    const socket = await waitForGateway(gatewayPort);
    expect(socket.readyState).toBe(WebSocket.OPEN);
    await closeSocket(socket);
  }, 10_000);
});

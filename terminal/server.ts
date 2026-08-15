import { createHash, timingSafeEqual } from "node:crypto";
import { accessSync, chmodSync, constants } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import * as nodePty from "node-pty";
import { WebSocket, WebSocketServer } from "ws";

import {
  parseTerminalTarget,
  terminalClientMessageSchema,
  validateTerminalUsername,
  type TerminalServerMessage,
} from "../src/core/terminalProtocol.ts";

const HOST = "127.0.0.1";
const DEFAULT_PORT = 8767;
const MAX_SESSIONS = 4;
const MAX_PAYLOAD_BYTES = 128 * 1024;
const require = createRequire(import.meta.url);

interface DisposableLike {
  dispose(): void;
}

export interface PtyProcessLike {
  onData(handler: (data: string) => void): DisposableLike;
  onExit(handler: (event: { exitCode: number; signal?: number }) => void): DisposableLike;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(signal?: string): void;
}

export type SpawnPty = (
  host: string,
  username: string,
  cols: number,
  rows: number,
) => PtyProcessLike;

export interface TerminalGatewayOptions {
  token: string;
  port?: number;
  spawnPty?: SpawnPty;
}

export interface TerminalGatewayHandle {
  url: string;
  close(): Promise<void>;
}

function secureTokenEqual(expected: string, supplied: string): boolean {
  const expectedHash = createHash("sha256").update(expected).digest();
  const suppliedHash = createHash("sha256").update(supplied).digest();
  return timingSafeEqual(expectedHash, suppliedHash);
}

function processEnvironment(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] != null),
  );
}

function ensurePtyHelperExecutable(): void {
  if (process.platform === "win32") return;
  const packageRoot = dirname(require.resolve("node-pty/package.json"));
  const candidates = [
    join(packageRoot, "prebuilds", `${process.platform}-${process.arch}`, "spawn-helper"),
    join(packageRoot, "build", "Release", "spawn-helper"),
  ];
  for (const helper of candidates) {
    try {
      accessSync(helper, constants.F_OK);
      try {
        accessSync(helper, constants.X_OK);
      } catch {
        chmodSync(helper, 0o755);
      }
      return;
    } catch {
      // Try the source-build location next.
    }
  }
}

const spawnSsh: SpawnPty = (host, username, cols, rows) =>
  nodePty.spawn("ssh", [`${username}@${host}`], {
    name: "xterm-256color",
    cols,
    rows,
    cwd: process.env.HOME ?? process.cwd(),
    env: processEnvironment(),
  });

function send(ws: WebSocket, message: TerminalServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
}

export async function startTerminalGateway(
  options: TerminalGatewayOptions,
): Promise<TerminalGatewayHandle> {
  if (options.token.length < 32) {
    throw new Error("ROBVIZ_TERMINAL_TOKEN must contain at least 32 characters");
  }

  if (!options.spawnPty) ensurePtyHelperExecutable();
  const spawnPty = options.spawnPty ?? spawnSsh;
  const wss = new WebSocketServer({
    host: HOST,
    port: options.port ?? DEFAULT_PORT,
    maxPayload: MAX_PAYLOAD_BYTES,
  });
  let activeSessions = 0;

  wss.on("connection", (ws) => {
    let child: PtyProcessLike | undefined;
    let dataSubscription: DisposableLike | undefined;
    let exitSubscription: DisposableLike | undefined;

    const releaseChild = (kill: boolean): void => {
      const current = child;
      if (!current) return;
      child = undefined;
      dataSubscription?.dispose();
      exitSubscription?.dispose();
      dataSubscription = undefined;
      exitSubscription = undefined;
      activeSessions -= 1;
      if (kill) {
        try {
          current.kill();
        } catch {
          // The SSH process may have exited before node-pty delivered its exit event.
        }
      }
    };

    ws.on("message", (raw) => {
      let input: unknown;
      try {
        input = JSON.parse(raw.toString());
      } catch {
        send(ws, { type: "error", code: "INVALID_MESSAGE", message: "消息不是合法 JSON" });
        return;
      }

      const parsed = terminalClientMessageSchema.safeParse(input);
      if (!parsed.success) {
        send(ws, { type: "error", code: "INVALID_MESSAGE", message: "终端消息格式不合法" });
        return;
      }

      const message = parsed.data;
      if (message.type === "open") {
        if (!secureTokenEqual(options.token, message.token)) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "error",
                code: "AUTH_FAILED",
                message: "终端网关 Token 不正确",
              } satisfies TerminalServerMessage),
              () => ws.close(1008, "authentication failed"),
            );
          }
          return;
        }
        if (child) {
          send(ws, { type: "error", code: "ALREADY_OPEN", message: "当前连接已有终端会话" });
          return;
        }
        if (activeSessions >= MAX_SESSIONS) {
          send(ws, { type: "error", code: "SESSION_LIMIT", message: "终端会话数量已达上限" });
          return;
        }

        try {
          const host = parseTerminalTarget(message.bridgeUrl);
          const username = validateTerminalUsername(message.username);
          const nextChild = spawnPty(host, username, message.cols, message.rows);
          child = nextChild;
          activeSessions += 1;
          dataSubscription = nextChild.onData((data) => send(ws, { type: "output", data }));
          exitSubscription = nextChild.onExit(({ exitCode, signal = 0 }) => {
            if (child !== nextChild) return;
            releaseChild(false);
            send(ws, { type: "exit", exitCode, signal });
          });
          send(ws, { type: "ready", host, username });
        } catch (error) {
          releaseChild(true);
          send(ws, {
            type: "error",
            code: "OPEN_FAILED",
            message: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      if (!child) {
        send(ws, { type: "error", code: "NOT_OPEN", message: "终端会话尚未连接" });
        return;
      }
      if (message.type === "input") child.write(message.data);
      if (message.type === "resize") child.resize(message.cols, message.rows);
      if (message.type === "close") {
        releaseChild(true);
        send(ws, { type: "exit", exitCode: 0, signal: 15 });
      }
    });

    ws.on("close", () => releaseChild(true));
    ws.on("error", () => releaseChild(true));
  });

  await new Promise<void>((resolve, reject) => {
    wss.once("listening", resolve);
    wss.once("error", reject);
  });

  const address = wss.address();
  if (!address || typeof address === "string") throw new Error("Terminal gateway did not bind TCP");

  return {
    url: `ws://${HOST}:${address.port}`,
    close: async () => {
      for (const client of wss.clients) client.terminate();
      await new Promise<void>((resolve, reject) => {
        wss.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

async function main(): Promise<void> {
  const token = process.env.ROBVIZ_TERMINAL_TOKEN ?? "";
  const gateway = await startTerminalGateway({ token });
  console.log(`RobViz terminal gateway listening on ${gateway.url}`);

  const stop = async (): Promise<void> => {
    await gateway.close();
    process.exit(0);
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

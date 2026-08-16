import { EventEmitter } from "node:events";

import { afterEach, describe, expect, it, vi } from "vitest";
import { WebSocket } from "ws";

import {
  startTerminalGateway,
  type PtyProcessLike,
  type TerminalGatewayHandle,
} from "../../terminal/server";
import type { TerminalServerMessage } from "../../src/core/terminalProtocol";

const PASSWORD = "s3cret";

class FakePty implements PtyProcessLike {
  readonly writes: string[] = [];
  readonly resizes: Array<[number, number]> = [];
  killed = false;
  #events = new EventEmitter();

  onData(handler: (data: string) => void) {
    this.#events.on("data", handler);
    return { dispose: () => this.#events.off("data", handler) };
  }

  onExit(handler: (event: { exitCode: number; signal?: number }) => void) {
    this.#events.on("exit", handler);
    return { dispose: () => this.#events.off("exit", handler) };
  }

  write(data: string): void {
    this.writes.push(data);
  }

  resize(cols: number, rows: number): void {
    this.resizes.push([cols, rows]);
  }

  kill(): void {
    this.killed = true;
  }

  emitData(data: string): void {
    this.#events.emit("data", data);
  }

  emitExit(exitCode: number, signal: number): void {
    this.#events.emit("exit", { exitCode, signal });
  }
}

function nextMessage(ws: WebSocket): Promise<TerminalServerMessage> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("terminal message timeout")), 2_000);
    ws.once("message", (raw) => {
      clearTimeout(timer);
      resolve(JSON.parse(raw.toString()) as TerminalServerMessage);
    });
  });
}

async function connect(handle: TerminalGatewayHandle): Promise<WebSocket> {
  const ws = new WebSocket(handle.url);
  await new Promise<void>((resolve, reject) => {
    ws.once("open", resolve);
    ws.once("error", reject);
  });
  return ws;
}

let handle: TerminalGatewayHandle | undefined;

afterEach(async () => {
  await handle?.close();
  handle = undefined;
});

describe("terminal gateway", () => {
  it("rejects non-local browser origins before spawning SSH", async () => {
    const spawned: FakePty[] = [];
    handle = await startTerminalGateway({
      port: 0,
      spawnPty: () => {
        const pty = new FakePty();
        spawned.push(pty);
        return pty;
      },
    });
    const ws = new WebSocket(handle.url, { headers: { Origin: "https://evil.example" } });
    await new Promise<void>((resolve) => ws.once("close", () => resolve()));
    expect(spawned).toHaveLength(0);
  });

  it("opens SSH with a password without requiring a gateway token", async () => {
    const pty = new FakePty();
    handle = await startTerminalGateway({ port: 0, spawnPty: () => pty });
    const ws = await connect(handle);
    ws.send(
      JSON.stringify({
        type: "open",
        bridgeUrl: "ws://robot.local:8765",
        username: "robot",
        password: PASSWORD,
        cols: 80,
        rows: 24,
      }),
    );

    expect(await nextMessage(ws)).toEqual({
      type: "ready",
      host: "robot.local",
      username: "robot",
    });
    const firstPromptChunk = nextMessage(ws);
    pty.emitData("robot@robot.local's pass");
    expect(await firstPromptChunk).toEqual({
      type: "output",
      data: "robot@robot.local's pass",
    });
    const secondPromptChunk = nextMessage(ws);
    pty.emitData("word: ");
    expect(await secondPromptChunk).toEqual({
      type: "output",
      data: "word: ",
    });
    await vi.waitFor(() => expect(pty.writes).toEqual([`${PASSWORD}\r`]));
  });

  it("forwards terminal data, resize, exit, and explicit close", async () => {
    const pty = new FakePty();
    const second = new FakePty();
    const ptys = [pty, second];
    handle = await startTerminalGateway({ port: 0, spawnPty: () => ptys.shift()! });
    const ws = await connect(handle);
    ws.send(
      JSON.stringify({
        type: "open",
        bridgeUrl: "ws://192.168.1.42:8765",
        username: "robot",
        password: PASSWORD,
        cols: 100,
        rows: 30,
      }),
    );
    expect(await nextMessage(ws)).toEqual({
      type: "ready",
      host: "192.168.1.42",
      username: "robot",
    });

    ws.send(JSON.stringify({ type: "input", data: "pwd\r" }));
    ws.send(JSON.stringify({ type: "resize", cols: 120, rows: 36 }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(pty.writes).toEqual(["pwd\r"]);
    expect(pty.resizes).toEqual([[120, 36]]);

    const output = nextMessage(ws);
    pty.emitData("/home/robot\r\n");
    expect(await output).toEqual({ type: "output", data: "/home/robot\r\n" });

    const exit = nextMessage(ws);
    pty.emitExit(7, 0);
    expect(await exit).toEqual({ type: "exit", exitCode: 7, signal: 0 });

    ws.send(
      JSON.stringify({
        type: "open",
        bridgeUrl: "wss://robot.local/bridge",
        username: "robot",
        password: PASSWORD,
        cols: 80,
        rows: 24,
      }),
    );
    expect(await nextMessage(ws)).toMatchObject({ type: "ready", host: "robot.local" });
    const closed = nextMessage(ws);
    ws.send(JSON.stringify({ type: "close" }));
    expect(await closed).toEqual({ type: "exit", exitCode: 0, signal: 15 });
    expect(second.killed).toBe(true);
  });

  it("kills the PTY when the browser disconnects", async () => {
    const pty = new FakePty();
    handle = await startTerminalGateway({ port: 0, spawnPty: () => pty });
    const ws = await connect(handle);
    ws.send(
      JSON.stringify({
        type: "open",
        bridgeUrl: "ws://robot.local:8765",
        username: "robot",
        password: PASSWORD,
        cols: 80,
        rows: 24,
      }),
    );
    await nextMessage(ws);
    ws.close();
    await new Promise<void>((resolve) => ws.once("close", () => resolve()));
    await vi.waitFor(() => expect(pty.killed).toBe(true));
  });

  it("limits the gateway to four concurrent SSH sessions", async () => {
    handle = await startTerminalGateway({ port: 0, spawnPty: () => new FakePty() });
    const sockets: WebSocket[] = [];
    for (let index = 0; index < 5; index += 1) {
      const ws = await connect(handle);
      sockets.push(ws);
      ws.send(
        JSON.stringify({
          type: "open",
          bridgeUrl: "ws://robot.local:8765",
          username: "robot",
          password: PASSWORD,
          cols: 80,
          rows: 24,
        }),
      );
      const message = await nextMessage(ws);
      if (index < 4) expect(message.type).toBe("ready");
      else expect(message).toMatchObject({ type: "error", code: "SESSION_LIMIT" });
    }
    for (const ws of sockets) ws.close();
  });
});

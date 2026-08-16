import { parse } from "@foxglove/rosmsg";
import { MessageWriter } from "@foxglove/rosmsg2-serialization";
import type { IWebSocket } from "@foxglove/ws-protocol";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FoxgloveConnection } from "../../src/core/FoxgloveConnection";

class FakeWebSocket implements IWebSocket {
  binaryType = "";
  protocol = "foxglove.websocket.v1";
  onerror: IWebSocket["onerror"] = null;
  onopen: IWebSocket["onopen"] = null;
  onclose: IWebSocket["onclose"] = null;
  onmessage: IWebSocket["onmessage"] = null;
  sent: Array<string | ArrayBuffer | ArrayBufferView> = [];
  closeCount = 0;

  send(data: string | ArrayBuffer | ArrayBufferView): void {
    this.sent.push(data);
  }

  close(): void {
    this.closeCount++;
    this.onclose?.({});
  }

  open(): void {
    this.onopen?.({});
  }

  message(data: string | ArrayBuffer): void {
    this.onmessage?.({ data });
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function messageData(subscriptionId: number, data: ArrayBufferView): ArrayBuffer {
  const bytes = new Uint8Array(13 + data.byteLength);
  const view = new DataView(bytes.buffer);
  view.setUint8(0, 1);
  view.setUint32(1, subscriptionId, true);
  view.setBigUint64(5, 1n, true);
  bytes.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength), 13);
  return bytes.buffer;
}

describe("FoxgloveConnection", () => {
  it("drops throttled messages before decoding them", () => {
    const ws = new FakeWebSocket();
    const errors: Error[] = [];
    const received: unknown[] = [];
    const meta: Array<{ decoded: boolean; bytes: number }> = [];
    const conn = new FoxgloveConnection("ws://test", {
      createWebSocket: () => ws,
      reconnectMs: 0,
      heartbeatIntervalMs: 0,
      onError: (error) => errors.push(error),
      onMessageMeta: ({ decoded, bytes }) => meta.push({ decoded, bytes }),
    });

    conn.subscribe(
      "/counter",
      (message) => received.push(message),
      { maxFrequency: 1 },
    );
    ws.open();
    ws.message(
      JSON.stringify({
        op: "advertise",
        channels: [
          {
            id: 7,
            topic: "/counter",
            encoding: "cdr",
            schemaName: "std_msgs/msg/UInt32",
            schema: "uint32 data",
            schemaEncoding: "ros2msg",
          },
        ],
      }),
    );

    const subscription = ws.sent
      .filter((data): data is string => typeof data === "string")
      .map((data) => JSON.parse(data) as { op?: string; subscriptions?: Array<{ id: number }> })
      .find((data) => data.op === "subscribe");
    const subscriptionId = subscription?.subscriptions?.[0]?.id;
    expect(subscriptionId).toEqual(expect.any(Number));

    const writer = new MessageWriter(parse("uint32 data", { ros2: true }));
    ws.message(messageData(subscriptionId!, writer.writeMessage({ data: 42 })));
    ws.message(messageData(subscriptionId!, new Uint8Array([0])));

    expect(received).toEqual([{ data: 42 }]);
    expect(errors).toEqual([]);
    expect(meta).toHaveLength(2);
    expect(meta[0].decoded).toBe(true);
    expect(meta[1].decoded).toBe(false);
    expect(meta[1].bytes).toBe(1);
    conn.close();
  });

  it("keeps a healthy connection open when subscribed topics are quiet", async () => {
    vi.useFakeTimers();
    const ws = new FakeWebSocket();
    const errors: Error[] = [];
    const conn = new FoxgloveConnection("ws://test", {
      createWebSocket: () => ws,
      reconnectMs: 0,
      onError: (error) => errors.push(error),
    });

    conn.subscribe("/events", () => undefined);
    ws.open();
    ws.message(
      JSON.stringify({
        op: "advertise",
        channels: [
          {
            id: 9,
            topic: "/events",
            encoding: "cdr",
            schemaName: "std_msgs/msg/Empty",
            schema: "",
            schemaEncoding: "ros2msg",
          },
        ],
      }),
    );

    await vi.advanceTimersByTimeAsync(20_000);

    expect(ws.closeCount).toBe(0);
    expect(errors).toEqual([]);
    conn.close();
  });

  it("reconnects when a protocol heartbeat receives no server response", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const sockets: FakeWebSocket[] = [];
    const states: string[] = [];
    const errors: Error[] = [];
    const conn = new FoxgloveConnection("ws://test", {
      createWebSocket: () => {
        const ws = new FakeWebSocket();
        sockets.push(ws);
        return ws;
      },
      reconnectMs: 100,
      heartbeatIntervalMs: 1_000,
      heartbeatTimeoutMs: 3_000,
      onStateChange: (state) => states.push(state),
      onError: (error) => errors.push(error),
    });

    sockets[0].open();
    sockets[0].message(
      JSON.stringify({
        op: "serverInfo",
        name: "test",
        capabilities: ["parameters"],
        supportedEncodings: ["cdr"],
      }),
    );
    await vi.advanceTimersByTimeAsync(4_100);

    expect(sockets[0].closeCount).toBe(1);
    expect(errors.map((error) => error.message)).toContain(
      "connection heartbeat timed out (>3000ms), reconnecting",
    );
    await vi.advanceTimersByTimeAsync(100);
    expect(sockets).toHaveLength(2);
    expect(states).toContain("closed");
    conn.close();
  });

  it("keeps a quiet connection alive with protocol heartbeat responses", async () => {
    vi.useFakeTimers();
    const ws = new FakeWebSocket();
    const errors: Error[] = [];
    const conn = new FoxgloveConnection("ws://test", {
      createWebSocket: () => ws,
      reconnectMs: 0,
      heartbeatIntervalMs: 1_000,
      heartbeatTimeoutMs: 3_000,
      onError: (error) => errors.push(error),
    });

    ws.open();
    ws.message(
      JSON.stringify({
        op: "serverInfo",
        name: "test",
        capabilities: ["parameters"],
        supportedEncodings: ["cdr"],
      }),
    );
    for (let elapsed = 0; elapsed < 10_000; elapsed += 1_000) {
      await vi.advanceTimersByTimeAsync(1_000);
      const heartbeat = ws.sent
        .filter((data): data is string => typeof data === "string")
        .map((data) => JSON.parse(data) as { op?: string; parameterNames?: string[] })
        .findLast((message) => message.op === "getParameters");
      expect(heartbeat?.parameterNames).toEqual(["/__robviz_heartbeat__:probe"]);
      ws.message(JSON.stringify({ op: "parameterValues", parameters: [] }));
    }

    expect(ws.closeCount).toBe(0);
    expect(errors).toEqual([]);
    conn.close();
  });

  it("increases reconnect backoff until a connection stays stable", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const sockets: FakeWebSocket[] = [];
    const conn = new FoxgloveConnection("ws://test", {
      createWebSocket: () => {
        const ws = new FakeWebSocket();
        sockets.push(ws);
        return ws;
      },
      reconnectMs: 100,
    });

    sockets[0].open();
    sockets[0].close();
    await vi.advanceTimersByTimeAsync(100);
    expect(sockets).toHaveLength(2);

    sockets[1].open();
    sockets[1].close();
    await vi.advanceTimersByTimeAsync(169);
    expect(sockets).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(sockets).toHaveLength(3);

    sockets[2].open();
    await vi.advanceTimersByTimeAsync(15_000);
    sockets[2].close();
    await vi.advanceTimersByTimeAsync(99);
    expect(sockets).toHaveLength(3);
    await vi.advanceTimersByTimeAsync(1);
    expect(sockets).toHaveLength(4);
    conn.close();
  });
});

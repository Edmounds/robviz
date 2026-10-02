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

  it("rejects invalid WebSocket URLs cleanly without unhandled exceptions or reconnect loops", () => {
    const errors: Error[] = [];
    const states: string[] = [];
    const conn = new FoxgloveConnection("http://not-a-ws-url", {
      reconnectMs: 100,
      onError: (err) => errors.push(err),
      onStateChange: (state) => states.push(state),
    });

    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain("protocol");
    expect(states).toEqual(["closed"]);
    conn.close();
  });

  it("clears channels and services and rejects pending service calls on close", async () => {
    const ws = new FakeWebSocket();
    const channelsHistory: Array<unknown[]> = [];
    const servicesHistory: Array<unknown[]> = [];
    const conn = new FoxgloveConnection("ws://test", {
      createWebSocket: () => ws,
      reconnectMs: 0,
      heartbeatIntervalMs: 0,
      onChannels: (channels) => channelsHistory.push(channels),
      onServices: (services) => servicesHistory.push(services),
    });

    ws.open();
    ws.message(
      JSON.stringify({
        op: "advertiseServices",
        services: [
          {
            id: 1,
            name: "/test_srv",
            type: "std_srvs/srv/Trigger",
            requestSchema: "",
            responseSchema: "bool success",
          },
        ],
      }),
    );
    expect(conn.services.length).toBe(1);

    const callPromise = conn.callService("/test_srv", {});
    conn.close();

    await expect(callPromise).rejects.toThrow("connection closed");
    expect(conn.topics).toEqual([]);
    expect(conn.services).toEqual([]);
    expect(channelsHistory.at(-1)).toEqual([]);
    expect(servicesHistory.at(-1)).toEqual([]);
  });

  it("quarantines a channel with bad schema, logs error once, keeps other channels healthy, and recovers on re-advertise", () => {
    const ws = new FakeWebSocket();
    const errors: Error[] = [];
    const receivedA: unknown[] = [];
    const receivedB: unknown[] = [];
    const conn = new FoxgloveConnection("ws://test", {
      createWebSocket: () => ws,
      reconnectMs: 0,
      heartbeatIntervalMs: 0,
      onError: (err) => errors.push(err),
    });

    conn.subscribe("/topic_a", (msg) => receivedA.push(msg));
    conn.subscribe("/topic_b", (msg) => receivedB.push(msg));
    ws.open();

    // Advertise topic A with malformed schema, topic B with valid schema
    ws.message(
      JSON.stringify({
        op: "advertise",
        channels: [
          {
            id: 1,
            topic: "/topic_a",
            encoding: "cdr",
            schemaName: "std_msgs/msg/String",
            schema: "MALFORMED BROKEN SCHEMA (((",
          },
          {
            id: 2,
            topic: "/topic_b",
            encoding: "cdr",
            schemaName: "std_msgs/msg/String",
            schema: "string data",
          },
        ],
      }),
    );

    const writerB = new MessageWriter(parse("string data", { ros2: true }));
    const bData = writerB.writeMessage({ data: "hello B" });

    // Send valid message on B
    const findSubId = (channelId: number) => {
      const subs = ws.sent
        .filter((data): data is string => typeof data === "string")
        .map((data) => JSON.parse(data) as { op?: string; subscriptions?: Array<{ id: number; channelId: number }> })
        .filter((data) => data.op === "subscribe")
        .flatMap((data) => data.subscriptions ?? []);
      return subs.find((s) => s.channelId === channelId)?.id;
    };

    const subIdA = findSubId(1)!;
    const subIdB = findSubId(2)!;

    ws.message(messageData(subIdB, bData));
    expect(receivedB).toEqual([{ data: "hello B" }]);
    expect(errors.length).toBe(0);

    // Send data on A: triggers reader build which fails, reports error once, quarantines channel 1
    const dummyBytes = new Uint8Array([0, 1, 0, 0, 0, 0, 0, 0]);
    ws.message(messageData(subIdA, dummyBytes));
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain("bad schema/encoding for /topic_a");

    // Second message on A: quarantined, skips without logging duplicate error
    ws.message(messageData(subIdA, dummyBytes));
    expect(errors.length).toBe(1);
    expect(receivedA.length).toBe(0);

    // Channel B continues to work fine
    ws.message(messageData(subIdB, writerB.writeMessage({ data: "hello B again" })));
    expect(receivedB.length).toBe(2);

    // Re-advertise topic A with corrected schema
    ws.message(
      JSON.stringify({
        op: "advertise",
        channels: [
          {
            id: 1,
            topic: "/topic_a",
            encoding: "cdr",
            schemaName: "std_msgs/msg/String",
            schema: "string data",
          },
        ],
      }),
    );

    const writerA = new MessageWriter(parse("string data", { ros2: true }));
    ws.message(messageData(subIdA, writerA.writeMessage({ data: "recovered A" })));
    expect(receivedA).toEqual([{ data: "recovered A" }]);
    // No new errors
    expect(errors.length).toBe(1);

    conn.close();
  });

  it("ignores late events from a previous connection generation", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const sockets: FakeWebSocket[] = [];
    const states: string[] = [];
    const conn = new FoxgloveConnection("ws://test", {
      createWebSocket: () => {
        const socket = new FakeWebSocket();
        sockets.push(socket);
        return socket;
      },
      reconnectMs: 100,
      heartbeatIntervalMs: 0,
      onStateChange: (state) => states.push(state),
    });

    sockets[0].open();
    sockets[0].close();
    await vi.advanceTimersByTimeAsync(100);
    expect(sockets).toHaveLength(2);
    sockets[1].open();

    sockets[0].message(JSON.stringify({
      op: "advertise",
      channels: [{ id: 77, topic: "/stale", encoding: "cdr", schemaName: "std_msgs/msg/String", schema: "string data" }],
    }));

    expect(conn.topics).toEqual([]);
    expect(states.at(-1)).toBe("open");
    conn.close();
  });
});

import { parse } from "@foxglove/rosmsg";
import { MessageWriter } from "@foxglove/rosmsg2-serialization";
import type { IWebSocket } from "@foxglove/ws-protocol";
import { describe, expect, it } from "vitest";

import { FoxgloveConnection } from "../../src/core/FoxgloveConnection";

class FakeWebSocket implements IWebSocket {
  binaryType = "";
  protocol = "foxglove.websocket.v1";
  onerror: IWebSocket["onerror"] = null;
  onopen: IWebSocket["onopen"] = null;
  onclose: IWebSocket["onclose"] = null;
  onmessage: IWebSocket["onmessage"] = null;
  sent: Array<string | ArrayBuffer | ArrayBufferView> = [];

  send(data: string | ArrayBuffer | ArrayBufferView): void {
    this.sent.push(data);
  }

  close(): void {
    this.onclose?.({});
  }

  open(): void {
    this.onopen?.({});
  }

  message(data: string | ArrayBuffer): void {
    this.onmessage?.({ data });
  }
}

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
      staleTimeoutMs: 0,
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
});

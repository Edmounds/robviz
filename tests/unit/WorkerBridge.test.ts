import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WorkerBridge } from "../../src/bridge/WorkerBridge";
import type { MainToWorker, WorkerToMain } from "../../src/worker/protocol";

class FakeWorker {
  static instances: FakeWorker[] = [];

  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessage: ((event: MessageEvent<WorkerToMain>) => void) | null = null;
  sent: MainToWorker[] = [];

  constructor() {
    FakeWorker.instances.push(this);
  }

  postMessage(message: MainToWorker): void {
    this.sent.push(message);
  }

  terminate(): void {}

  receive(message: WorkerToMain): void {
    this.onmessage?.({ data: message } as MessageEvent<WorkerToMain>);
  }
}

beforeEach(() => {
  FakeWorker.instances = [];
  vi.stubGlobal("Worker", FakeWorker);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WorkerBridge streaming lifecycle", () => {
  it("keeps inactive sessions connected without subscribing to business topics", () => {
    const bridge = new WorkerBridge(false);
    const worker = FakeWorker.instances[0];

    bridge.subscribe("/camera", () => undefined, { maxFrequency: 10 });
    worker.receive({ type: "state", state: "open" });
    expect(worker.sent).toEqual([]);

    bridge.setStreamingActive(true);
    expect(worker.sent).toEqual([
      { type: "subscribe", topic: "/camera", maxFrequency: 10 },
    ]);

    bridge.setStreamingActive(false);
    expect(worker.sent.at(-1)).toEqual({ type: "unsubscribe", topic: "/camera" });
    bridge.dispose();
  });

  it("recycles queued transferable frames when a session becomes inactive", () => {
    const bridge = new WorkerBridge(true);
    const worker = FakeWorker.instances[0];
    bridge.subscribe("/map", () => undefined);
    const buffer = new ArrayBuffer(16);
    worker.receive({
      type: "batch",
      items: [
        {
          topic: "/map",
          schemaName: "nav_msgs/msg/OccupancyGrid",
          payload: {
            kind: "grid",
            header: { stamp: { sec: 0, nanosec: 0 }, frame_id: "map" },
            info: {
              map_load_time: { sec: 0, nanosec: 0 },
              resolution: 1,
              width: 4,
              height: 4,
              origin: {
                position: { x: 0, y: 0, z: 0 },
                orientation: { x: 0, y: 0, z: 0, w: 1 },
              },
            },
            data: new Int8Array(buffer),
          },
        },
      ],
    });

    bridge.setStreamingActive(false);

    expect(worker.sent).toContainEqual({ type: "recycle", buffers: [buffer] });
    worker.receive({
      type: "batch",
      items: [
        {
          topic: "/map",
          schemaName: "nav_msgs/msg/OccupancyGrid",
          payload: {
            kind: "grid",
            header: { stamp: { sec: 0, nanosec: 0 }, frame_id: "map" },
            info: {
              map_load_time: { sec: 0, nanosec: 0 },
              resolution: 1,
              width: 4,
              height: 4,
              origin: {
                position: { x: 0, y: 0, z: 0 },
                orientation: { x: 0, y: 0, z: 0, w: 1 },
              },
            },
            data: new Int8Array(buffer),
          },
        },
      ],
    });
    expect(worker.sent.filter((message) => message.type === "recycle")).toHaveLength(2);
    expect(bridge.flushFrame()).toBe(false);
    bridge.dispose();
  });
});

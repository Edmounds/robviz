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

  it("gates writes immediately during connection changes and never replays disconnected writes", () => {
    const bridge = new WorkerBridge(true);
    const worker = FakeWorker.instances[0];
    bridge.connect("ws://first-host:8765");
    expect(bridge.state).toBe("connecting");
    worker.receive({ type: "state", state: "open" });
    bridge.publish("/cmd_vel", "geometry_msgs/msg/Twist", { linear: { x: 1 } });
    worker.receive({ type: "state", state: "closed" });

    expect(() => bridge.publish("/cmd_vel", "geometry_msgs/msg/Twist", {})).toThrow("connection is not open");
    bridge.connect("ws://second-host:8765");
    expect(bridge.state).toBe("connecting");
    expect(() => bridge.publish("/cmd_vel", "geometry_msgs/msg/Twist", {})).toThrow("connection is not open");
    worker.receive({ type: "state", state: "open" });

    const writes = worker.sent.filter((message) => message.type === "publish");
    expect(writes).toHaveLength(1);
    bridge.dispose();
  });

  it("synchronously rejects publish when connection is not open", () => {
    const bridge = new WorkerBridge(true);
    expect(() => {
      bridge.publish("/cmd_vel", "geometry_msgs/msg/Twist", {});
    }).toThrow("connection is not open");
    bridge.dispose();
  });

  it("rejects callService when connection is not open", async () => {
    const bridge = new WorkerBridge(true);
    await expect(bridge.callService("/reset", {})).rejects.toThrow("connection is not open");
    bridge.dispose();
  });

  it("settles in-flight service calls when connection closes or reconnects", async () => {
    const bridge = new WorkerBridge(true);
    const worker = FakeWorker.instances[0];

    worker.receive({ type: "state", state: "open" });
    const call1 = bridge.callService("/srv1", {});
    worker.receive({ type: "state", state: "closed" });
    await expect(call1).rejects.toThrow("connection closed");

    // Reconnecting to new URL creates a new generation
    bridge.connect("ws://new-host:8765");
    worker.receive({ type: "state", state: "open" });
    const call2 = bridge.callService("/srv2", {});
    bridge.connect("ws://another-host:8765");
    await expect(call2).rejects.toThrow("connection changed");

    bridge.dispose();
  });

  it("clears topics and services and notifies subscribers on disconnect", () => {
    const bridge = new WorkerBridge(true);
    const worker = FakeWorker.instances[0];
    const topicUpdates: unknown[] = [];
    const serviceUpdates: unknown[] = [];

    bridge.onTopicsChange = (list) => topicUpdates.push(list);
    bridge.onServicesChange = (list) => serviceUpdates.push(list);

    worker.receive({ type: "state", state: "open" });
    worker.receive({
      type: "channels",
      topics: [{ topic: "/odom", schemaName: "nav_msgs/msg/Odometry" }],
    });
    worker.receive({
      type: "services",
      services: [{ name: "/test", type: "std_srvs/srv/Trigger", requestSchema: "", responseSchema: "" }],
    });

    expect(bridge.topics.length).toBe(1);
    expect(bridge.services.length).toBe(1);

    worker.receive({ type: "state", state: "closed" });
    expect(bridge.topics).toEqual([]);
    expect(bridge.services).toEqual([]);
    expect(topicUpdates.at(-1)).toEqual([]);
    expect(serviceUpdates.at(-1)).toEqual([]);

    bridge.dispose();
  });
});

/**
 * 双向交互链路集成测试：客户端发布 cmd_vel 遥控机器人、
 * 服务调用往返、新增传感器话题（相机/关节/marker）解码。
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { WebSocket } from "ws";

import type { MockServerHandle } from "../../mock/server";
import { startMockServer } from "../../mock/server";
import { FoxgloveConnection } from "../../src/core/FoxgloveConnection";
import type { IWebSocket } from "@foxglove/ws-protocol";

const PORT = 18770;

function makeConn(): FoxgloveConnection {
  return new FoxgloveConnection(`ws://localhost:${PORT}`, {
    createWebSocket: (url, protocols) => new WebSocket(url, protocols) as unknown as IWebSocket,
    reconnectMs: 0,
  });
}

function waitFor<T>(
  subscribe: (cb: (v: T) => void) => () => void,
  predicate: (v: T) => boolean,
  timeoutMs = 15_000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsub();
      reject(new Error("timeout"));
    }, timeoutMs);
    const unsub = subscribe((v) => {
      if (predicate(v)) {
        clearTimeout(timer);
        unsub();
        resolve(v);
      }
    });
  });
}

let server: MockServerHandle;
let conn: FoxgloveConnection;

beforeAll(async () => {
  server = await startMockServer(PORT);
  conn = makeConn();
  // 等服务列表 advertise
  await new Promise<void>((resolve) => {
    const check = setInterval(() => {
      if (conn.services.length >= 2) {
        clearInterval(check);
        resolve();
      }
    }, 50);
  });
});

afterAll(async () => {
  conn.close();
  await server.close();
});

describe("双向交互", () => {
  it("服务列表 advertise（SetBool + Trigger）", () => {
    const names = conn.services.map((s) => s.name).sort();
    expect(names).toEqual(["/robot/enable_motor", "/robot/reset_pose"]);
  });

  it("发布 cmd_vel 后机器人进入手动模式（odom twist 跟随指令）", async () => {
    // 持续发 0.5s 的 cmd_vel
    const timer = setInterval(() => {
      conn.publish("/cmd_vel", "geometry_msgs/msg/Twist", {
        linear: { x: 0.42, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: -0.3 },
      });
    }, 100);
    try {
      const odom = await waitFor<{ twist: { twist: { linear: { x: number } } } }>(
        (cb) => conn.subscribe("/odom", (m) => cb(m as never)),
        (m) => Math.abs(m.twist.twist.linear.x - 0.42) < 1e-9,
      );
      expect(odom.twist.twist.linear.x).toBeCloseTo(0.42);
    } finally {
      clearInterval(timer);
    }
  });

  it("SetBool 服务调用往返 + Trigger 复位", async () => {
    const res = (await conn.callService("/robot/enable_motor", { data: false })) as {
      success: boolean;
      message: string;
    };
    expect(res.success).toBe(true);
    expect(res.message).toContain("disabled");

    const reset = (await conn.callService("/robot/reset_pose", {
      structure_needs_at_least_one_member: 0,
    })) as { success: boolean };
    expect(reset.success).toBe(true);
  });

  it("深度图 32FC1 解码且中心像素深度合理", async () => {
    const img = await waitFor<{ width: number; height: number; encoding: string; data: Uint8Array }>(
      (cb) => conn.subscribe("/camera/depth", (m) => cb(m as never)),
      () => true,
    );
    expect(img.encoding).toBe("32FC1");
    expect(img.width).toBe(320);
    // 中心像素深度：拷到对齐缓冲再读 float32
    const copy = new Uint8Array(img.data);
    const depth = new Float32Array(copy.buffer, 0, img.width * img.height);
    const center = depth[(img.height / 2) * img.width + img.width / 2];
    expect(center).toBeGreaterThan(0.3);
    expect(center).toBeLessThan(30);
  });

  it("彩色压缩图为合法 JPEG", async () => {
    const img = await waitFor<{ format: string; data: Uint8Array }>(
      (cb) => conn.subscribe("/camera/color/compressed", (m) => cb(m as never)),
      () => true,
    );
    expect(img.format).toBe("jpeg");
    expect(img.data[0]).toBe(0xff); // JPEG SOI
    expect(img.data[1]).toBe(0xd8);
  });

  it("joint_states 与 markers 解码", async () => {
    const js = await waitFor<{ name: string[]; position: Float64Array }>(
      (cb) => conn.subscribe("/joint_states", (m) => cb(m as never)),
      () => true,
    );
    expect(js.name).toContain("HP1");
    expect(js.position.length).toBe(js.name.length);

    const ma = await waitFor<{ markers: Array<{ type: number; ns: string }> }>(
      (cb) => conn.subscribe("/markers", (m) => cb(m as never)),
      () => true,
    );
    const types = ma.markers.map((m) => m.type).sort((a, b) => a - b);
    expect(types).toEqual([0, 1, 2, 4, 9]);
  });
});

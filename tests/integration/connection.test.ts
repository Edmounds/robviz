/**
 * 集成测试：模拟服务器 ↔ FoxgloveConnection 全链路
 * （ws 连接 → advertise → subscribe → CDR 编码 → 解码 → TF 查询与场景真值比对）
 */
import { WebSocket } from "ws";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startMockServer, type MockServerHandle } from "../../mock/server";
import * as scene from "../../mock/scene";
import { FoxgloveConnection } from "../../src/core/FoxgloveConnection";
import { TfBuffer } from "../../src/core/TfBuffer";
import { parsePointCloud2 } from "../../src/core/pointcloud";
import { toSec } from "../../src/core/types";
import type { LaserScan, OccupancyGrid, PointCloud2, TFMessage } from "../../src/core/types";
import type { IWebSocket } from "@foxglove/ws-protocol";

const PORT = 18765;
let server: MockServerHandle;
let conn: FoxgloveConnection;

function connect(url: string): FoxgloveConnection {
  return new FoxgloveConnection(url, {
    createWebSocket: (u, protocols) => new WebSocket(u, protocols) as unknown as IWebSocket,
    reconnectMs: 0,
  });
}

/** 订阅并取第一条消息 */
function firstMessage<T>(topic: string, timeoutMs = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timeout waiting for ${topic}`)),
      timeoutMs,
    );
    const unsub = conn.subscribe(topic, (msg) => {
      clearTimeout(timer);
      unsub();
      resolve(msg as T);
    });
  });
}

beforeAll(async () => {
  server = await startMockServer(PORT);
  conn = connect(`ws://localhost:${PORT}`);
});

afterAll(async () => {
  conn.close();
  await server.close();
});

describe("mock bridge ↔ core 全链路", () => {
  it("解码 /scan 并与场景真值一致", async () => {
    const scan = await firstMessage<LaserScan>("/scan");
    expect(scan.header.frame_id).toBe("laser");
    expect(scan.ranges.length).toBe(scene.SCAN_BEAMS);
    expect(scan.intensities.length).toBe(scene.SCAN_BEAMS);

    const t = toSec(scan.header.stamp);
    const truth = scene.scanAt(t);
    // 逐束比对（模拟器噪声是确定性的，应完全一致到 float32 精度）
    for (let i = 0; i < scene.SCAN_BEAMS; i += 30) {
      expect(scan.ranges[i]).toBeCloseTo(truth.ranges[i], 4);
    }
  });

  it("解码 /tf，TfBuffer 查询与运动学真值一致", async () => {
    const buf = new TfBuffer();
    let lastStamp = 0;
    // 收集若干帧，保证插值有数据
    await new Promise<void>((resolve) => {
      let count = 0;
      const unsub = conn.subscribe("/tf", (msg) => {
        for (const ts of (msg as TFMessage).transforms) {
          const time = toSec(ts.header.stamp);
          buf.setTransform(ts.header.frame_id, ts.child_frame_id, time, ts.transform);
          lastStamp = time;
        }
        if (++count >= 10) {
          unsub();
          resolve();
        }
      });
    });

    const tf = buf.lookup("map", "base_link", lastStamp);
    expect(tf).toBeDefined();
    const truth = scene.robotPoseAt(lastStamp);
    expect(tf!.translation.x).toBeCloseTo(truth.x, 3);
    expect(tf!.translation.y).toBeCloseTo(truth.y, 3);
    const yaw = 2 * Math.atan2(tf!.rotation.z, tf!.rotation.w);
    const dYaw = Math.atan2(Math.sin(yaw - truth.yaw), Math.cos(yaw - truth.yaw));
    expect(Math.abs(dYaw)).toBeLessThan(1e-3);

    // laser 挂在 base_link 上方 0.5m
    const laserTf = buf.lookup("map", "laser", lastStamp)!;
    expect(laserTf.translation.z).toBeCloseTo(0.5, 3);
  });

  it("解码 /map（OccupancyGrid）", async () => {
    const map = await firstMessage<OccupancyGrid>("/map", 15000);
    expect(map.info.width).toBe(scene.MAP_SIZE);
    expect(map.info.height).toBe(scene.MAP_SIZE);
    expect(map.data.length).toBe(scene.MAP_SIZE * scene.MAP_SIZE);
    expect(map.info.origin.position.x).toBeCloseTo(-scene.ROOM_HALF);
    // 墙壁存在：至少有占用栅格
    let occupied = 0;
    for (let i = 0; i < map.data.length; i++) if (map.data[i] === 100) occupied++;
    expect(occupied).toBeGreaterThan(100);
  });

  it("解码 /cloud 并解析 PointCloud2 字段", async () => {
    const cloud = await firstMessage<PointCloud2>("/cloud");
    expect(cloud.width).toBe(scene.CLOUD_RINGS * scene.CLOUD_AZIMUTHS);
    expect(cloud.point_step).toBe(20);

    const parsed = parsePointCloud2(cloud);
    expect(parsed.count).toBe(cloud.width);
    expect(parsed.colorField).toBe("intensity");
    // 与真值首点比对
    const truth = scene.cloudAt(toSec(cloud.header.stamp));
    expect(parsed.positions[0]).toBeCloseTo(truth.buffer[0], 4);
    expect(parsed.positions[1]).toBeCloseTo(truth.buffer[1], 4);
    expect(parsed.positions[2]).toBeCloseTo(truth.buffer[2], 4);
    expect(parsed.colorValues![0]).toBeCloseTo(truth.buffer[3], 4);
    // 所有点应在房间范围内（laser 系原点范围 ±2*ROOM_HALF）
    for (let i = 0; i < parsed.count * 3; i += 3000) {
      expect(Math.abs(parsed.positions[i])).toBeLessThan(scene.SCAN_MAX_RANGE + 1);
    }
  });

  it("topic 列表包含全部模拟话题", async () => {
    const topics = conn.topics.map((t) => t.topic).sort();
    for (const expected of ["/tf", "/scan", "/map", "/cloud", "/path", "/odom"]) {
      expect(topics).toContain(expected);
    }
  });
});

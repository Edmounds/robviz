import { describe, expect, it } from "vitest";

import { LATEST, TfBuffer } from "../../src/core/TfBuffer";

function yawQuat(yaw: number) {
  return { x: 0, y: 0, z: Math.sin(yaw / 2), w: Math.cos(yaw / 2) };
}

const IDENTITY_Q = { x: 0, y: 0, z: 0, w: 1 };

describe("TfBuffer", () => {
  it("单边平移插值", () => {
    const buf = new TfBuffer();
    buf.setTransform("map", "base", 1, {
      translation: { x: 0, y: 0, z: 0 },
      rotation: IDENTITY_Q,
    });
    buf.setTransform("map", "base", 2, {
      translation: { x: 2, y: 4, z: 0 },
      rotation: IDENTITY_Q,
    });
    const tf = buf.lookup("map", "base", 1.5);
    expect(tf).toBeDefined();
    expect(tf!.translation.x).toBeCloseTo(1);
    expect(tf!.translation.y).toBeCloseTo(2);
  });

  it("旋转 slerp 插值", () => {
    const buf = new TfBuffer();
    buf.setTransform("map", "base", 0, {
      translation: { x: 0, y: 0, z: 0 },
      rotation: yawQuat(0),
    });
    buf.setTransform("map", "base", 1, {
      translation: { x: 0, y: 0, z: 0 },
      rotation: yawQuat(Math.PI / 2),
    });
    const tf = buf.lookup("map", "base", 0.5)!;
    const yaw = 2 * Math.atan2(tf.rotation.z, tf.rotation.w);
    expect(yaw).toBeCloseTo(Math.PI / 4);
  });

  it("跨多段链路：map→laser 经 odom、base", () => {
    const buf = new TfBuffer();
    // map→odom：平移 (1, 0)
    buf.setTransform("map", "odom", 1, {
      translation: { x: 1, y: 0, z: 0 },
      rotation: IDENTITY_Q,
    });
    // odom→base：旋转 90°，平移 (2, 0)
    buf.setTransform("odom", "base", 1, {
      translation: { x: 2, y: 0, z: 0 },
      rotation: yawQuat(Math.PI / 2),
    });
    // base→laser：前向 0.5
    buf.setTransform("base", "laser", 1, {
      translation: { x: 0.5, y: 0, z: 0 },
      rotation: IDENTITY_Q,
    });
    const tf = buf.lookup("map", "laser", 1)!;
    // laser 原点在 map 系：(1,0) + (2,0) + rot90*(0.5,0) = (3, 0.5)
    expect(tf.translation.x).toBeCloseTo(3);
    expect(tf.translation.y).toBeCloseTo(0.5);
    const yaw = 2 * Math.atan2(tf.rotation.z, tf.rotation.w);
    expect(yaw).toBeCloseTo(Math.PI / 2);
  });

  it("反向查询是正向的逆", () => {
    const buf = new TfBuffer();
    const yaw = Math.PI / 3;
    buf.setTransform("map", "base", 1, {
      translation: { x: 3, y: 4, z: 0 },
      rotation: yawQuat(yaw),
    });
    const inv = buf.lookup("base", "map", 1)!;
    // T⁻¹ = (-R⁻¹ t, R⁻¹)：R(-yaw) 旋转 (3,4) 后取负
    const c = Math.cos(-yaw);
    const s = Math.sin(-yaw);
    expect(inv.translation.x).toBeCloseTo(-(c * 3 - s * 4));
    expect(inv.translation.y).toBeCloseTo(-(s * 3 + c * 4));
    const invYaw = 2 * Math.atan2(inv.rotation.z, inv.rotation.w);
    expect(invYaw).toBeCloseTo(-yaw);
  });

  it("兄弟 frame 查询（公共祖先）", () => {
    const buf = new TfBuffer();
    buf.setTransform("map", "a", 1, {
      translation: { x: 1, y: 0, z: 0 },
      rotation: IDENTITY_Q,
    });
    buf.setTransform("map", "b", 1, {
      translation: { x: 0, y: 1, z: 0 },
      rotation: IDENTITY_Q,
    });
    const tf = buf.lookup("a", "b", 1)!;
    expect(tf.translation.x).toBeCloseTo(-1);
    expect(tf.translation.y).toBeCloseTo(1);
  });

  it("链路断开返回 undefined", () => {
    const buf = new TfBuffer();
    buf.setTransform("map", "a", 1, {
      translation: { x: 0, y: 0, z: 0 },
      rotation: IDENTITY_Q,
    });
    expect(buf.lookup("map", "orphan", 1)).toBeUndefined();
  });

  it("LATEST 取各边最新值", () => {
    const buf = new TfBuffer();
    buf.setTransform("map", "base", 1, {
      translation: { x: 1, y: 0, z: 0 },
      rotation: IDENTITY_Q,
    });
    buf.setTransform("map", "base", 2, {
      translation: { x: 9, y: 0, z: 0 },
      rotation: IDENTITY_Q,
    });
    expect(buf.lookup("map", "base", LATEST)!.translation.x).toBeCloseTo(9);
  });

  it("时间窗裁剪旧样本", () => {
    const buf = new TfBuffer(5);
    for (let t = 0; t <= 20; t++) {
      buf.setTransform("map", "base", t, {
        translation: { x: t, y: 0, z: 0 },
        rotation: IDENTITY_Q,
      });
    }
    // 早于窗口的查询被钳制到窗口内最旧样本（x = 15 附近）
    const tf = buf.lookup("map", "base", 0)!;
    // time=0 是 LATEST 语义，改用 0.001
    const old = buf.lookup("map", "base", 0.001)!;
    expect(old.translation.x).toBeGreaterThanOrEqual(15);
    expect(tf.translation.x).toBeCloseTo(20);
  });

  it("frames 与 tree", () => {
    const buf = new TfBuffer();
    buf.setTransform("map", "odom", 1, {
      translation: { x: 0, y: 0, z: 0 },
      rotation: IDENTITY_Q,
    });
    buf.setTransform("odom", "base", 1, {
      translation: { x: 0, y: 0, z: 0 },
      rotation: IDENTITY_Q,
    });
    expect(buf.frames()).toEqual(["base", "map", "odom"]);
    expect(buf.tree().get("base")).toBe("odom");
  });
});

import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";

import { TfBuffer } from "../../src/core/TfBuffer";
import {
  computeFitCameraDistance,
  computeTfBounds,
  stopHandledPointerDown,
} from "../../src/renderers/SceneManager";
import { computeTfLabelHeight } from "../../src/renderers/TfAxesRenderer";
import { computeMarkerTextScale } from "../../src/renderers/MarkerRenderer";

describe("SceneManager pointer input", () => {
  it("不把已由面板分隔条处理的 pointerdown 传给轨道相机", () => {
    const stopImmediatePropagation = vi.fn();

    stopHandledPointerDown({ defaultPrevented: true, stopImmediatePropagation });

    expect(stopImmediatePropagation).toHaveBeenCalledOnce();
  });

  it("视口内未处理的 pointerdown 仍交给轨道相机", () => {
    const stopImmediatePropagation = vi.fn();

    stopHandledPointerDown({ defaultPrevented: false, stopImmediatePropagation });

    expect(stopImmediatePropagation).not.toHaveBeenCalled();
  });
});

describe("Marker & TF 文本几何缩放", () => {
  it("Marker 文字保持纵横比且多次缩放不累乘", () => {
    const rawHeight = 0.4;
    const aspect = 2.5; // width = 1.0, height = 0.4

    const scale100 = computeMarkerTextScale(rawHeight, aspect, 1.0);
    expect(scale100[0]).toBeCloseTo(1.0, 6);
    expect(scale100[1]).toBeCloseTo(0.4, 6);
    expect(scale100[2]).toBe(1);

    const scale150 = computeMarkerTextScale(rawHeight, aspect, 1.5);
    expect(scale150[0]).toBeCloseTo(1.5, 6);
    expect(scale150[1]).toBeCloseTo(0.6, 6);
    expect(scale150[2]).toBe(1);
    expect(scale150[0] / scale150[1]).toBeCloseTo(aspect, 6);

    const scale75 = computeMarkerTextScale(rawHeight, aspect, 0.75);
    expect(scale75[0]).toBeCloseTo(0.75, 6);
    expect(scale75[1]).toBeCloseTo(0.3, 6);
    expect(scale75[2]).toBe(1);
    expect(scale75[0] / scale75[1]).toBeCloseTo(aspect, 6);
  });

  it("TF 标签高度随视口高度反比缩放以保持屏幕绝对像素稳定", () => {
    const fov = 60;
    const h600 = computeTfLabelHeight(1.0, 600, fov);
    const h1200 = computeTfLabelHeight(1.0, 1200, fov);

    expect(h600).toBeCloseTo(h1200 * 2, 6);

    const h600Scaled = computeTfLabelHeight(1.5, 600, fov);
    expect(h600Scaled).toBeCloseTo(h600 * 1.5, 6);

    // 非法或零高度视口安全回退
    expect(computeTfLabelHeight(1.0, 0, fov)).toBe(0.02);
  });
});

describe("TF 视野包围盒与相机视距计算", () => {
  it("无 TF 数据或仅有 fixedFrame 时返回 null", () => {
    const tf = new TfBuffer();
    expect(computeTfBounds(tf, "map", 0)).toBeNull();
  });

  it("断链或包含非有限坐标的 TF 被安全忽略", () => {
    const tf = new TfBuffer();
    // 断链：base_link 的父是 odom，但 fixedFrame 是 map，没有 map->odom
    tf.setTransform("odom", "base_link", 1, {
      translation: { x: 1, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    });
    expect(computeTfBounds(tf, "map", 1)).toBeNull();

    // 含有 NaN / Infinity 的变换
    tf.setTransform("map", "corrupt", 1, {
      translation: { x: Number.NaN, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    });
    expect(computeTfBounds(tf, "map", 1)).toBeNull();
  });

  it("有效 TF 准确计入坐标轴端点（0.45m）与原点", () => {
    const tf = new TfBuffer();
    tf.setTransform("map", "base_link", 1, {
      translation: { x: 2, y: 3, z: 1 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    });

    const bounds = computeTfBounds(tf, "map", 1, 0.45);
    expect(bounds).not.toBeNull();
    // 包含 map 原点 (0,0,0) 及其轴端点，以及 base_link (2,3,1) 及其轴端点
    expect(bounds!.min.x).toBeCloseTo(0, 4);
    expect(bounds!.min.y).toBeCloseTo(0, 4);
    expect(bounds!.min.z).toBeCloseTo(0, 4);
    expect(bounds!.max.x).toBeCloseTo(2 + 0.45, 4);
    expect(bounds!.max.y).toBeCloseTo(3 + 0.45, 4);
    expect(bounds!.max.z).toBeCloseTo(1 + 0.45, 4);
  });

  it("支持旋转姿态下的轴端点包围盒", () => {
    const tf = new TfBuffer();
    // 绕 Z 轴旋转 90 度
    const halfSqrt2 = Math.SQRT1_2;
    tf.setTransform("map", "rotated", 1, {
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: halfSqrt2, w: halfSqrt2 },
    });

    const bounds = computeTfBounds(tf, "map", 1, 0.45);
    expect(bounds).not.toBeNull();
    // 局部 X 轴旋转后指向全局 +Y
    expect(bounds!.max.y).toBeCloseTo(0.45, 3);
  });

  it("视距计算在宽屏与窄竖屏下均容纳全部包围盒并保留余量", () => {
    const box = new THREE.Box3(
      new THREE.Vector3(-1, -1, -0.5),
      new THREE.Vector3(1, 1, 0.5),
    );

    // 宽屏 (aspect 16:9 ~ 1.78)
    const wide = computeFitCameraDistance(box, 60, 16 / 9, 1.2);
    expect(wide.center).toEqual(new THREE.Vector3(0, 0, 0));
    expect(wide.dist).toBeGreaterThan(1.0);

    // 窄屏 (aspect 9:16 ~ 0.56) 需要更远视距才能容纳水平宽度
    const narrow = computeFitCameraDistance(box, 60, 9 / 16, 1.2);
    expect(narrow.dist).toBeGreaterThan(wide.dist);

    // 视角跟踪中心模式：固定中心时以中心到顶点的最远距离计算
    const followCenter = new THREE.Vector3(2, 2, 0);
    const followFit = computeFitCameraDistance(box, 60, 1.0, 1.2, followCenter);
    expect(followFit.center).toEqual(followCenter);
    expect(followFit.dist).toBeGreaterThan(wide.dist);

    // 远离原点的非零跟踪中心 (例如静态平移 (10, 0, 0)) 视距依然容纳目标包围盒
    const distantCenter = new THREE.Vector3(10, 0, 0);
    const distantFit = computeFitCameraDistance(box, 60, 16 / 9, 1.2, distantCenter);
    expect(distantFit.center).toEqual(distantCenter);
    expect(distantFit.dist).toBeGreaterThan(11);
  });
});

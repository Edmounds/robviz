import * as THREE from "three";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";

import { TfBuffer } from "../core/TfBuffer";
import type { TimeSec } from "../core/types";
import { getSceneTheme, onSceneTheme } from "./sceneTheme";

const AXIS_LEN = 0.45;
const DEFAULT_AXIS_WIDTH_PX = 1.5;
const LABEL_HEIGHT = 0.02;
// RGB = XYZ 行业惯例（数据色，不受 UI 单色约束）
const AXIS_COLORS = [0xe0524f, 0x4fe052, 0x527ae0];

function labelTexture(text: string): THREE.Texture {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const font = "22px ui-monospace, Menlo, monospace";
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 12;
  canvas.width = w;
  canvas.height = 32;
  ctx.font = font;
  const dark = getSceneTheme() === "dark";
  ctx.lineJoin = "round";
  ctx.lineWidth = 3;
  ctx.strokeStyle = dark ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.9)";
  ctx.fillStyle = dark ? "rgba(245, 245, 245, 0.9)" : "rgba(10, 10, 10, 0.9)";
  ctx.textBaseline = "middle";
  ctx.strokeText(text, 6, 16);
  ctx.fillText(text, 6, 16);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildAxes(lineWidth: number): LineSegments2 {
  const positions = [
    0, 0, 0, AXIS_LEN, 0, 0,
    0, 0, 0, 0, AXIS_LEN, 0,
    0, 0, 0, 0, 0, AXIS_LEN,
  ];
  const colors = new Array<number>(18);
  for (let axis = 0; axis < 3; axis++) {
    const c = new THREE.Color(AXIS_COLORS[axis]);
    for (const vertex of [0, 1]) {
      const o = (axis * 2 + vertex) * 3;
      colors[o] = c.r;
      colors[o + 1] = c.g;
      colors[o + 2] = c.b;
    }
  }
  const geo = new LineSegmentsGeometry();
  geo.setPositions(positions);
  geo.setColors(colors);
  return new LineSegments2(
    geo,
    new LineMaterial({ vertexColors: true, linewidth: lineWidth, depthWrite: false }),
  );
}

function disposeGroup(group: THREE.Group): void {
  group.traverse((object) => {
    if (object instanceof LineSegments2) {
      object.geometry.dispose();
      object.material.dispose();
    } else if (object instanceof THREE.Sprite) {
      object.material.map?.dispose();
      object.material.dispose();
    }
  });
}

/** 每个已知 TF frame 一组坐标轴 + 名称标签，由 SceneManager 每帧驱动 */
export class TfAxesRenderer {
  readonly root = new THREE.Group();
  #groups = new Map<string, THREE.Group>();
  #offSceneTheme: () => void;
  #lineWidth = DEFAULT_AXIS_WIDTH_PX;

  constructor() {
    // 主题变化时清空重建，标签取到新主题的纹理
    this.#offSceneTheme = onSceneTheme(() => this.#clearGroups());
  }

  dispose(): void {
    this.#offSceneTheme();
    this.#clearGroups();
  }

  setLineWidth(lineWidth: number): void {
    this.#lineWidth = lineWidth;
    for (const group of this.#groups.values()) {
      group.traverse((object) => {
        if (object instanceof LineSegments2) object.material.linewidth = lineWidth;
      });
    }
  }

  tick(tf: TfBuffer, fixedFrame: string, broken: Set<string>, time: TimeSec): void {
    const frames = tf.frames();

    for (const frame of frames) {
      let group = this.#groups.get(frame);
      if (!group) {
        group = new THREE.Group();
        group.add(buildAxes(this.#lineWidth));
        const tex = labelTexture(frame);
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: tex,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            sizeAttenuation: false,
          }),
        );
        const img = tex.image as HTMLCanvasElement;
        sprite.scale.set((img.width / img.height) * LABEL_HEIGHT, LABEL_HEIGHT, 1);
        sprite.position.set(0.06, 0.06, 0.1);
        group.add(sprite);
        this.#groups.set(frame, group);
        this.root.add(group);
      }

      if (frame === fixedFrame) {
        group.visible = true;
        group.position.set(0, 0, 0);
        group.quaternion.identity();
        continue;
      }
      const t = tf.lookup(fixedFrame, frame, time);
      if (!t) {
        group.visible = false;
        broken.add(frame);
        continue;
      }
      group.visible = true;
      group.position.set(t.translation.x, t.translation.y, t.translation.z);
      group.quaternion.set(t.rotation.x, t.rotation.y, t.rotation.z, t.rotation.w);
    }

    // 消失的 frame 清理
    for (const [frame, group] of this.#groups) {
      if (!frames.includes(frame)) {
        this.root.remove(group);
        disposeGroup(group);
        this.#groups.delete(frame);
      }
    }
  }

  #clearGroups(): void {
    for (const group of this.#groups.values()) {
      this.root.remove(group);
      disposeGroup(group);
    }
    this.#groups.clear();
  }
}

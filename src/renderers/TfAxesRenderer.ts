import * as THREE from "three";

import { TfBuffer } from "../core/TfBuffer";
import type { TimeSec } from "../core/types";
import { getSceneTheme, onSceneTheme } from "./sceneTheme";

const AXIS_LEN = 0.35;
// RGB = XYZ 行业惯例（数据色，不受 UI 单色约束）
const AXIS_COLORS = [0xe0524f, 0x4fe052, 0x527ae0];

const labelCache = new Map<string, THREE.Texture>();

function labelTexture(text: string): THREE.Texture {
  const key = `${getSceneTheme()}:${text}`;
  let tex = labelCache.get(key);
  if (tex) return tex;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const font = "22px ui-monospace, Menlo, monospace";
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 8;
  canvas.width = w;
  canvas.height = 28;
  ctx.font = font;
  ctx.fillStyle = getSceneTheme() === "dark" ? "rgba(245, 245, 245, 0.68)" : "rgba(10, 10, 10, 0.68)";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 4, 14);
  tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  labelCache.set(key, tex);
  return tex;
}

function buildAxes(): THREE.LineSegments {
  const positions = new Float32Array([
    0, 0, 0, AXIS_LEN, 0, 0,
    0, 0, 0, 0, AXIS_LEN, 0,
    0, 0, 0, 0, 0, AXIS_LEN,
  ]);
  const colors = new Float32Array(18);
  for (let axis = 0; axis < 3; axis++) {
    const c = new THREE.Color(AXIS_COLORS[axis]);
    for (const vertex of [0, 1]) {
      const o = (axis * 2 + vertex) * 3;
      colors[o] = c.r;
      colors[o + 1] = c.g;
      colors[o + 2] = c.b;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return new THREE.LineSegments(
    geo,
    new THREE.LineBasicMaterial({ vertexColors: true }),
  );
}

/** 每个已知 TF frame 一组坐标轴 + 名称标签，由 SceneManager 每帧驱动 */
export class TfAxesRenderer {
  readonly root = new THREE.Group();
  #groups = new Map<string, THREE.Group>();
  #offSceneTheme: () => void;

  constructor() {
    // 主题变化时清空重建，标签取到新主题的纹理
    this.#offSceneTheme = onSceneTheme(() => {
      for (const group of this.#groups.values()) this.root.remove(group);
      this.#groups.clear();
    });
  }

  dispose(): void {
    this.#offSceneTheme();
  }

  tick(tf: TfBuffer, fixedFrame: string, broken: Set<string>, time: TimeSec): void {
    const frames = tf.frames();

    for (const frame of frames) {
      let group = this.#groups.get(frame);
      if (!group) {
        group = new THREE.Group();
        group.add(buildAxes());
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: labelTexture(frame),
            transparent: true,
            depthTest: false,
          }),
        );
        const tex = labelTexture(frame);
        const img = tex.image as HTMLCanvasElement;
        sprite.scale.set((img.width / img.height) * 0.12, 0.12, 1);
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
        this.#groups.delete(frame);
      }
    }
  }
}

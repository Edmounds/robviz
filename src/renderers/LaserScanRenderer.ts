import * as THREE from "three";

import type { LaserScan } from "../core/types";
import type { MessagePayload } from "../worker/protocol";
import { turbo } from "./colormap";
import type { Display } from "./SceneManager";

const INITIAL_CAPACITY = 2048;

/** sensor_msgs/LaserScan：极坐标转点，按强度（无强度则按距离）turbo 着色 */
export class LaserScanRenderer implements Display {
  readonly root = new THREE.Group();
  frameId: string | undefined;

  #points: THREE.Points;
  #geometry = new THREE.BufferGeometry();
  #capacity = INITIAL_CAPACITY;
  #angleCache: { key: string; cos: Float32Array; sin: Float32Array } | undefined;

  constructor() {
    this.#allocate(INITIAL_CAPACITY);
    this.#points = new THREE.Points(
      this.#geometry,
      new THREE.PointsMaterial({ size: 0.06, vertexColors: true, sizeAttenuation: true }),
    );
    this.#points.frustumCulled = false;
    this.root.add(this.#points);
  }

  #allocate(capacity: number): void {
    this.#capacity = capacity;
    this.#geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(capacity * 3), 3),
    );
    this.#geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array(capacity * 3), 3),
    );
  }

  update(payload: MessagePayload): void {
    if (payload.kind !== "raw") return;
    const scan = payload.message as LaserScan;
    this.frameId = scan.header.frame_id;

    const n = scan.ranges.length;
    if (n > this.#capacity) this.#allocate(Math.max(n, this.#capacity * 2));

    // 角度表缓存（参数不变时复用）
    const key = `${scan.angle_min}:${scan.angle_increment}:${n}`;
    if (this.#angleCache?.key !== key) {
      const cos = new Float32Array(n);
      const sin = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const a = scan.angle_min + i * scan.angle_increment;
        cos[i] = Math.cos(a);
        sin[i] = Math.sin(a);
      }
      this.#angleCache = { key, cos, sin };
    }
    const { cos, sin } = this.#angleCache;

    const hasIntensity = scan.intensities.length === n;
    let vMin = Infinity;
    let vMax = -Infinity;
    if (hasIntensity) {
      for (let i = 0; i < n; i++) {
        const v = scan.intensities[i];
        if (Number.isFinite(v)) {
          if (v < vMin) vMin = v;
          if (v > vMax) vMax = v;
        }
      }
    }
    if (!hasIntensity || vMin >= vMax) {
      vMin = scan.range_min;
      vMax = scan.range_max;
    }
    const invSpan = 1 / (vMax - vMin);

    const positions = this.#geometry.getAttribute("position") as THREE.BufferAttribute;
    const colors = this.#geometry.getAttribute("color") as THREE.BufferAttribute;
    const pArr = positions.array as Float32Array;
    const cArr = colors.array as Float32Array;

    let count = 0;
    for (let i = 0; i < n; i++) {
      const r = scan.ranges[i];
      if (!Number.isFinite(r) || r < scan.range_min || r > scan.range_max) continue;
      const o = count * 3;
      pArr[o] = r * cos[i];
      pArr[o + 1] = r * sin[i];
      pArr[o + 2] = 0;
      const value = hasIntensity ? scan.intensities[i] : r;
      const [cr, cg, cb] = turbo((value - vMin) * invSpan);
      cArr[o] = cr;
      cArr[o + 1] = cg;
      cArr[o + 2] = cb;
      count++;
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    this.#geometry.setDrawRange(0, count);
  }

  dispose(): void {
    this.#geometry.dispose();
    (this.#points.material as THREE.Material).dispose();
  }
}

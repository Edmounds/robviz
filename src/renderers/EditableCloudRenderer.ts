import * as THREE from "three";

import type { EditableCloud, NdcRect, RemovedPoints } from "../core/cloudEdit";
import { appendPoints, applyMask, selectInRect } from "../core/cloudEdit";
import { serializePcdBinary } from "../core/pcd";
import type { MessagePayload } from "../worker/protocol";
import { POINTS_FRAGMENT, POINTS_VERTEX } from "./pointsShader";
import type { Display } from "./SceneManager";
import { onSceneTheme, sceneColors } from "./sceneTheme";

const MAX_UNDO = 20;
const FADE_MS = 350;

/**
 * 从 PCD 文件加载的静态点云 + CloudCompare-lite 清理：
 * 屏幕矩形框选 → 删除/仅保留 → 撤销 → 导出 PCD。
 * 编辑动态物体拖影的典型操作是几次框删 + 导出。
 */
export class EditableCloudRenderer implements Display {
  readonly root = new THREE.Group();
  frameId: string | undefined;

  #cloud: EditableCloud;
  #undoStack: RemovedPoints[] = [];
  #geometry = new THREE.BufferGeometry();
  #material: THREE.ShaderMaterial;
  #points: THREE.Points;
  #offSceneTheme: () => void;
  #fadeRaf = 0;

  /**
   * @param onAnimate 淡入动画每帧回调（App 挂 scene.invalidate 驱动按需渲染）
   */
  constructor(cloud: EditableCloud, frameId: string, onAnimate?: () => void) {
    this.#cloud = cloud;
    this.frameId = frameId;

    let min = 0;
    let max = 1;
    if (cloud.intensity) {
      min = Infinity;
      max = -Infinity;
      for (let i = 0; i < cloud.count; i++) {
        const v = cloud.intensity[i];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (!(min < max)) {
        min = 0;
        max = 1;
      }
    }
    this.#material = new THREE.ShaderMaterial({
      vertexShader: POINTS_VERTEX,
      fragmentShader: POINTS_FRAGMENT,
      uniforms: {
        uMin: { value: min },
        uMax: { value: max },
        uZMin: { value: 0 },
        uZMax: { value: 1 },
        uSize: { value: 1.6 },
        uFixedSize: { value: 0 },
        uColorMode: { value: cloud.intensity ? 1 : 0 },
        uHasValue: { value: cloud.intensity ? 1 : 0 },
        uOpacity: { value: 1 },
        uFlatColor: { value: new THREE.Color(sceneColors().flatPoint) },
      },
    });
    this.#offSceneTheme = onSceneTheme(() => {
      (this.#material.uniforms.uFlatColor.value as THREE.Color).setHex(sceneColors().flatPoint);
    });
    this.#points = new THREE.Points(this.#geometry, this.#material);
    this.#points.frustumCulled = false;
    this.root.add(this.#points);
    this.#upload();
    this.#fadeIn(onAnimate);
  }

  /** 加载淡入（prefers-reduced-motion 下跳过） */
  #fadeIn(onAnimate?: () => void): void {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    this.#material.transparent = true;
    this.#material.uniforms.uOpacity.value = 0;
    const start = performance.now();
    const step = () => {
      const t = Math.min(1, (performance.now() - start) / FADE_MS);
      this.#material.uniforms.uOpacity.value = t;
      onAnimate?.();
      if (t < 1) {
        this.#fadeRaf = requestAnimationFrame(step);
      } else {
        this.#material.transparent = false;
        this.#material.needsUpdate = true;
        this.#fadeRaf = 0;
      }
    };
    this.#fadeRaf = requestAnimationFrame(step);
  }

  /** 点云包围盒（相机自动飞到合适视距用） */
  get bounds(): THREE.Box3 {
    this.#geometry.computeBoundingBox();
    return this.#geometry.boundingBox ?? new THREE.Box3();
  }

  get count(): number {
    return this.#cloud.count;
  }

  get undoDepth(): number {
    return this.#undoStack.length;
  }

  /** Display 接口：静态云不接收话题消息 */
  update(_payload: MessagePayload): void {}

  #upload(): void {
    const { count, positions, intensity } = this.#cloud;
    this.#geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions.subarray(0, count * 3), 3),
    );
    this.#geometry.setAttribute(
      "value",
      new THREE.BufferAttribute(
        intensity ? intensity.subarray(0, count) : new Float32Array(count),
        1,
      ),
    );
    this.#geometry.setDrawRange(0, count);
  }

  /**
   * 屏幕矩形编辑。rect 为 NDC 坐标。
   * removeSelected = true 删除框内点；false 仅保留框内点（裁剪）。
   * 返回受影响点数。
   */
  applyRect(camera: THREE.Camera, rect: NdcRect, removeSelected: boolean): number {
    camera.updateMatrixWorld();
    this.root.updateMatrixWorld();
    const view = new THREE.Matrix4().copy(camera.matrixWorld).invert();
    const mvp = new THREE.Matrix4()
      .multiplyMatrices(camera.projectionMatrix, view)
      .multiply(this.root.matrixWorld);

    const mask = selectInRect(this.#cloud, mvp.elements, rect);
    const { kept, removed } = applyMask(this.#cloud, mask, removeSelected);
    if (removed.count === 0) return 0;

    this.#cloud = kept;
    this.#undoStack.push(removed);
    if (this.#undoStack.length > MAX_UNDO) this.#undoStack.shift();
    this.#upload();
    return removed.count;
  }

  undo(): boolean {
    const removed = this.#undoStack.pop();
    if (!removed) return false;
    this.#cloud = appendPoints(this.#cloud, removed);
    this.#upload();
    return true;
  }

  exportPcd(): ArrayBuffer {
    return serializePcdBinary(this.#cloud);
  }

  dispose(): void {
    if (this.#fadeRaf) cancelAnimationFrame(this.#fadeRaf);
    this.#offSceneTheme();
    this.#geometry.dispose();
    this.#material.dispose();
  }
}

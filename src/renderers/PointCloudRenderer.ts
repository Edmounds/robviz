import * as THREE from "three";

import type { MessagePayload } from "../worker/protocol";
import type { PointCloudSettings } from "../core/layoutConfig";
import { DEFAULT_POINT_CLOUD_SETTINGS } from "../core/layoutConfig";
import { POINTS_FRAGMENT, POINTS_VERTEX } from "./pointsShader";
import type { Display } from "./SceneManager";
import { onSceneTheme, sceneColors } from "./sceneTheme";

const INITIAL_CAPACITY = 1 << 18; // 262k 点起步，不够翻倍
const ACCUMULATE_CAPACITY = 1 << 21; // 累积模式 2M 点环形写入

/**
 * sensor_msgs/PointCloud2。Worker 已解析为 positions/colorValues，
 * 这里只做 GPU 缓冲写入。着色（turbo）在着色器内完成。
 *
 * accumulate = true 时环形累积（Point-LIO 建图浏览）。
 * 注意：累积的点保存在消息 frame 下，只有当消息本身已注册到世界系
 * （如 Point-LIO 的 /cloud_registered）时累积才有意义；传感器系的
 * 原始点云累积会随机器人运动被整体拖走。
 */
export class PointCloudRenderer implements Display {
  readonly root = new THREE.Group();
  frameId: string | undefined;

  accumulate: boolean;

  #points: THREE.Points;
  #geometry = new THREE.BufferGeometry();
  #material: THREE.ShaderMaterial;
  #capacity: number;
  #writeOffset = 0;
  #total = 0;
  #offSceneTheme: () => void;
  #settings: PointCloudSettings = { ...DEFAULT_POINT_CLOUD_SETTINGS };
  #autoFieldRange: [number, number] = [0, 1];
  #autoZRange: [number, number] = [0, 1];
  #colorField?: string;

  constructor(accumulate = false) {
    this.accumulate = accumulate;
    this.#capacity = accumulate ? ACCUMULATE_CAPACITY : INITIAL_CAPACITY;
    this.#allocate(this.#capacity);
    this.#material = new THREE.ShaderMaterial({
      vertexShader: POINTS_VERTEX,
      fragmentShader: POINTS_FRAGMENT,
      uniforms: {
        uMin: { value: 0 },
        uMax: { value: 1 },
        uZMin: { value: 0 },
        uZMax: { value: 1 },
        uSize: { value: 2 },
        uFixedSize: { value: 1 },
        uColorMode: { value: 1 },
        uHasValue: { value: 0 },
        uOpacity: { value: 1 },
        uFlatColor: { value: new THREE.Color(sceneColors().flatPoint) },
      },
    });
    this.#offSceneTheme = onSceneTheme(() => {
      (this.#material.uniforms.uFlatColor.value as THREE.Color).set(this.#settings.flatColor);
    });
    this.#points = new THREE.Points(this.#geometry, this.#material);
    this.#points.frustumCulled = false;
    this.root.add(this.#points);
  }

  get settings(): PointCloudSettings {
    return { ...this.#settings };
  }

  get colorField(): string | undefined {
    return this.#colorField;
  }

  get autoRange(): [number, number] {
    return this.#settings.colorMode === "height" ? [...this.#autoZRange] : [...this.#autoFieldRange];
  }

  applySettings(settings: PointCloudSettings): void {
    const accumulationChanged = this.accumulate !== settings.accumulate;
    if (settings.accumulate && this.#capacity < ACCUMULATE_CAPACITY) {
      this.#allocate(ACCUMULATE_CAPACITY);
    } else if (accumulationChanged) {
      this.clear();
    }
    this.#settings = { ...settings };
    this.accumulate = settings.accumulate;
    const uniforms = this.#material.uniforms;
    uniforms.uSize.value = settings.pointSize;
    uniforms.uOpacity.value = settings.opacity;
    uniforms.uColorMode.value = settings.colorMode === "flat" ? 0 : settings.colorMode === "field" ? 1 : 2;
    (uniforms.uFlatColor.value as THREE.Color).set(settings.flatColor);
    this.#material.transparent = settings.opacity < 1;
    this.#material.depthWrite = settings.opacity >= 1;
    this.#material.needsUpdate = true;
    this.#applyRange();
  }

  #applyRange(): void {
    const range =
      this.#settings.rangeMode === "manual"
        ? [this.#settings.rangeMin ?? 0, this.#settings.rangeMax ?? 1]
        : this.autoRange;
    if (this.#settings.colorMode === "height") {
      this.#material.uniforms.uZMin.value = range[0];
      this.#material.uniforms.uZMax.value = range[1];
    } else {
      this.#material.uniforms.uMin.value = range[0];
      this.#material.uniforms.uMax.value = range[1];
    }
  }

  #allocate(capacity: number): void {
    this.#capacity = capacity;
    const pos = new THREE.BufferAttribute(new Float32Array(capacity * 3), 3);
    const val = new THREE.BufferAttribute(new Float32Array(capacity), 1);
    pos.setUsage(THREE.DynamicDrawUsage);
    val.setUsage(THREE.DynamicDrawUsage);
    this.#geometry.setAttribute("position", pos);
    this.#geometry.setAttribute("value", val);
    this.#writeOffset = 0;
    this.#total = 0;
  }

  update(payload: MessagePayload): void {
    if (payload.kind !== "cloud") return;
    const { header, cloud } = payload;
    this.frameId = header.frame_id;
    this.#colorField = cloud.colorField;

    if (!this.accumulate && cloud.count > this.#capacity) {
      this.#allocate(Math.max(cloud.count, this.#capacity * 2));
    }

    const pos = this.#geometry.getAttribute("position") as THREE.BufferAttribute;
    const val = this.#geometry.getAttribute("value") as THREE.BufferAttribute;
    const pArr = pos.array as Float32Array;
    const vArr = val.array as Float32Array;

    if (this.accumulate) {
      // 环形写入；跨界时分两段
      let src = 0;
      let remaining = Math.min(cloud.count, this.#capacity);
      while (remaining > 0) {
        const chunk = Math.min(remaining, this.#capacity - this.#writeOffset);
        pArr.set(
          cloud.positions.subarray(src * 3, (src + chunk) * 3),
          this.#writeOffset * 3,
        );
        if (cloud.colorValues) {
          vArr.set(cloud.colorValues.subarray(src, src + chunk), this.#writeOffset);
        }
        this.#writeOffset = (this.#writeOffset + chunk) % this.#capacity;
        src += chunk;
        remaining -= chunk;
      }
      this.#total = Math.min(this.#total + cloud.count, this.#capacity);
    } else {
      pArr.set(cloud.positions.subarray(0, cloud.count * 3));
      if (cloud.colorValues) vArr.set(cloud.colorValues.subarray(0, cloud.count));
      this.#total = cloud.count;
    }

    pos.needsUpdate = true;
    val.needsUpdate = true;
    this.#geometry.setDrawRange(0, this.#total);

    const u = this.#material.uniforms;
    u.uHasValue.value = cloud.colorValues ? 1 : 0;
    this.#autoZRange = [cloud.zMin, cloud.zMax];
    if (cloud.colorValues) {
      // 平滑跟随数据范围，避免帧间闪烁
      u.uMin.value = u.uMin.value * 0.9 + cloud.colorMin * 0.1;
      u.uMax.value = u.uMax.value * 0.9 + cloud.colorMax * 0.1;
      this.#autoFieldRange = [u.uMin.value, u.uMax.value];
    }
    this.#applyRange();
  }

  /** 清空累积缓冲 */
  clear(): void {
    this.#writeOffset = 0;
    this.#total = 0;
    this.#geometry.setDrawRange(0, 0);
  }

  dispose(): void {
    this.#offSceneTheme();
    this.#geometry.dispose();
    this.#material.dispose();
  }
}

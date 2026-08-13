import * as THREE from "three";

import type { MessagePayload } from "../worker/protocol";
import type { Display } from "./SceneManager";

/**
 * nav_msgs/OccupancyGrid：占用值写入 RGBA 纹理贴到平面。
 * 深色主题映射：占用→亮白、自由→微亮、未知→全透明。
 */
export class GridRenderer implements Display {
  readonly root = new THREE.Group();
  frameId: string | undefined;

  #mesh: THREE.Mesh;
  #originGroup = new THREE.Group();
  #texture: THREE.DataTexture | undefined;
  #material: THREE.MeshBasicMaterial;
  #size = { width: 0, height: 0 };

  constructor() {
    this.#material = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.#mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.#material);
    this.#originGroup.add(this.#mesh);
    this.root.add(this.#originGroup);
  }

  update(payload: MessagePayload): void {
    if (payload.kind !== "grid") return;
    const { header, info, data } = payload;
    this.frameId = header.frame_id;

    const { width, height, resolution, origin } = info;
    if (width !== this.#size.width || height !== this.#size.height) {
      this.#texture?.dispose();
      this.#texture = new THREE.DataTexture(
        new Uint8Array(width * height * 4),
        width,
        height,
        THREE.RGBAFormat,
      );
      this.#texture.magFilter = THREE.NearestFilter;
      this.#texture.minFilter = THREE.NearestFilter;
      this.#material.map = this.#texture;
      this.#material.needsUpdate = true;
      this.#size = { width, height };
    }

    const rgba = this.#texture!.image.data as Uint8Array;
    for (let i = 0; i < data.length; i++) {
      const v = data[i];
      const o = i * 4;
      if (v < 0) {
        rgba[o + 3] = 0; // 未知
      } else {
        const occ = v / 100;
        rgba[o] = 235;
        rgba[o + 1] = 235;
        rgba[o + 2] = 235;
        rgba[o + 3] = Math.round(18 + occ * 215);
      }
    }
    this.#texture!.needsUpdate = true;

    // origin 是栅格 (0,0) 角点在 frame 下的位姿；平面几何居中，需再偏移半幅
    const w = width * resolution;
    const h = height * resolution;
    this.#mesh.scale.set(w, h, 1);
    this.#mesh.position.set(w / 2, h / 2, 0);
    this.#originGroup.position.set(origin.position.x, origin.position.y, origin.position.z);
    this.#originGroup.quaternion.set(
      origin.orientation.x,
      origin.orientation.y,
      origin.orientation.z,
      origin.orientation.w,
    );
  }

  dispose(): void {
    this.#texture?.dispose();
    this.#material.dispose();
    this.#mesh.geometry.dispose();
  }
}

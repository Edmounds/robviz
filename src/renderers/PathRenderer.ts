import * as THREE from "three";

import type { Path } from "../core/types";
import type { MessagePayload } from "../worker/protocol";
import type { Display } from "./SceneManager";
import { onSceneTheme, sceneColors } from "./sceneTheme";

const INITIAL_CAPACITY = 4096;

/** nav_msgs/Path：轨迹线 */
export class PathRenderer implements Display {
  readonly root = new THREE.Group();
  frameId: string | undefined;

  #line: THREE.Line;
  #geometry = new THREE.BufferGeometry();
  #capacity = INITIAL_CAPACITY;
  #offSceneTheme: () => void;

  constructor() {
    this.#allocate(INITIAL_CAPACITY);
    const material = new THREE.LineBasicMaterial({
      color: sceneColors().foreground,
      transparent: true,
      opacity: 0.85,
    });
    this.#offSceneTheme = onSceneTheme(() => material.color.setHex(sceneColors().foreground));
    this.#line = new THREE.Line(this.#geometry, material);
    this.#line.frustumCulled = false;
    this.root.add(this.#line);
  }

  #allocate(capacity: number): void {
    this.#capacity = capacity;
    this.#geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(capacity * 3), 3),
    );
  }

  update(payload: MessagePayload): void {
    if (payload.kind !== "raw") return;
    const path = payload.message as Path;
    this.frameId = path.header.frame_id;

    const n = path.poses.length;
    if (n > this.#capacity) this.#allocate(Math.max(n, this.#capacity * 2));

    const attr = this.#geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < n; i++) {
      const p = path.poses[i].pose.position;
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = p.z;
    }
    attr.needsUpdate = true;
    this.#geometry.setDrawRange(0, n);
  }

  dispose(): void {
    this.#offSceneTheme();
    this.#geometry.dispose();
    (this.#line.material as THREE.Material).dispose();
  }
}

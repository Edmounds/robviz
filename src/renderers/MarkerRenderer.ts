import * as THREE from "three";

import type { TfBuffer } from "../core/TfBuffer";
import type { Header, Pose, TimeSec, Vector3 } from "../core/types";
import type { MessagePayload } from "../worker/protocol";
import type { Display } from "./SceneManager";

interface ColorRGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Marker {
  header: Header;
  ns: string;
  id: number;
  type: number;
  action: number;
  pose: Pose;
  scale: Vector3;
  color: ColorRGBA;
  points: Vector3[];
  colors: ColorRGBA[];
  text: string;
}

interface Entry {
  frameId: string;
  object: THREE.Object3D;
  /** TEXT 类型缓存内容，变了才重建 canvas 纹理 */
  textCache?: string;
}

function material(color: ColorRGBA): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color.r, color.g, color.b),
    transparent: color.a < 0.999,
    opacity: color.a,
  });
}

function disposeObject(obj: THREE.Object3D): void {
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) for (const m of mat) m.dispose();
    else if (mat) {
      const map = (mat as THREE.SpriteMaterial).map;
      if (map) map.dispose();
      mat.dispose();
    }
  });
}

/**
 * visualization_msgs/MarkerArray：箭头/立方体/球/圆柱/线条/点集/文字。
 * marker 可以来自不同 frame，tick() 里逐 frame 求 TF 放置。
 */
export class MarkerRenderer implements Display {
  readonly root = new THREE.Group();
  frameId: string | undefined; // 未使用（tick 自管 TF），保留接口
  #entries = new Map<string, Entry>();
  #frameGroups = new Map<string, THREE.Group>();

  update(payload: MessagePayload): void {
    if (payload.kind !== "raw") return;
    const markers = (payload.message as { markers: Marker[] }).markers;
    for (const m of markers) {
      const key = `${m.ns}/${m.id}`;
      if (m.action === 3) {
        // DELETEALL
        for (const k of [...this.#entries.keys()]) this.#remove(k);
        continue;
      }
      if (m.action === 2) {
        this.#remove(key);
        continue;
      }
      this.#upsert(key, m);
    }
  }

  #remove(key: string): void {
    const e = this.#entries.get(key);
    if (!e) return;
    e.object.parent?.remove(e.object);
    disposeObject(e.object);
    this.#entries.delete(key);
  }

  #frameGroup(frameId: string): THREE.Group {
    let g = this.#frameGroups.get(frameId);
    if (!g) {
      g = new THREE.Group();
      this.#frameGroups.set(frameId, g);
      this.root.add(g);
    }
    return g;
  }

  #upsert(key: string, m: Marker): void {
    const prev = this.#entries.get(key);
    // TEXT 且内容未变：只更新位姿，避免每帧重建 canvas 纹理
    if (prev && m.type === 9 && prev.textCache === m.text && prev.frameId === m.header.frame_id) {
      this.#applyPose(prev.object, m);
      prev.object.scale.setScalar(m.scale.z);
      return;
    }
    if (prev) this.#remove(key);
    const object = this.#build(m);
    if (!object) return;
    this.#applyPose(object, m);
    this.#frameGroup(m.header.frame_id).add(object);
    this.#entries.set(key, {
      frameId: m.header.frame_id,
      object,
      textCache: m.type === 9 ? m.text : undefined,
    });
  }

  #applyPose(obj: THREE.Object3D, m: Marker): void {
    obj.position.set(m.pose.position.x, m.pose.position.y, m.pose.position.z);
    obj.quaternion.set(
      m.pose.orientation.x,
      m.pose.orientation.y,
      m.pose.orientation.z,
      m.pose.orientation.w,
    );
  }

  #build(m: Marker): THREE.Object3D | undefined {
    switch (m.type) {
      case 0: {
        // ARROW：沿 +X，scale.x 长度、scale.y 轴径
        const g = new THREE.Group();
        const len = m.scale.x || 1;
        const shaftLen = len * 0.75;
        const headLen = len * 0.25;
        const shaftR = (m.scale.y || 0.1) / 2;
        const mat = material(m.color);
        const shaft = new THREE.Mesh(
          new THREE.CylinderGeometry(shaftR, shaftR, shaftLen, 12),
          mat,
        );
        shaft.rotation.z = -Math.PI / 2;
        shaft.position.x = shaftLen / 2;
        const head = new THREE.Mesh(new THREE.ConeGeometry(shaftR * 2.2, headLen, 12), mat);
        head.rotation.z = -Math.PI / 2;
        head.position.x = shaftLen + headLen / 2;
        g.add(shaft, head);
        return g;
      }
      case 1: {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material(m.color));
        mesh.scale.set(m.scale.x, m.scale.y, m.scale.z);
        const g = new THREE.Group();
        g.add(mesh);
        return g;
      }
      case 2: {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), material(m.color));
        mesh.scale.set(m.scale.x, m.scale.y, m.scale.z);
        const g = new THREE.Group();
        g.add(mesh);
        return g;
      }
      case 3: {
        // CYLINDER：ROS 轴向 Z，three 轴向 Y
        const mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 1, 20),
          material(m.color),
        );
        mesh.rotation.x = Math.PI / 2;
        mesh.scale.set(m.scale.x, m.scale.z, m.scale.y);
        const g = new THREE.Group();
        g.add(mesh);
        return g;
      }
      case 4:
      case 5: {
        // LINE_STRIP / LINE_LIST
        const positions = new Float32Array(m.points.length * 3);
        m.points.forEach((p, i) => positions.set([p.x, p.y, p.z], i * 3));
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.LineBasicMaterial({
          color: new THREE.Color(m.color.r, m.color.g, m.color.b),
          transparent: m.color.a < 0.999,
          opacity: m.color.a,
        });
        return m.type === 4 ? new THREE.Line(geo, mat) : new THREE.LineSegments(geo, mat);
      }
      case 6:
      case 7: {
        // CUBE_LIST / SPHERE_LIST：实例化
        const geo =
          m.type === 6 ? new THREE.BoxGeometry(1, 1, 1) : new THREE.SphereGeometry(0.5, 12, 8);
        const mesh = new THREE.InstancedMesh(geo, material(m.color), m.points.length);
        const mtx = new THREE.Matrix4();
        m.points.forEach((p, i) => {
          mtx.makeScale(m.scale.x, m.scale.y, m.scale.z);
          mtx.setPosition(p.x, p.y, p.z);
          mesh.setMatrixAt(i, mtx);
        });
        return mesh;
      }
      case 8: {
        // POINTS
        const positions = new Float32Array(m.points.length * 3);
        m.points.forEach((p, i) => positions.set([p.x, p.y, p.z], i * 3));
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        return new THREE.Points(
          geo,
          new THREE.PointsMaterial({
            color: new THREE.Color(m.color.r, m.color.g, m.color.b),
            size: m.scale.x || 0.05,
            sizeAttenuation: true,
          }),
        );
      }
      case 9: {
        // TEXT_VIEW_FACING：canvas 纹理 sprite
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const fontPx = 64;
        ctx.font = `${fontPx}px sans-serif`;
        const w = Math.max(2, Math.ceil(ctx.measureText(m.text).width) + 16);
        canvas.width = w;
        canvas.height = fontPx + 16;
        const c2 = canvas.getContext("2d")!;
        c2.font = `${fontPx}px sans-serif`;
        c2.fillStyle = `rgba(${m.color.r * 255},${m.color.g * 255},${m.color.b * 255},${m.color.a})`;
        c2.textBaseline = "middle";
        c2.fillText(m.text, 8, canvas.height / 2);
        const tex = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }),
        );
        // scale.z 为文字高度（米）
        sprite.scale.set(((m.scale.z || 0.3) * canvas.width) / canvas.height, m.scale.z || 0.3, 1);
        return sprite;
      }
      default:
        return undefined;
    }
  }

  tick(tf: TfBuffer, fixedFrame: string, time: TimeSec, broken: Set<string>): void {
    for (const [frameId, group] of this.#frameGroups) {
      if (group.children.length === 0) continue;
      if (frameId === fixedFrame || frameId === "") {
        group.visible = true;
        group.position.set(0, 0, 0);
        group.quaternion.identity();
        continue;
      }
      const t = tf.lookup(fixedFrame, frameId, time);
      if (!t) {
        group.visible = false;
        broken.add(frameId);
        continue;
      }
      group.visible = true;
      group.position.set(t.translation.x, t.translation.y, t.translation.z);
      group.quaternion.set(t.rotation.x, t.rotation.y, t.rotation.z, t.rotation.w);
    }
  }

  dispose(): void {
    for (const key of [...this.#entries.keys()]) this.#remove(key);
  }
}

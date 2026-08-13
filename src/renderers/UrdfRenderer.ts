import * as THREE from "three";
import { ColladaLoader } from "three/addons/loaders/ColladaLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import URDFLoader from "urdf-loader";
import type { URDFRobot } from "urdf-loader";

import type { MessagePayload } from "../worker/protocol";
import type { Display } from "./SceneManager";

export interface UrdfJointInfo {
  name: string;
  type: string;
  lower: number;
  upper: number;
  value: number;
}

/**
 * 浏览器端 URDF 加载（robot_viewer 模式，零机器人侧部署）：
 * 用户选中 .urdf + mesh 文件（或整个文件夹），mesh 按文件名解析成 blob URL。
 * 模型挂到选定 TF frame（默认 base_link），关节由滑块或 /joint_states 驱动。
 */
export class UrdfRenderer implements Display {
  readonly root = new THREE.Group();
  frameId: string | undefined;

  #robot: URDFRobot | undefined;
  #blobUrls: string[] = [];

  /** files：.urdf 与全部 mesh；按 basename（小写）匹配 mesh 引用 */
  async load(files: File[]): Promise<{ robotName: string; joints: UrdfJointInfo[] }> {
    this.clear();

    const byName = new Map<string, File>();
    for (const f of files) {
      byName.set(f.name.toLowerCase(), f);
      // webkitdirectory 时保留相对路径作为候选键
      const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath;
      if (rel) byName.set(rel.toLowerCase(), f);
    }
    const urdfFile = files.find((f) => /\.urdf$|\.xml$/i.test(f.name));
    if (!urdfFile) throw new Error("未找到 .urdf 文件");
    const urdfText = await urdfFile.text();

    const fileUrl = (path: string): string | undefined => {
      const clean = path.replace(/^package:\/\//, "").toLowerCase();
      // 先精确匹配相对路径，再按 basename 匹配
      const base = clean.split("/").pop()!;
      const file = byName.get(clean) ?? byName.get(base);
      if (!file) return undefined;
      const url = URL.createObjectURL(file);
      this.#blobUrls.push(url);
      return url;
    };

    const stl = new STLLoader();
    const collada = new ColladaLoader();
    const obj = new OBJLoader();

    const loader = new URDFLoader();
    // urdf-loader 回调签名：(url, manager, material, onLoad)
    loader.loadMeshCb = (path, _manager, material, done) => {
      const url = fileUrl(path);
      if (!url) {
        done(new THREE.Object3D(), new Error(`mesh 未找到: ${path}`));
        return;
      }
      const ext = path.split(".").pop()!.toLowerCase();
      if (ext === "stl") {
        stl.load(
          url,
          (geometry) => {
            const mesh = new THREE.Mesh(
              geometry,
              material ?? new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.7 }),
            );
            done(mesh);
          },
          undefined,
          (err) => done(new THREE.Object3D(), err as Error),
        );
      } else if (ext === "dae") {
        collada.load(
          url,
          (result) => done(result?.scene ?? new THREE.Object3D()),
          undefined,
          (err) => done(new THREE.Object3D(), err as Error),
        );
      } else if (ext === "obj") {
        obj.load(
          url,
          (group) => done(group),
          undefined,
          (err) => done(new THREE.Object3D(), err as Error),
        );
      } else {
        done(new THREE.Object3D(), new Error(`不支持的 mesh 格式: ${ext}`));
      }
    };

    const robot = loader.parse(urdfText);
    this.#robot = robot;
    this.root.add(robot);

    const joints: UrdfJointInfo[] = [];
    for (const [name, j] of Object.entries(robot.joints)) {
      if (j.jointType === "fixed" || j.jointType === "floating") continue;
      const continuous = j.jointType === "continuous";
      joints.push({
        name,
        type: j.jointType,
        lower: continuous ? -Math.PI : Number(j.limit.lower),
        upper: continuous ? Math.PI : Number(j.limit.upper),
        value: Number(j.angle) || 0,
      });
    }
    return { robotName: robot.robotName || urdfFile.name, joints };
  }

  setJoint(name: string, value: number): void {
    this.#robot?.setJointValue(name, value);
  }

  setJointValues(values: Record<string, number>): void {
    this.#robot?.setJointValues(values);
  }

  update(_payload: MessagePayload): void {}

  clear(): void {
    if (this.#robot) {
      this.root.remove(this.#robot);
      this.#robot.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) for (const m of mat) m.dispose();
        else if (mat) mat.dispose();
      });
      this.#robot = undefined;
    }
    for (const url of this.#blobUrls) URL.revokeObjectURL(url);
    this.#blobUrls = [];
  }

  dispose(): void {
    this.clear();
  }
}

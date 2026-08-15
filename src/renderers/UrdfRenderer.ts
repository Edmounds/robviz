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

export interface UrdfTreeNode {
  id: string;
  name: string;
  type: "link" | "joint";
  children: UrdfTreeNode[];
}

export interface UrdfModelInfo {
  robotName: string;
  sourceFile: string;
  sourceText: string;
  joints: UrdfJointInfo[];
  tree?: UrdfTreeNode;
  missingMeshes: string[];
  bounds: THREE.Box3;
}

export interface UrdfDisplayOptions {
  visual: boolean;
  collision: boolean;
  modelAxes: boolean;
  jointAxes: boolean;
  centerOfMass: boolean;
  inertia: boolean;
  shadows: boolean;
}

const DEFAULT_OPTIONS: UrdfDisplayOptions = {
  visual: true,
  collision: false,
  modelAxes: true,
  jointAxes: false,
  centerOfMass: false,
  inertia: false,
  shadows: false,
};

type UrdfObject = THREE.Object3D & {
  isURDFRobot?: boolean;
  isURDFLink?: boolean;
  isURDFJoint?: boolean;
  isURDFVisual?: boolean;
  isURDFCollider?: boolean;
  urdfName?: string;
};

function normalizeResourcePath(path: string): string {
  const parts: string[] = [];
  for (const part of path.replace(/\\/g, "/").split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return parts.join("/").toLowerCase();
}

function buildTree(object: UrdfObject): UrdfTreeNode | undefined {
  const type = object.isURDFJoint ? "joint" : object.isURDFLink || object.isURDFRobot ? "link" : undefined;
  const childNodes = object.children
    .map((child) => buildTree(child as UrdfObject))
    .filter((child): child is UrdfTreeNode => child !== undefined);
  if (!type) return childNodes.length === 1 ? childNodes[0] : undefined;
  const name = object.urdfName || object.name || (object.isURDFRobot ? "robot" : type);
  return { id: `${type}:${name}`, name, type, children: childNodes };
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    mesh.geometry?.dispose();
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) for (const item of material) item.dispose();
    else material?.dispose();
  });
}

export class UrdfRenderer implements Display {
  readonly root = new THREE.Group();
  frameId: string | undefined;

  #robot: URDFRobot | undefined;
  #blobUrls: string[] = [];
  #options: UrdfDisplayOptions = { ...DEFAULT_OPTIONS };
  #modelAxes?: THREE.AxesHelper;
  #selection?: THREE.BoxHelper;
  #nodes = new Map<string, THREE.Object3D>();
  #bounds = new THREE.Box3();

  async load(files: File[], sourceText?: string): Promise<UrdfModelInfo> {
    this.clear();
    const byName = new Map<string, File>();
    for (const file of files) {
      byName.set(file.name.toLowerCase(), file);
      const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
      if (relative) byName.set(normalizeResourcePath(relative), file);
    }
    const urdfFile = files.find((file) => /\.urdf$|\.xml$/i.test(file.name));
    if (!urdfFile) throw new Error("未找到 .urdf 或 .xml 文件");
    const urdfText = sourceText ?? await urdfFile.text();
    const urdfRelative = (urdfFile as File & { webkitRelativePath?: string }).webkitRelativePath;
    const urdfDirectory = urdfRelative
      ? normalizeResourcePath(urdfRelative).split("/").slice(0, -1).join("/")
      : "";
    const missingMeshes = new Set<string>();
    const pendingMeshes: Promise<void>[] = [];

    const resolveFile = (path: string): string | undefined => {
      const packagePath = path.replace(/^package:\/\//, "");
      const clean = normalizeResourcePath(
        path.startsWith("package://") ? packagePath : `${urdfDirectory}/${path}`,
      );
      const base = clean.split("/").pop()!;
      const direct = byName.get(clean);
      const suffix = [...byName].find(([key]) => key.endsWith(`/${clean}`) || key.endsWith(`/${base}`));
      const file = direct ?? byName.get(base) ?? suffix?.[1];
      if (!file) return undefined;
      const url = URL.createObjectURL(file);
      this.#blobUrls.push(url);
      return url;
    };

    const stl = new STLLoader();
    const collada = new ColladaLoader();
    const obj = new OBJLoader();
    const loader = new URDFLoader();
    loader.loadMeshCb = (path, _manager, material, done) => {
      pendingMeshes.push(new Promise<void>((resolve) => {
        const url = resolveFile(path);
        if (!url) {
          missingMeshes.add(path);
          done(new THREE.Object3D(), new Error(`mesh 未找到: ${path}`));
          resolve();
          return;
        }
        const finish = (object: THREE.Object3D, error?: Error) => {
          if (error) missingMeshes.add(path);
          done(object, error);
          resolve();
        };
        const extension = path.split(".").pop()?.toLowerCase();
        if (extension === "stl") {
          stl.load(url, (geometry) => finish(new THREE.Mesh(
            geometry,
            material ?? new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.7 }),
          )), undefined, (error) => finish(new THREE.Object3D(), error as Error));
        } else if (extension === "dae") {
          collada.load(url, (result) => finish(result?.scene ?? new THREE.Object3D()), undefined, (error) => finish(new THREE.Object3D(), error as Error));
        } else if (extension === "obj") {
          obj.load(url, finish, undefined, (error) => finish(new THREE.Object3D(), error as Error));
        } else {
          finish(new THREE.Object3D(), new Error(`不支持的 mesh 格式: ${extension ?? "unknown"}`));
        }
      }));
    };

    let robot: URDFRobot;
    try {
      robot = loader.parse(urdfText);
      await Promise.all(pendingMeshes);
    } catch (error) {
      this.clear();
      throw error;
    }
    this.#robot = robot;
    this.root.add(robot);
    robot.updateMatrixWorld(true);
    this.#bounds = new THREE.Box3().setFromObject(robot);
    this.#indexNodes(robot);
    this.#prepareColliders(robot);
    this.#buildHelpers(robot);
    this.applyDisplayOptions(this.#options);

    const joints: UrdfJointInfo[] = [];
    for (const [name, joint] of Object.entries(robot.joints)) {
      if (joint.jointType === "fixed" || joint.jointType === "floating") continue;
      const continuous = joint.jointType === "continuous";
      joints.push({
        name,
        type: joint.jointType,
        lower: continuous ? -Math.PI : Number(joint.limit.lower),
        upper: continuous ? Math.PI : Number(joint.limit.upper),
        value: Number(joint.angle) || 0,
      });
    }
    return {
      robotName: robot.robotName || urdfFile.name,
      sourceFile: urdfFile.name,
      sourceText: urdfText,
      joints,
      tree: buildTree(robot as UrdfObject),
      missingMeshes: [...missingMeshes].sort(),
      bounds: this.#bounds.clone(),
    };
  }

  #indexNodes(robot: URDFRobot): void {
    this.#nodes.clear();
    robot.traverse((object) => {
      const urdf = object as UrdfObject;
      const type = urdf.isURDFJoint ? "joint" : urdf.isURDFLink || urdf.isURDFRobot ? "link" : undefined;
      if (type) this.#nodes.set(`${type}:${urdf.urdfName || urdf.name}`, object);
    });
  }

  #prepareColliders(robot: URDFRobot): void {
    for (const collider of Object.values(robot.colliders)) {
      collider.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.material = new THREE.MeshBasicMaterial({
          color: 0xe6b800,
          wireframe: true,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
        });
      });
    }
  }

  #buildHelpers(robot: URDFRobot): void {
    this.#modelAxes = new THREE.AxesHelper(Math.max(0.5, this.#bounds.getSize(new THREE.Vector3()).length() * 0.12));
    this.#modelAxes.userData.urdfHelper = "modelAxes";
    this.root.add(this.#modelAxes);

    for (const joint of Object.values(robot.joints)) {
      if (joint.jointType === "fixed" || joint.jointType === "floating") continue;
      const arrow = new THREE.ArrowHelper(joint.axis.clone().normalize(), new THREE.Vector3(), 0.3, 0xf5f5f5, 0.08, 0.04);
      arrow.userData.urdfHelper = "jointAxes";
      joint.add(arrow);
    }

    for (const link of Object.values(robot.links)) {
      const inertial = link.inertial;
      if (!inertial || inertial.mass <= 0) continue;
      const origin = new THREE.Vector3(...(inertial.origin.xyz as [number, number, number]));
      const rotation = new THREE.Euler(...(inertial.origin.rpy as [number, number, number]), "XYZ");
      const com = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xf5f5f5 }),
      );
      com.position.copy(origin);
      com.userData.urdfHelper = "centerOfMass";
      link.add(com);

      const { ixx, iyy, izz } = inertial.inertia;
      const factor = 5 / (2 * inertial.mass);
      const radii = new THREE.Vector3(
        Math.sqrt(Math.max(1e-6, factor * (iyy + izz - ixx))),
        Math.sqrt(Math.max(1e-6, factor * (ixx + izz - iyy))),
        Math.sqrt(Math.max(1e-6, factor * (ixx + iyy - izz))),
      );
      const inertia = new THREE.Mesh(
        new THREE.SphereGeometry(1, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0x4ea1ff, wireframe: true, transparent: true, opacity: 0.6 }),
      );
      inertia.position.copy(origin);
      inertia.rotation.copy(rotation);
      inertia.scale.copy(radii);
      inertia.userData.urdfHelper = "inertia";
      link.add(inertia);
    }
  }

  applyDisplayOptions(options: UrdfDisplayOptions): void {
    this.#options = { ...options };
    this.root.traverse((object) => {
      const urdf = object as UrdfObject;
      if (urdf.isURDFVisual) object.visible = options.visual;
      if (urdf.isURDFCollider) object.visible = options.collision;
      const helper = object.userData.urdfHelper as keyof UrdfDisplayOptions | undefined;
      if (helper) object.visible = options[helper];
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh && !helper) {
        mesh.castShadow = options.shadows;
        mesh.receiveShadow = options.shadows;
      }
    });
  }

  setJoint(name: string, value: number): void {
    this.#robot?.setJointValue(name, value);
    this.#selection?.update();
  }

  setJointValues(values: Record<string, number>): void {
    this.#robot?.setJointValues(values);
    this.#selection?.update();
  }

  setIgnoreLimits(ignore: boolean): void {
    if (!this.#robot) return;
    for (const joint of Object.values(this.#robot.joints)) joint.ignoreLimits = ignore;
  }

  resetJoints(): void {
    if (!this.#robot) return;
    for (const joint of Object.values(this.#robot.joints)) {
      if (joint.jointType !== "fixed" && joint.jointType !== "floating") joint.setJointValue(0);
    }
  }

  selectNode(id: string | undefined): THREE.Box3 | undefined {
    if (this.#selection) {
      this.root.remove(this.#selection);
      this.#selection.geometry.dispose();
      (this.#selection.material as THREE.Material).dispose();
      this.#selection = undefined;
    }
    if (!id) return undefined;
    const object = this.#nodes.get(id);
    if (!object) return undefined;
    this.#selection = new THREE.BoxHelper(object, 0xf5f5f5);
    this.root.add(this.#selection);
    return new THREE.Box3().setFromObject(object);
  }

  get bounds(): THREE.Box3 {
    return this.#bounds.clone();
  }

  update(_payload: MessagePayload): void {}

  clear(): void {
    if (this.#robot) {
      this.root.remove(this.#robot);
      disposeObject(this.#robot);
      this.#robot = undefined;
    }
    if (this.#modelAxes) {
      this.root.remove(this.#modelAxes);
      disposeObject(this.#modelAxes);
      this.#modelAxes = undefined;
    }
    if (this.#selection) {
      this.root.remove(this.#selection);
      disposeObject(this.#selection);
      this.#selection = undefined;
    }
    for (const url of this.#blobUrls) URL.revokeObjectURL(url);
    this.#blobUrls = [];
    this.#nodes.clear();
    this.#bounds.makeEmpty();
  }

  dispose(): void {
    this.clear();
  }
}

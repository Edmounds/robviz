import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";

import { LATEST, TfBuffer } from "../core/TfBuffer";
import type { TimeSec } from "../core/types";
import type { MessagePayload } from "../worker/protocol";
import { onSceneTheme, sceneColors } from "./sceneTheme";
import { TfAxesRenderer } from "./TfAxesRenderer";

/** 一种消息类型的 3D 显示器 */
export interface Display {
  readonly root: THREE.Object3D;
  /** 最近一条消息的 frame_id，SceneManager 每帧按它求 TF */
  frameId: string | undefined;
  update(payload: MessagePayload): void;
  dispose(): void;
  /**
   * 自定义 TF 放置（内部含多个 frame 的显示器，如 MarkerArray、URDF）。
   * 定义了则 SceneManager 跳过标准的 frameId 整体变换，逐帧调用本方法。
   */
  tick?(tf: TfBuffer, fixedFrame: string, time: TimeSec, broken: Set<string>): void;
}

export interface SceneStats {
  /** 实际渲染帧率（按需渲染：空闲时趋近 0，这是特性不是问题） */
  renderHz: number;
  brokenFrames: string[];
  /** 当前 TF 平滑延迟（ms），随网络抖动自适应 */
  tfDelayMs: number;
}

/** ROS 为 Z-up 右手系；three 默认 Y-up，这里全局切到 Z-up */
THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

const TF_DELAY_MIN_S = 0.02;
const TF_DELAY_MAX_S = 0.3;

const HOME_POSITION = new THREE.Vector3(8, -8, 8);
const HOME_TARGET = new THREE.Vector3(0, 0, 0);

export function stopHandledPointerDown(
  event: Pick<PointerEvent, "defaultPrevented" | "stopImmediatePropagation">,
): void {
  if (event.defaultPrevented) event.stopImmediatePropagation();
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

interface CameraFlight {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  start: number;
  duration: number;
}

export class SceneManager {
  #renderer: THREE.WebGLRenderer;
  #scene = new THREE.Scene();
  #camera: THREE.PerspectiveCamera;
  #controls: OrbitControls;
  #displays = new Map<string, Display>();
  #tf: TfBuffer;
  #tfAxes: TfAxesRenderer;
  #running = true;
  #active = true;
  #dirty = true;
  #renderCount = 0;
  #lastStatsAt = performance.now();

  // TF 平滑（抖动缓冲）：渲染时间 = 最新 TF 时间 - 自适应延迟。
  // 理想网络下延迟趋近半个发布周期；抖动网络下自动加大，运动保持平滑。
  #newestTfStamp = 0;
  #tfIntervalEwma = 0;
  #tfJitterEwma = 0;
  #lastTfArrivalMs = 0;
  #lastTfStamp = 0;

  #fixedFrame = "map";
  #grid: THREE.Object3D;
  #gridMaterials: LineMaterial[] = [];
  #hemisphereLight: THREE.HemisphereLight;
  #directionalLight: THREE.DirectionalLight;
  #resizeObserver: ResizeObserver;
  #offSceneTheme: () => void;
  #flight?: CameraFlight;
  #followFrame?: string;
  #followLast?: THREE.Vector3;
  onStats?: (stats: SceneStats) => void;
  /** 每帧渲染前调用（挂 WorkerBridge.flushFrame），返回 true 表示有新数据 */
  onBeforeRender?: () => boolean;

  constructor(canvas: HTMLCanvasElement, tf: TfBuffer) {
    this.#tf = tf;
    this.#renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.#renderer.setClearColor(sceneColors().background, 1);
    this.#offSceneTheme = onSceneTheme(() => {
      const colors = sceneColors();
      this.#renderer.setClearColor(colors.background, 1);
      for (const mat of this.#gridMaterials) mat.color.setHex(colors.foreground);
      this.#dirty = true;
    });

    this.#camera = new THREE.PerspectiveCamera(60, 1, 0.01, 1000);
    this.#camera.up.set(0, 0, 1);
    this.#camera.position.copy(HOME_POSITION);

    canvas.addEventListener("pointerdown", stopHandledPointerDown, { capture: true });
    this.#controls = new OrbitControls(this.#camera, canvas);
    this.#controls.enableDamping = true;
    this.#controls.dampingFactor = 0.12;
    this.#controls.addEventListener("change", () => {
      this.#dirty = true;
    });
    // 用户开始拖动即取消进行中的相机飞行
    this.#controls.addEventListener("start", () => {
      this.#flight = undefined;
    });

    this.#grid = this.#buildGrid();
    this.#scene.add(this.#grid);
    this.#tfAxes = new TfAxesRenderer();
    this.#scene.add(this.#tfAxes.root);

    // URDF/Marker 等实体网格需要光照（点云/线条用无光材质不受影响）
    this.#hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x333333, 1.2);
    this.#scene.add(this.#hemisphereLight);
    this.#directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.#directionalLight.position.set(5, -3, 8);
    this.#scene.add(this.#directionalLight);

    const resize = () => {
      const el = canvas.parentElement;
      if (!el) return;
      const { clientWidth: w, clientHeight: h } = el;
      if (w === 0 || h === 0) return;
      this.#renderer.setSize(w, h, false);
      this.#camera.aspect = w / h;
      this.#camera.updateProjectionMatrix();
      this.#dirty = true;
    };
    resize();
    this.#resizeObserver = new ResizeObserver(resize);
    this.#resizeObserver.observe(canvas.parentElement!);

    const loop = () => {
      if (!this.#running) return;
      if (this.#active) this.#tick();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  get fixedFrame(): string {
    return this.#fixedFrame;
  }

  /** 供框选等工具计算投影 */
  get camera(): THREE.PerspectiveCamera {
    return this.#camera;
  }

  /** 框选工具激活时关闭轨道控制 */
  setControlsEnabled(enabled: boolean): void {
    this.#controls.enabled = enabled;
  }

  setGridVisible(visible: boolean): void {
    this.#grid.visible = visible;
    this.#dirty = true;
  }

  setTfAxesLineWidth(lineWidth: number): void {
    this.#tfAxes.setLineWidth(lineWidth);
    this.#dirty = true;
  }

  setLightingVisible(visible: boolean): void {
    this.#hemisphereLight.visible = visible;
    this.#directionalLight.visible = visible;
    this.#dirty = true;
  }

  setShadowsEnabled(enabled: boolean): void {
    this.#renderer.shadowMap.enabled = enabled;
    this.#directionalLight.castShadow = enabled;
    this.#dirty = true;
  }

  set fixedFrame(frame: string) {
    if (frame === this.#fixedFrame) return;
    this.#fixedFrame = frame;
    // 坐标系变了，跟踪基准重置（下帧重新飞到目标）
    this.#followLast = undefined;
    this.#dirty = true;
  }

  get followFrame(): string | undefined {
    return this.#followFrame;
  }

  /**
   * 视角跟踪：每帧把观察中心锁到该 frame 原点（rviz Target Frame 式）。
   * 跟踪中轨道旋转/缩放仍然自由，只锁定中心；undefined 取消。
   */
  setFollowFrame(frame: string | undefined): void {
    this.#followFrame = frame;
    this.#followLast = undefined;
    this.#dirty = true;
  }

  /** 外部数据更新后标脏（按需渲染） */
  /** 同步渲染一帧并导出 PNG（未开 preserveDrawingBuffer，必须先渲染再读） */
  screenshot(): string {
    this.#render();
    return this.#renderer.domElement.toDataURL("image/png");
  }

  invalidate(): void {
    this.#dirty = true;
  }

  setActive(active: boolean): void {
    this.#active = active;
    if (active) this.#dirty = true;
  }

  // ---- 相机动画 ----

  /**
   * 相机平滑飞行。position 省略时保持当前机位与目标的偏移（只移观察中心）。
   * prefers-reduced-motion 下瞬移。
   */
  flyTo(target: THREE.Vector3, position?: THREE.Vector3, durationMs = 600): void {
    const toTarget = target.clone();
    const toPos =
      position?.clone() ??
      this.#camera.position.clone().add(toTarget).sub(this.#controls.target);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.#camera.position.copy(toPos);
      this.#controls.target.copy(toTarget);
      this.#dirty = true;
      return;
    }
    this.#flight = {
      fromPos: this.#camera.position.clone(),
      toPos,
      fromTarget: this.#controls.target.clone(),
      toTarget,
      start: performance.now(),
      duration: durationMs,
    };
    this.#dirty = true;
  }

  /** 飞回默认机位 */
  resetView(): void {
    this.flyTo(HOME_TARGET, HOME_POSITION, 700);
  }

  /** 当前相机位姿（配置文件保存用） */
  getCameraState(): { position: [number, number, number]; target: [number, number, number] } {
    const p = this.#camera.position;
    const t = this.#controls.target;
    return { position: [p.x, p.y, p.z], target: [t.x, t.y, t.z] };
  }

  /** 恢复相机位姿（配置文件加载用，瞬时不做动画） */
  setCameraState(state: { position: [number, number, number]; target: [number, number, number] }): void {
    this.#flight = undefined;
    this.#camera.position.set(...state.position);
    this.#controls.target.set(...state.target);
    this.#dirty = true;
  }

  /** 飞到能看全包围盒的视距（保持当前观察方向） */
  flyToFit(box: THREE.Box3): void {
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    const dist = Math.max(2, (radius / Math.tan((this.#camera.fov * Math.PI) / 360)) * 1.2);
    const dir = this.#camera.position.clone().sub(this.#controls.target).normalize();
    if (dir.lengthSq() < 0.5) dir.set(1, -1, 1).normalize();
    this.flyTo(center, center.clone().add(dir.multiplyScalar(dist)), 800);
  }

  /** App 在每条 TF 消息后调用：驱动平滑延迟自适应 */
  reportTf(newestStampSec: TimeSec): void {
    const now = performance.now();
    if (this.#lastTfStamp > 0) {
      const dtStamp = newestStampSec - this.#lastTfStamp;
      const dtArrival = (now - this.#lastTfArrivalMs) / 1000;
      if (dtStamp > 0 && dtStamp < 1) {
        const dev = Math.abs(dtArrival - dtStamp);
        this.#tfIntervalEwma = this.#tfIntervalEwma * 0.9 + dtStamp * 0.1;
        this.#tfJitterEwma = this.#tfJitterEwma * 0.9 + dev * 0.1;
      }
    }
    if (newestStampSec > this.#newestTfStamp) this.#newestTfStamp = newestStampSec;
    this.#lastTfStamp = newestStampSec;
    this.#lastTfArrivalMs = now;
    this.#dirty = true;
  }

  #renderTime(): TimeSec {
    if (this.#newestTfStamp === 0) return LATEST;
    return this.#newestTfStamp - this.#tfDelaySec();
  }

  #tfDelaySec(): number {
    const d = 2 * this.#tfJitterEwma + 0.5 * this.#tfIntervalEwma;
    return Math.min(Math.max(d, TF_DELAY_MIN_S), TF_DELAY_MAX_S);
  }

  addDisplay(topic: string, display: Display): void {
    this.removeDisplay(topic);
    this.#displays.set(topic, display);
    this.#scene.add(display.root);
    this.#dirty = true;
  }

  removeDisplay(topic: string): void {
    this.#displayErrors.delete(topic);
    this.#disabledDisplays.delete(topic);
    const d = this.#displays.get(topic);
    if (!d) return;
    this.#scene.remove(d.root);
    try {
      d.dispose();
    } catch (err) {
      console.error(`[scene] dispose error on ${topic}:`, err);
    }
    this.#displays.delete(topic);
    this.#dirty = true;
  }

  getDisplay(topic: string): Display | undefined {
    return this.#displays.get(topic);
  }

  dispose(): void {
    this.#running = false;
    this.#resizeObserver.disconnect();
    this.#offSceneTheme();
    this.#tfAxes.dispose();
    for (const topic of [...this.#displays.keys()]) this.removeDisplay(topic);
    this.#renderer.domElement.removeEventListener("pointerdown", stopHandledPointerDown, true);
    this.#controls.dispose();
    this.#grid.traverse((object) => {
      const geometry = (object as THREE.LineSegments).geometry;
      geometry?.dispose();
    });
    for (const material of this.#gridMaterials) material.dispose();
    this.#renderer.dispose();
  }

  #tick(): void {
    // 大负载在渲染帧开头统一消费（与渲染对齐，最新帧优先）
    if (this.onBeforeRender?.()) this.#dirty = true;
    this.#tickFollow();
    // 相机飞行补间
    if (this.#flight) {
      const f = this.#flight;
      const raw = Math.min(1, (performance.now() - f.start) / f.duration);
      const t = easeInOutCubic(raw);
      this.#camera.position.lerpVectors(f.fromPos, f.toPos, t);
      this.#controls.target.lerpVectors(f.fromTarget, f.toTarget, t);
      if (raw >= 1) this.#flight = undefined;
      this.#dirty = true;
    }
    // damping 进行中 update() 返回 true
    if (this.#controls.update()) this.#dirty = true;

    const now = performance.now();
    if (this.#dirty) {
      this.#dirty = false;
      this.#render();
      this.#renderCount++;
    }

    if (now - this.#lastStatsAt >= 500) {
      const renderHz = Math.round((this.#renderCount * 1000) / (now - this.#lastStatsAt));
      this.#renderCount = 0;
      this.#lastStatsAt = now;
      this.onStats?.({
        renderHz,
        brokenFrames: [...this.#broken].sort(),
        tfDelayMs: Math.round(this.#tfDelaySec() * 1000),
      });
    }
  }

  /** 视角跟踪：目标 frame 移动多少，相机与观察中心平移多少（保留用户轨道偏移） */
  #tickFollow(): void {
    if (!this.#followFrame) return;
    const tf = this.#tf.lookup(this.#fixedFrame, this.#followFrame, this.#renderTime());
    if (!tf) return; // TF 断链：保持最后位置，断链提示由渲染层负责
    const pos = new THREE.Vector3(tf.translation.x, tf.translation.y, tf.translation.z);
    if (this.#flight) {
      // 飞行接管相机期间只更新基准，不叠加位移
    } else if (this.#followLast) {
      const delta = pos.clone().sub(this.#followLast);
      if (delta.lengthSq() > 1e-12) {
        this.#controls.target.add(delta);
        this.#camera.position.add(delta);
        this.#dirty = true;
      }
    } else {
      // 开始跟踪（或坐标系切换后）：平滑飞到目标
      this.flyTo(pos);
    }
    this.#followLast = pos;
  }

  #broken = new Set<string>();
  /** 显示器连续崩溃计数：达到阈值后禁用该显示器，其余照常渲染 */
  #displayErrors = new Map<string, number>();
  #disabledDisplays = new Set<string>();
  /** 显示器被禁用时上报（App 层提示用户） */
  onDisplayError?: (topic: string, message: string) => void;

  #render(): void {
    const broken = this.#broken;
    broken.clear();
    const time = this.#renderTime();

    for (const [topic, display] of this.#displays) {
      if (this.#disabledDisplays.has(topic)) continue;
      try {
        this.#placeDisplay(display, time, broken);
        this.#displayErrors.delete(topic);
      } catch (err) {
        display.root.visible = false;
        const count = (this.#displayErrors.get(topic) ?? 0) + 1;
        this.#displayErrors.set(topic, count);
        if (count === 1) console.error(`[scene] display error on ${topic}:`, err);
        if (count >= 5) {
          this.#disabledDisplays.add(topic);
          this.onDisplayError?.(
            topic,
            `渲染连续出错已禁用（其余显示器正常）: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }

    this.#tfAxes.tick(this.#tf, this.#fixedFrame, broken, time);
    this.#renderer.render(this.#scene, this.#camera);
  }

  #placeDisplay(display: Display, time: TimeSec, broken: Set<string>): void {
    if (display.tick) {
      display.root.visible = true;
      display.tick(this.#tf, this.#fixedFrame, time, broken);
      return;
    }
    const frame = display.frameId;
    if (!frame) {
      display.root.visible = false;
      return;
    }
    if (frame === this.#fixedFrame) {
      display.root.visible = true;
      display.root.position.set(0, 0, 0);
      display.root.quaternion.identity();
    } else {
      const tf = this.#tf.lookup(this.#fixedFrame, frame, time);
      if (!tf) {
        display.root.visible = false;
        broken.add(frame);
        return;
      }
      display.root.visible = true;
      display.root.position.set(tf.translation.x, tf.translation.y, tf.translation.z);
      display.root.quaternion.set(tf.rotation.x, tf.rotation.y, tf.rotation.z, tf.rotation.w);
    }
  }

  /** 地面网格：1m 次格 + 5m 主格，使用屏幕空间线宽保证不同 DPI 下可辨识。 */
  #buildGrid(): THREE.Object3D {
    const group = new THREE.Group();
    const make = (step: number, half: number, linewidth: number, opacity: number, minor: boolean) => {
      const positions: number[] = [];
      for (let v = -half; v <= half; v += step) {
        if (minor && v % 5 === 0) continue;
        positions.push(-half, v, 0, half, v, 0);
        positions.push(v, -half, 0, v, half, 0);
      }
      const geo = new LineSegmentsGeometry();
      geo.setPositions(positions);
      const mat = new LineMaterial({
        color: sceneColors().foreground,
        transparent: true,
        opacity,
        linewidth,
        depthWrite: false,
      });
      this.#gridMaterials.push(mat);
      const lines = new LineSegments2(geo, mat);
      lines.renderOrder = -1;
      return lines;
    };
    group.add(make(1, 25, 1.5, 0.14, true));
    group.add(make(5, 25, 2.25, 0.3, false));
    return group;
  }
}

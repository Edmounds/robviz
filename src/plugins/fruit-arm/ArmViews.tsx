import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { TfBuffer } from "../../core/TfBuffer";
import { SceneManager, type Display } from "../../renderers/SceneManager";
import type { MessagePayload } from "../../worker/protocol";
import type { ArmConfiguration, ArmPose, ArmPreview } from "./api";

type Target = [number, number, number, number];
const COLORS = { measured: "#52b8df", target: "#dfad52", playback: "#bb85e4" };

export function Arm2D({ config, measured, pose, valid, target, onChange, step, en }: {
  config: ArmConfiguration; measured: ArmPose | null; pose: ArmPose | null;
  target: Target; valid: boolean; onChange: (target: Target) => void; step: number; en: boolean;
}) {
  const dragging = useRef(false);
  const reach = config.geometry.a2 + config.geometry.a3 + config.geometry.a4 + Math.abs(config.geometry.tool_z_offset_m);
  const scale = Math.min(560 / (reach + 0.1), 320 / (reach * 2 + config.geometry.d1));
  const origin = { x: 50, y: 25 + (reach + config.geometry.d1) * scale };
  const project = (point: number[], yaw: number) => [origin.x + (point[0] * Math.cos(yaw) + point[1] * Math.sin(yaw)) * scale,
    origin.y - point[2] * scale];
  const r = Math.hypot(target[0], target[1]);
  const finiteTarget = target.every(Number.isFinite);
  const yaw = r > 1e-8 ? Math.atan2(target[1], target[0]) : 0;
  const move = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const radius = Math.max(0, (p.x - origin.x) / scale);
    onChange([radius * Math.cos(yaw), radius * Math.sin(yaw), (origin.y - p.y) / scale, target[3]]);
  };
  const stopDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    dragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const chain = (value: ArmPose | null, color: string, dashed = false) => value && <g>
    <polyline points={value.nodes.map((point) => project(point, value.model_rad[0]).join(",")).join(" ")}
      fill="none" stroke={color} strokeWidth={3} strokeDasharray={dashed ? "7 5" : undefined} />
    {value.nodes.map((point, i) => { const [cx, cy] = project(point, value.model_rad[0]);
      return <circle key={i} cx={cx} cy={cy} r={i === 5 ? 5 : 3} fill={color} />; })}
  </g>;
  return <div className="fruit-arm-2d">
    <svg viewBox="0 0 640 390" aria-label={en ? "Arm radial height editor" : "机械臂径向高度编辑器"}
      onPointerMove={move} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
      <line x1={origin.x} y1={15} x2={origin.x} y2={355} stroke="var(--border-strong)" />
      <line x1={origin.x} y1={origin.y} x2={615} y2={origin.y} stroke="var(--border-strong)" />
      {Array.from({ length: Math.floor(reach / 0.1) + 1 }, (_, i) => <g key={i}>
        <line x1={origin.x + i * 0.1 * scale} y1={15} x2={origin.x + i * 0.1 * scale} y2={355}
          stroke="var(--border-soft)" />
        <text x={origin.x + i * 0.1 * scale} y={375}>{(i * 0.1).toFixed(1)}</text>
      </g>)}
      <text x={600} y={375}>r / m</text><text x={10} y={20}>z / m</text>
      {chain(measured, COLORS.measured, true)}{chain(pose, COLORS.target)}
      {pose && [1, 3, 4].map((i) => {
        const [x, y] = project(pose.nodes[i], pose.model_rad[0]);
        return <text key={i} x={x + 8} y={y + (i === 4 ? 18 : -8)}>
          {i === 1 ? "d1" : i === 3 ? (en ? "wrist axis" : "腕轴") : (en ? "a4 end" : "a4 端点")}</text>;
      })}
      {finiteTarget && <g><circle cx={origin.x + r * scale} cy={origin.y - target[2] * scale} r={10}
        fill="var(--canvas)" stroke={valid ? COLORS.target : "#e05252"} strokeWidth={2}
        role="slider" tabIndex={0} aria-label={en ? "TCP radius, arrow keys adjust radius and height" : "真实TCP，方向键调整径向和高度"}
        aria-valuemin={0} aria-valuemax={reach} aria-valuenow={r}
        aria-invalid={!valid}
        aria-valuetext={`r=${r.toFixed(3)} m, z=${target[2].toFixed(3)} m`}
        onKeyDown={(event) => {
          const directions: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0],
            ArrowUp: [0, step], ArrowDown: [0, -step] };
          const offset = directions[event.key]; if (!offset) return;
          event.preventDefault();
          const radius = Math.max(0, r + offset[0]);
          onChange([radius * Math.cos(yaw), radius * Math.sin(yaw), target[2] + offset[1], target[3]]);
        }}
        onPointerDown={(event) => {
          dragging.current = true;
          event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId);
          event.preventDefault();
        }} />
      <text x={origin.x + r * scale + 15} y={origin.y - target[2] * scale}>TCP</text></g>}
    </svg>
    <small>{en ? "Each posture unfolds its own yaw plane. Drag TCP or use arrow keys. No motion." : "各姿态按各自 yaw 截面展开。拖 TCP 或用方向键，仅修改草稿。"}</small>
  </div>;
}

class ArmDisplay implements Display {
  readonly root = new THREE.Group();
  frameId = "arm_base_link";
  update(_payload: MessagePayload): void { /* Plugin provides validated pose data directly. */ }
  dispose(): void {
    this.root.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
      else mesh.material?.dispose();
    });
    this.root.clear();
  }
  setPoses(measured: ArmPose | null, target: ArmPose | null, playback: ArmPose | null, path: ArmPreview | null): void {
    this.dispose();
    const line = (points: number[][], color: string) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(...point)));
      this.root.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color })));
    };
    for (const [pose, color] of [[measured, COLORS.measured], [target, COLORS.target],
      [playback, COLORS.playback]] as const) {
      if (!pose) continue;
      line(pose.nodes, color);
      for (const point of pose.nodes) {
        const joint = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshBasicMaterial({ color }));
        joint.position.set(...point); this.root.add(joint);
      }
    }
    if (path) line(path.points.map((point) => point.tcp.slice(0, 3)), COLORS.playback);
  }
}

export function Arm3D({ measured, target, playback, path, active, fontScale, en }: {
  measured: ArmPose | null; target: ArmPose | null; playback: ArmPose | null;
  path: ArmPreview | null; active: boolean; fontScale: number; en: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<SceneManager | null>(null);
  const display = useRef<ArmDisplay | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!canvas.current) return;
    try {
      const manager = new SceneManager(canvas.current, new TfBuffer());
      const renderer = new ArmDisplay();
      manager.fixedFrame = "arm_base_link";
      manager.setGridVisible(false);
      manager.setCameraState({ position: [0.9, -1.1, 0.9], target: [0.15, 0, 0.25] });
      manager.addDisplay("fruit-arm", renderer);
      scene.current = manager; display.current = renderer;
      return () => { manager.dispose(); scene.current = null; display.current = null; };
    } catch (reason) { setError(String(reason)); }
  }, []);
  useEffect(() => {
    display.current?.setPoses(measured, target, playback, path);
    scene.current?.invalidate();
  }, [measured, target, playback, path]);
  useEffect(() => { scene.current?.setActive(active); }, [active]);
  useEffect(() => { scene.current?.setFontScale(fontScale); }, [fontScale]);
  return <div className="fruit-arm-3d">
    <canvas ref={canvas} aria-label={en ? "3D arm skeleton" : "机械臂三维连杆示意"} />
    {error && <span role="alert">{en ? "3D unavailable: " : "3D 不可用："}{error}</span>}
    <button className="fruit-arm-camera" onClick={() => scene.current?.setCameraState({ position: [0.9, -1.1, 0.9], target: [0.15, 0, 0.25] })}>
      {en ? "Reset view" : "复位视角"}</button>
  </div>;
}

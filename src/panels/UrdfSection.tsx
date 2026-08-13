/**
 * URDF：选择 .urdf + mesh 文件（可整个文件夹多选），模型挂 TF frame，
 * 关节由滑块或订阅 /joint_states 驱动（robot_viewer 模式）。
 */
import { useCallback, useEffect, useRef, useState } from "react";

import type { WorkerBridge } from "../bridge/WorkerBridge";
import type { UrdfJointInfo } from "../renderers/UrdfRenderer";
import { UrdfRenderer } from "../renderers/UrdfRenderer";
import type { SceneManager } from "../renderers/SceneManager";

const URDF_KEY = "__urdf__";

export function UrdfSection({
  bridge,
  scene,
  frames,
}: {
  bridge: WorkerBridge;
  scene: SceneManager;
  frames: string[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const rendererRef = useRef<UrdfRenderer>(null);
  const unsubRef = useRef<() => void>(null);

  const [robotName, setRobotName] = useState<string>();
  const [joints, setJoints] = useState<UrdfJointInfo[]>([]);
  const [attachFrame, setAttachFrame] = useState("base_link");
  const [followTopic, setFollowTopic] = useState(false);
  const [error, setError] = useState<string>();

  // addDisplay 复用同 key 时会 dispose 旧实例 —— 每次加载 new 一个渲染器
  const openFiles = useCallback(
    async (files: FileList) => {
      unsubRef.current?.();
      unsubRef.current = null;
      setFollowTopic(false);
      const renderer = new UrdfRenderer();
      rendererRef.current = renderer;
      setError(undefined);
      try {
        const info = await renderer.load([...files]);
        renderer.frameId = attachFrame;
        scene.addDisplay(URDF_KEY, renderer);
        setRobotName(info.robotName);
        setJoints(info.joints);
        scene.invalidate();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setRobotName(undefined);
        setJoints([]);
      }
    },
    [scene, attachFrame],
  );

  const close = useCallback(() => {
    unsubRef.current?.();
    unsubRef.current = null;
    scene.removeDisplay(URDF_KEY);
    rendererRef.current = null;
    setRobotName(undefined);
    setJoints([]);
    setFollowTopic(false);
  }, [scene]);

  useEffect(() => {
    const r = rendererRef.current;
    if (r) {
      r.frameId = attachFrame;
      scene.invalidate();
    }
  }, [attachFrame, scene]);

  const toggleFollow = useCallback(() => {
    const next = !followTopic;
    setFollowTopic(next);
    if (next) {
      unsubRef.current = bridge.subscribe("/joint_states", (payload) => {
        if (payload.kind !== "raw") return;
        const msg = payload.message as { name: string[]; position: Float64Array | number[] };
        const values: Record<string, number> = {};
        for (let i = 0; i < msg.name.length; i++) values[msg.name[i]] = Number(msg.position[i]);
        rendererRef.current?.setJointValues(values);
        scene.invalidate();
      });
    } else {
      unsubRef.current?.();
      unsubRef.current = null;
    }
  }, [followTopic, bridge, scene]);

  const setJoint = useCallback(
    (name: string, value: number) => {
      rendererRef.current?.setJoint(name, value);
      setJoints((prev) => prev.map((j) => (j.name === name ? { ...j, value } : j)));
      scene.invalidate();
    },
    [scene],
  );

  useEffect(() => () => unsubRef.current?.(), []);

  return (
    <div className="side-section">
      <h2>URDF 模型</h2>
      <div className="side-row">
        <button onClick={() => fileRef.current?.click()}>
          {robotName ? "重新加载" : "加载 URDF + mesh"}
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files?.length) void openFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {robotName && <button onClick={close}>卸载</button>}
      </div>
      {error && <p className="error-line">{error}</p>}
      {robotName && (
        <>
          <div className="side-row">
            <span className="side-label">{robotName}</span>
            <label className="field">
              挂载
              <select value={attachFrame} onChange={(e) => setAttachFrame(e.target.value)}>
                {(frames.length > 0 ? frames : [attachFrame]).map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="sub-option">
            <input type="checkbox" checked={followTopic} onChange={toggleFollow} />
            跟随 /joint_states
          </label>
          {!followTopic && joints.length > 0 && (
            <div className="joint-sliders">
              {joints.map((j) => (
                <label key={j.name} className="joint-slider">
                  <span>
                    {j.name} <em>{j.value.toFixed(2)}</em>
                  </span>
                  <input
                    type="range"
                    min={j.lower}
                    max={j.upper}
                    step={0.01}
                    value={j.value}
                    onChange={(e) => setJoint(j.name, Number(e.target.value))}
                  />
                </label>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

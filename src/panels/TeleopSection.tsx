/**
 * Teleop：键盘（WASD/方向键）+ 按钮发 cmd_vel。
 * 启用时 10Hz 持续发布（机器人端超时保护依赖持续流）。
 */
import { useCallback, useEffect, useRef, useState } from "react";

import type { WorkerBridge } from "../bridge/WorkerBridge";
import { useI18n } from "../app/i18n";

export function TeleopSection({ bridge }: { bridge: WorkerBridge }) {
  const { t } = useI18n();
  const [enabled, setEnabled] = useState(false);
  const [topic, setTopic] = useState("/cmd_vel");
  const [maxLin, setMaxLin] = useState(0.5);
  const [maxAng, setMaxAng] = useState(1.0);
  const [active, setActive] = useState({ lin: 0, ang: 0 });
  const cmdRef = useRef({ lin: 0, ang: 0 });
  const keysRef = useRef(new Set<string>());

  const compute = useCallback(() => {
    const keys = keysRef.current;
    let lin = 0;
    let ang = 0;
    if (keys.has("w") || keys.has("arrowup")) lin += 1;
    if (keys.has("s") || keys.has("arrowdown")) lin -= 1;
    if (keys.has("a") || keys.has("arrowleft")) ang += 1;
    if (keys.has("d") || keys.has("arrowright")) ang -= 1;
    cmdRef.current = { lin, ang };
    setActive({ lin, ang });
  }, []);

  useEffect(() => {
    if (!enabled) {
      keysRef.current.clear();
      cmdRef.current = { lin: 0, ang: 0 };
      setActive({ lin: 0, ang: 0 });
      return;
    }
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        e.preventDefault();
        keysRef.current.add(k);
        compute();
      }
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
      compute();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    // 10Hz 持续发布
    const timer = setInterval(() => {
      const { lin, ang } = cmdRef.current;
      bridge.publish(topic, "geometry_msgs/msg/Twist", {
        linear: { x: lin * maxLin, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: ang * maxAng },
      });
    }, 100);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      clearInterval(timer);
      // 退出时发一帧零速
      bridge.publish(topic, "geometry_msgs/msg/Twist", {
        linear: { x: 0, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: 0 },
      });
    };
  }, [enabled, topic, maxLin, maxAng, bridge, compute]);

  const hold = (lin: number, ang: number) => ({
    onPointerDown: () => {
      cmdRef.current = { lin, ang };
      setActive({ lin, ang });
    },
    onPointerUp: () => {
      cmdRef.current = { lin: 0, ang: 0 };
      setActive({ lin: 0, ang: 0 });
    },
    onPointerLeave: () => {
      cmdRef.current = { lin: 0, ang: 0 };
      setActive({ lin: 0, ang: 0 });
    },
  });

  return (
    <div className="side-section">
      <h2>{t("teleopTitle")}</h2>
      <div className="side-row">
        <input
          className="topic-input"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          spellCheck={false}
        />
        <button className={`toggle ${enabled ? "on" : ""}`} onClick={() => setEnabled(!enabled)}>
          {enabled ? t("enabled") : t("enable")}
        </button>
      </div>
      {enabled && (
        <>
          <div className="teleop-pad">
            <span />
            <button className={active.lin > 0 ? "active" : ""} {...hold(1, 0)}>
              ▲
            </button>
            <span />
            <button className={active.ang > 0 ? "active" : ""} {...hold(0, 1)}>
              ◀
            </button>
            <button className={active.lin < 0 ? "active" : ""} {...hold(-1, 0)}>
              ▼
            </button>
            <button className={active.ang < 0 ? "active" : ""} {...hold(0, -1)}>
              ▶
            </button>
          </div>
          <div className="side-row slider-row">
            <label>
              {t("linearSpeed")} {maxLin.toFixed(1)} m/s
              <input
                type="range"
                min={0.1}
                max={2}
                step={0.1}
                value={maxLin}
                onChange={(e) => setMaxLin(Number(e.target.value))}
              />
            </label>
            <label>
              {t("angularSpeed")} {maxAng.toFixed(1)} rad/s
              <input
                type="range"
                min={0.2}
                max={3}
                step={0.1}
                value={maxAng}
                onChange={(e) => setMaxAng(Number(e.target.value))}
              />
            </label>
          </div>
          <p className="side-hint">{t("wasdHint")}</p>
        </>
      )}
    </div>
  );
}

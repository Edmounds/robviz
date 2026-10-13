/**
 * 随包插件：遥控 (Teleop)。
 * 键盘（WASD / 方向键）或界面按键发布 Twist 速度指令。
 * 生命周期契约：
 * - 仅在会话处于活动前台且连接为 open 时允许启用；
 * - 标签失活或断线时自动暂停并重置状态，返回后需显式重新启用；
 * - 用户显式点击关闭时向机器人尽力发送一帧零速；切标签或清理时不发送。
 */
import { useCallback, useEffect, useRef, useState } from "react";

import type { PluginContext, PluginSectionProps, RobvizPlugin } from "../types";
import { TextInput, validateInputs } from "../../app/EditableInput";

type TeleopPluginState = {
  topic: string;
  maxLin: number;
  maxAng: number;
};

const DEFAULT_TELEOP_STATE: TeleopPluginState = {
  topic: "/cmd_vel",
  maxLin: 0.5,
  maxAng: 1,
};

export function canTeleopWrite(active: boolean, connectionState: PluginContext["connectionState"]): boolean {
  return active && connectionState === "open";
}

export function readTeleopState(raw: unknown): TeleopPluginState {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_TELEOP_STATE };
  const value = raw as Partial<TeleopPluginState>;
  return {
    topic: typeof value.topic === "string" && value.topic.trim() ? value.topic.trim() : DEFAULT_TELEOP_STATE.topic,
    maxLin: typeof value.maxLin === "number" && Number.isFinite(value.maxLin) && value.maxLin >= 0.1 && value.maxLin <= 2 ? value.maxLin : DEFAULT_TELEOP_STATE.maxLin,
    maxAng: typeof value.maxAng === "number" && Number.isFinite(value.maxAng) && value.maxAng >= 0.2 && value.maxAng <= 3 ? value.maxAng : DEFAULT_TELEOP_STATE.maxAng,
  };
}

export function TeleopSection({ ctx }: PluginSectionProps) {
  const { bridge, active: sessionActive, connectionState, locale } = ctx;
  const isEn = locale === "en";
  const stored = readTeleopState(ctx.pluginStates.teleop);

  const [enabled, setEnabled] = useState(false);
  const [topic, setTopic] = useState(stored.topic);
  const [maxLin, setMaxLin] = useState(stored.maxLin);
  const [maxAng, setMaxAng] = useState(stored.maxAng);
  const [active, setActive] = useState({ lin: 0, ang: 0 });
  const topicFields = useRef<HTMLDivElement>(null);
  const commandTopic = topic.trim() || stored.topic;

  const cmdRef = useRef({ lin: 0, ang: 0 });
  const keysRef = useRef(new Set<string>());
  const sessionActiveRef = useRef(sessionActive);
  const connectionStateRef = useRef(connectionState);
  sessionActiveRef.current = sessionActive;
  connectionStateRef.current = connectionState;

  useEffect(() => setTopic(stored.topic), [stored.topic]);
  useEffect(() => setMaxLin(stored.maxLin), [stored.maxLin]);
  useEffect(() => setMaxAng(stored.maxAng), [stored.maxAng]);

  const persist = useCallback((next: Partial<TeleopPluginState>) => {
    ctx.onPluginStateChange("teleop", { ...readTeleopState(ctx.pluginStates.teleop), ...next });
  }, [ctx]);

  const clearHeldState = useCallback(() => {
    keysRef.current.clear();
    cmdRef.current = { lin: 0, ang: 0 };
    setActive({ lin: 0, ang: 0 });
  }, []);

  // 当会话失活或断线时，立即自动关闭并清空输入状态；切回后需显式重新启用
  useEffect(() => {
    if (!canTeleopWrite(sessionActive, connectionState)) {
      if (enabled) {
        setEnabled(false);
        clearHeldState();
      }
    }
  }, [sessionActive, connectionState, enabled, clearHeldState]);

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

  // 显式切换启用状态
  const toggleEnabled = useCallback(() => {
    if (!enabled) {
      if (!validateInputs(topicFields.current)) return;
      if (!canTeleopWrite(sessionActive, connectionState)) return;
      setEnabled(true);
    } else {
      setEnabled(false);
      clearHeldState();
      // 用户主动停用且当前处于活跃在线状态时，尽力发送一帧零速
      if (canTeleopWrite(sessionActive, connectionState)) {
        try {
          bridge.publish(commandTopic, "geometry_msgs/msg/Twist", {
            linear: { x: 0, y: 0, z: 0 },
            angular: { x: 0, y: 0, z: 0 },
          });
        } catch {
          /* 忽略网络发送错误 */
        }
      }
    }
  }, [enabled, connectionState, sessionActive, clearHeldState, bridge, commandTopic]);

  useEffect(() => {
    if (!enabled || !canTeleopWrite(sessionActive, connectionState)) {
      clearHeldState();
      return;
    }

    const down = (e: KeyboardEvent) => {
      if (!canTeleopWrite(sessionActiveRef.current, connectionStateRef.current)) return;
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
      if (!canTeleopWrite(sessionActiveRef.current, connectionStateRef.current)) return;
      keysRef.current.delete(e.key.toLowerCase());
      compute();
    };

    const handleBlur = () => {
      clearHeldState();
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", handleBlur);

    const timer = setInterval(() => {
      if (!canTeleopWrite(sessionActiveRef.current, connectionStateRef.current)) return;
      const { lin, ang } = cmdRef.current;
      try {
        bridge.publish(commandTopic, "geometry_msgs/msg/Twist", {
          linear: { x: lin * maxLin, y: 0, z: 0 },
          angular: { x: 0, y: 0, z: ang * maxAng },
        });
      } catch {
        /* 忽略单次发送错误 */
      }
    }, 100);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", handleBlur);
      clearInterval(timer);
    };
  }, [enabled, sessionActive, connectionState, commandTopic, maxLin, maxAng, bridge, compute, clearHeldState]);

  const hold = (lin: number, ang: number) => ({
    onPointerDown: () => {
      if (!enabled || !sessionActiveRef.current || connectionStateRef.current !== "open") return;
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
    onPointerCancel: () => {
      cmdRef.current = { lin: 0, ang: 0 };
      setActive({ lin: 0, ang: 0 });
    },
  });

  return (
    <>
      <div className="side-row" ref={topicFields}>
        <TextInput
          className="topic-input"
          aria-label={isEn ? "Command topic" : "控制话题"}
          value={topic}
          onChange={(e) => {
            const next = e.target.value;
            setTopic(next);
            if (next.trim()) persist({ topic: next });
          }}
          spellCheck={false}
          required
        />
        <button
          className={`toggle ${enabled ? "on" : ""}`}
          disabled={connectionState !== "open"}
          onClick={toggleEnabled}
        >
          {enabled ? (isEn ? "Enabled" : "已启用") : (isEn ? "Enable" : "启用")}
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
          <div className="side-row">
            <span className="side-label">{isEn ? "Linear speed" : "线速"}</span>
            <input
              type="range"
              min={0.1}
              max={2.0}
              step={0.1}
              value={maxLin}
              onChange={(e) => {
                const next = Number(e.target.value);
                setMaxLin(next);
                persist({ maxLin: next });
              }}
            />
            <span className="side-val">{maxLin.toFixed(1)} m/s</span>
          </div>
          <div className="side-row">
            <span className="side-label">{isEn ? "Angular speed" : "角速"}</span>
            <input
              type="range"
              min={0.2}
              max={3.0}
              step={0.2}
              value={maxAng}
              onChange={(e) => {
                const next = Number(e.target.value);
                setMaxAng(next);
                persist({ maxAng: next });
              }}
            />
            <span className="side-val">{maxAng.toFixed(1)} rad/s</span>
          </div>
          <div className="teleop-hint">
            {isEn ? "WASD / arrow keys, or hold a direction button" : "WASD / 方向键，或按住方向按钮"}
          </div>
        </>
      )}
    </>
  );
}

const plugin: RobvizPlugin = {
  id: "teleop",
  name: "遥控 (Teleop)",
  sections: [
    {
      id: "teleop",
      title: "遥控 Teleop",
      component: TeleopSection,
    },
  ],
};

export default plugin;

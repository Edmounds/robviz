/**
 * 随包插件：导航目标与初始位姿 (Nav Goals)。
 * 提供 3D 视口导航点选交互（Navigation Goal 与 Initial Pose），话题支持自定义配置。
 */
import { useEffect, useState } from "react";

import type { PluginContext, PluginSectionProps, RobvizPlugin, ViewportPoseInteraction } from "../types";
import { TextInput } from "../../app/EditableInput";

const DEFAULT_NAV_TOPICS = {
  goalTopic: "/goal_pose",
  initialPoseTopic: "/initialpose",
} as const;

type NavPluginState = {
  goalTopic: string;
  initialPoseTopic: string;
};

export function readNavPluginState(raw: unknown): NavPluginState {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_NAV_TOPICS };
  const value = raw as Partial<NavPluginState>;
  return {
    goalTopic: typeof value.goalTopic === "string" && value.goalTopic.trim() ? value.goalTopic.trim() : DEFAULT_NAV_TOPICS.goalTopic,
    initialPoseTopic: typeof value.initialPoseTopic === "string" && value.initialPoseTopic.trim() ? value.initialPoseTopic.trim() : DEFAULT_NAV_TOPICS.initialPoseTopic,
  };
}

function yawQuat(yaw: number): { x: number; y: number; z: number; w: number } {
  const half = yaw / 2;
  return { x: 0, y: 0, z: Math.sin(half), w: Math.cos(half) };
}

export function handleGoalPose(ctx: PluginContext, interaction: ViewportPoseInteraction): void {
  if (!ctx.active || ctx.connectionState !== "open") return;
  const now = Date.now() / 1000;
  const header = {
    stamp: { sec: Math.floor(now), nanosec: Math.round((now % 1) * 1e9) },
    frame_id: ctx.fixedFrame,
  };
  const pose = {
    position: interaction.position,
    orientation: yawQuat(interaction.yaw),
  };
  try {
    ctx.bridge.publish(readNavPluginState(ctx.pluginStates["nav-goals"]).goalTopic, "geometry_msgs/msg/PoseStamped", { header, pose });
  } catch (err) {
    console.error("[nav-goals] publish goal failed:", err);
  }
}

export function handleInitialPose(ctx: PluginContext, interaction: ViewportPoseInteraction): void {
  if (!ctx.active || ctx.connectionState !== "open") return;
  const now = Date.now() / 1000;
  const header = {
    stamp: { sec: Math.floor(now), nanosec: Math.round((now % 1) * 1e9) },
    frame_id: ctx.fixedFrame,
  };
  const pose = {
    position: interaction.position,
    orientation: yawQuat(interaction.yaw),
  };
  const covariance = new Array<number>(36).fill(0);
  covariance[0] = 0.25;
  covariance[7] = 0.25;
  covariance[35] = 0.068;
  try {
    ctx.bridge.publish(readNavPluginState(ctx.pluginStates["nav-goals"]).initialPoseTopic, "geometry_msgs/msg/PoseWithCovarianceStamped", {
      header,
      pose: { pose, covariance },
    });
  } catch (err) {
    console.error("[nav-goals] publish initialpose failed:", err);
  }
}

function NavConfigSection({ ctx }: PluginSectionProps) {
  const isEn = ctx.locale === "en";
  const stored = readNavPluginState(ctx.pluginStates["nav-goals"]);
  const [goalTopic, setGoalTopic] = useState(stored.goalTopic);
  const [initialPoseTopic, setInitialPoseTopic] = useState(stored.initialPoseTopic);

  useEffect(() => setGoalTopic(stored.goalTopic), [stored.goalTopic]);
  useEffect(() => setInitialPoseTopic(stored.initialPoseTopic), [stored.initialPoseTopic]);

  const updateGoal = (val: string) => {
    setGoalTopic(val);
    if (!val.trim()) return;
    const next = { ...readNavPluginState(ctx.pluginStates["nav-goals"]), goalTopic: val.trim() || DEFAULT_NAV_TOPICS.goalTopic };
    ctx.onPluginStateChange("nav-goals", next);
  };

  const updateInitialPose = (val: string) => {
    setInitialPoseTopic(val);
    if (!val.trim()) return;
    const next = { ...readNavPluginState(ctx.pluginStates["nav-goals"]), initialPoseTopic: val.trim() || DEFAULT_NAV_TOPICS.initialPoseTopic };
    ctx.onPluginStateChange("nav-goals", next);
  };

  return (
    <>
      <div className="side-row">
        <span className="side-label">{isEn ? "Goal Topic" : "目标话题"}</span>
        <TextInput
          className="topic-input"
          aria-label={isEn ? "Goal Topic" : "目标话题"}
          value={goalTopic}
          onChange={(e) => updateGoal(e.target.value)}
          spellCheck={false}
          required
        />
      </div>
      <div className="side-row">
        <span className="side-label">{isEn ? "Initial Pose Topic" : "初始位姿话题"}</span>
        <TextInput
          className="topic-input"
          aria-label={isEn ? "Initial Pose Topic" : "初始位姿话题"}
          value={initialPoseTopic}
          onChange={(e) => updateInitialPose(e.target.value)}
          spellCheck={false}
          required
        />
      </div>
    </>
  );
}

const plugin: RobvizPlugin = {
  id: "nav-goals",
  name: "导航位姿工具 (Nav Goals)",
  sections: [
    {
      id: "config",
      title: "导航话题设置",
      component: NavConfigSection,
    },
  ],
  viewportTools: [
    {
      id: "goal",
      title: (ctx) => (ctx.locale === "en" ? "Navigation Goal" : "导航目标"),
      hint: (ctx) =>
        ctx.locale === "en"
          ? "Click to set position, drag to set heading"
          : "点击确定位置，拖拽确定航向",
      onPoseSelect: handleGoalPose,
    },
    {
      id: "initialpose",
      title: (ctx) => (ctx.locale === "en" ? "Initial Pose" : "初始位姿"),
      hint: (ctx) =>
        ctx.locale === "en"
          ? "Click to set position, drag to set heading"
          : "点击确定位置，拖拽确定航向",
      onPoseSelect: handleInitialPose,
    },
  ],
};

export default plugin;

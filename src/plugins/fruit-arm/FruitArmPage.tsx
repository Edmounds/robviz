import { useCallback, useEffect, useRef, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { z } from "zod";

import type { PluginPageProps } from "../types";
import { NumberInput, validateInputs } from "../../app/EditableInput";
import { armRequest, runtimeRequest, runtimeTaskReplySchema, runtimeTaskSchema,
  configurationReplySchema, documentSchema, draftsSchema, fmt, hasValidFeedback, poseSchema,
  presetsSchema, resultSchema, same, snapshotSchema, telemetrySchema } from "./api";
import type { ArmDocument, ArmPose, RuntimeTask, ControlMode, CoordinateFrame,
  Presets, Snapshot, Telemetry, Waypoint } from "./api";
import "./fruit-arm.css";

type Target = [number, number, number, number];
type LoadedSnapshot = Snapshot & { config_path: string; max_trajectory_points: number };
type Layout = {
  main: { presets: number; control: number; status: number };
  control: { direct: number; jog: number };
  status: { telemetry: number; debug: number };
};

const ROOT = "/arm_planner_node/";
const DEFAULT_LAYOUT: Layout = {
  main: { presets: 30, control: 40, status: 30 },
  control: { direct: 58, jog: 42 },
  status: { telemetry: 65, debug: 35 },
};
const layoutSchema = z.object({
  main: z.object({ presets: z.number().finite().gt(0).lte(100), control: z.number().finite().gt(0).lte(100), status: z.number().finite().gt(0).lte(100) }),
  control: z.object({ direct: z.number().finite().gt(0).lte(100), jog: z.number().finite().gt(0).lte(100) }),
  status: z.object({ telemetry: z.number().finite().gt(0).lte(100), debug: z.number().finite().gt(0).lte(100) }),
});
const storedSchema = z.object({
  baseVersion: z.string(),
  presets: draftsSchema,
  selected: z.string(),
  pointIndex: z.number().int().nonnegative().optional(),
  step: z.number().positive().max(0.1).optional(),
  pitchStep: z.number().positive().max(30).optional(),
  jointJogStep: z.number().positive().min(0.1).max(30).optional(),
  controlMode: z.enum(["cartesian", "joints"]).optional(),
  expandedPresets: z.array(z.string()).optional(),
  layout: layoutSchema.optional(),
});

function NumberField({ label, value, onChange, min, max, required = true, step = "any" }: {
  label: string; value: number | undefined; onChange: (value: number | undefined) => void;
  min?: number; max?: number; step?: number | "any"; required?: boolean;
}) {
  return <label className="fruit-arm-number"><span>{label}</span><NumberInput min={min} max={max} step={step} required={required}
    value={value} onValueChange={onChange} onInvalidValue={() => onChange(NaN)} /></label>;
}

function layoutValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 100 ? value : fallback;
}

function readLayout(value: unknown): Layout {
  const parsed = layoutSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  return DEFAULT_LAYOUT;
}

function mapPanelLayout(value: Record<string, number>, keys: string[], fallback: Record<string, number>): Record<string, number> {
  return Object.fromEntries(keys.map((key) => [key, layoutValue(value[key], fallback[key])]));
}

export default function FruitArmPage({ ctx, bridgeUrl, isMobile }: PluginPageProps) {
  const en = ctx.locale === "en";
  const tr = (cn: string, english: string) => en ? english : cn;
  const url = bridgeUrl ?? ctx.bridge.url;
  const runtimeBaseUrl = ctx.getServiceUrl("runtime");
  const connected = ctx.active && ctx.connectionState === "open";
  const [file, setFile] = useState<ArmDocument | null>(null);
  const [memory, setMemory] = useState<LoadedSnapshot | null>(null);
  const [draft, setDraft] = useState<Presets>({});
  const [baseVersion, setBaseVersion] = useState("");
  const [selected, setSelected] = useState("");
  const [pointIndex, setPointIndex] = useState(0);
  const [history, setHistory] = useState<Presets[]>([]);
  const [controlMode, setControlMode] = useState<ControlMode>("cartesian");
  const [target, setTarget] = useState<Target>([0, 0, 0, 0]);
  const [duration, setDuration] = useState(0);
  const [gripper, setGripper] = useState(0);
  const [linear, setLinear] = useState(false);
  const [poseResult, setPoseResult] = useState<{ pose: ArmPose; key: string } | null>(null);
  const [poseError, setPoseError] = useState("");
  const [measuredResult, setMeasuredResult] = useState<{ pose: ArmPose; key: string } | null>(null);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [jog, setJog] = useState(false);
  const [step, setStep] = useState(0.01);
  const [pitchStep, setPitchStep] = useState(5);
  const [jointJogStep, setJointJogStep] = useState(5);
  const [expandedPresets, setExpandedPresets] = useState<string[]>([]);
  const [layout, setLayout] = useState<Layout>(DEFAULT_LAYOUT);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [level, setLevel] = useState<"info" | "debug" | "trace">("info");
  const [runtime, setRuntime] = useState<RuntimeTask | null>(null);
  const [runtimeStarting, setRuntimeStarting] = useState(false);
  const [runtimeError, setRuntimeError] = useState("");
  const generation = useRef(0);
  const mounted = useRef(false);
  const presetFields = useRef<HTMLElement>(null);
  const controlFields = useRef<HTMLElement>(null);
  const jogFields = useRef<HTMLElement>(null);
  const jogTarget = useRef<Target | null>(null);
  const jogDirty = useRef(false);
  const pendingGripper = useRef<number | null>(null);
  const pending = useRef<{ kind: string; sent: boolean; cancelled: boolean } | null>(null);
  const draggedWaypoint = useRef<{ name: string; index: number } | null>(null);
  const latest = useRef({ ctx, enabled, jog, telemetry, memory, target, controlMode, step, pitchStep, jointJogStep });
  latest.current = { ctx, enabled, jog, telemetry, memory, target, controlMode, step, pitchStep, jointJogStep };

  const config = memory?.configuration ?? file?.configuration ?? null;
  const feedbackValid = connected && hasValidFeedback(telemetry, memory?.configuration ?? null);
  const measuredKey = memory && telemetry ? JSON.stringify([memory.revision, telemetry.model_joint_state.position]) : "";
  const measured = feedbackValid && measuredResult?.key === measuredKey ? measuredResult.pose : null;
  const dirty = !!file && !same(draft, file.configuration.presets);
  const validDraft = presetsSchema.safeParse(draft).success;
  const applied = !!file && !!memory && file.file === memory.config_path && file.presets_revision === memory.presets_revision;
  const poseKey = JSON.stringify([memory?.revision ?? file?.revision, controlMode, target]);
  const pose = poseResult?.key === poseKey ? poseResult.pose : null;
  const canMove = enabled && feedbackValid && !!memory && !busy;
  const selectedPreset = draft[selected];

  const log = useCallback((message: string) => {
    if (mounted.current) setEvents((old) => [...old.slice(-199), `${new Date().toISOString()} ${message}`]);
  }, []);

  const persist = useCallback((presets: Presets, version: string, name = selected, index = pointIndex, overrides?: {
    layout?: Layout; step?: number; pitchStep?: number; jointJogStep?: number;
    controlMode?: ControlMode; expandedPresets?: string[];
  }) => {
    if (!draftsSchema.safeParse(presets).success) return;
    ctx.onPluginStateChange("fruit-arm", {
      presets,
      baseVersion: version,
      selected: name,
      pointIndex: index,
      step: overrides?.step ?? step,
      pitchStep: overrides?.pitchStep ?? pitchStep,
      jointJogStep: overrides?.jointJogStep ?? jointJogStep,
      controlMode: overrides?.controlMode ?? controlMode,
      expandedPresets: overrides?.expandedPresets ?? expandedPresets,
      layout: overrides?.layout ?? layout,
    });
  }, [ctx, controlMode, expandedPresets, jointJogStep, layout, pitchStep, pointIndex, selected, step]);

  const edit = useCallback((next: Presets, name = selected, index = pointIndex) => {
    setHistory((old) => [...old.slice(-39), structuredClone(draft)]);
    setDraft(next); setSelected(name); setPointIndex(index); persist(next, baseVersion, name, index);
  }, [baseVersion, draft, persist, pointIndex, selected]);

  const readMemory = async (signal?: AbortSignal): Promise<LoadedSnapshot> => {
    const response = configurationReplySchema.parse(await ctx.bridge.callService(ROOT + "get_configuration", {}));
    if (!response.success) throw new Error(response.message);
    const snapshot = snapshotSchema.parse(await armRequest("pose", url, { configuration: response.configuration_yaml }, "POST", signal));
    if (snapshot.revision !== response.revision) throw new Error("Configuration snapshot revision mismatch");
    return { ...snapshot, config_path: response.config_path, max_trajectory_points: response.max_trajectory_points };
  };

  useEffect(() => {
    mounted.current = true;
    const current = ++generation.current;
    const controller = new AbortController();
    setEnabled(false); setJog(false); setMemory(null); setFile(null); setTelemetry(null); setMeasuredResult(null);
    setPoseResult(null); setPoseError(""); setHistory([]); setBusy(false); setEvents([]);
    setRuntime(null); setRuntimeStarting(false); setRuntimeError("");
    const stored = storedSchema.safeParse(ctx.pluginStates["fruit-arm"]);
    runtimeRequest("tasks/arm", runtimeBaseUrl, undefined, "GET", controller.signal).then((value) => {
      if (generation.current !== current) return;
      setRuntime(runtimeTaskSchema.parse(value));
    }).catch((error) => { if (!controller.signal.aborted) log(String(error)); });
    armRequest("document", url, undefined, "GET", controller.signal).then((value) => {
      if (generation.current !== current) return;
      const doc = documentSchema.parse(value);
      setFile(doc);
      const presets = stored.success ? stored.data.presets : doc.configuration.presets;
      const name = stored.success && presets[stored.data.selected] ? stored.data.selected : Object.keys(presets)[0] ?? "";
      const index = Math.min(stored.success ? stored.data.pointIndex ?? 0 : 0, Math.max(0, (presets[name]?.waypoints.length ?? 0) - 1));
      const restoredLayout = stored.success ? readLayout(stored.data.layout) : DEFAULT_LAYOUT;
      setDraft(presets); setBaseVersion(stored.success ? stored.data.baseVersion : doc.version); setSelected(name); setPointIndex(index);
      setStep(stored.success ? stored.data.step ?? 0.01 : 0.01);
      setPitchStep(stored.success ? stored.data.pitchStep ?? 5 : 5);
      setJointJogStep(stored.success ? stored.data.jointJogStep ?? 5 : 5);
      setControlMode(stored.success ? stored.data.controlMode ?? "cartesian" : "cartesian");
      setExpandedPresets(stored.success ? (stored.data.expandedPresets ?? [name]).filter((item) => !!presets[item]) : name ? [name] : []);
      setLayout(restoredLayout);
      if (presets[name]?.waypoints[index]) {
        const point = presets[name].waypoints[index];
        if (presets[name].coordinate_frame === "cartesian" || presets[name].coordinate_frame === "joints") {
          setControlMode(presets[name].coordinate_frame); setTarget(point.target.slice(0, 4) as Target);
        }
        setDuration(point.duration_ms); setGripper(point.gripper ?? 0); setLinear(point.linear ?? false);
      }
    }).catch((error) => { if (!controller.signal.aborted) log(String(error)); });
    return () => {
      const command = pending.current;
      if (command?.kind === "jog" && command.sent && ctx.bridge.state === "open" && ctx.bridge.url === url) {
        ctx.bridge.callService(ROOT + "stop", {}).catch((error) => console.error("Arm jog cleanup STOP failed", error));
      }
      if (command) command.cancelled = true;
      pending.current = null;
      jogDirty.current = false; jogTarget.current = null; pendingGripper.current = null;
      controller.abort(); mounted.current = false; generation.current = current + 1;
    };
    // Machine identity changes restore only that machine's draft, never control state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.bridge, url, log]);

  useEffect(() => {
    if (!connected) { setEnabled(false); setJog(false); setTelemetry(null); setMeasuredResult(null); setMemory(null);
      jogDirty.current = false; jogTarget.current = null; pendingGripper.current = null; return; }
    const current = generation.current;
    const controller = new AbortController();
    readMemory(controller.signal).then((snapshot) => {
      if (current === generation.current && !controller.signal.aborted) setMemory(snapshot);
    }).catch((error) => { if (!controller.signal.aborted) log(String(error)); });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, ctx.bridge, url]);

  useEffect(() => {
    if (!connected) return;
    const clear = () => { setTelemetry(null); setMeasuredResult(null); };
    const off = ctx.bridge.subscribe(ROOT + "joint_states", (payload, schema) => {
      if (schema !== "fruit_interfaces/msg/ArmTelemetry" || payload.kind !== "raw") { clear(); return; }
      const parsed = telemetrySchema.safeParse(payload.message);
      if (!parsed.success) { clear(); return; }
      setTelemetry(parsed.data);
    }, { maxFrequency: 10 });
    const offStatus = ctx.bridge.subscribe("/fruit_hardware_bridge/arm/status", (payload) => {
      if (payload.kind !== "raw" || !payload.message || typeof payload.message !== "object") return;
      const raw = payload.message as Record<string, unknown>;
      const positions = [raw.joint_1, raw.joint_2, raw.joint_3, raw.joint_4];
      const cfg = latest.current.memory?.configuration;
      if (!positions.every((value, i) => {
        if (typeof value !== "number" || !Number.isFinite(value)) return false;
        const limits = cfg?.joint_mapping[(['q1', 'q2', 'q3', 'q4'] as const)[i]].limits_deg;
        const degrees = value * 180 / Math.PI;
        return !limits || (degrees >= limits[0] - 0.006 && degrees <= limits[1] + 0.006);
      })) clear();
    }, { maxFrequency: 10 });
    return () => { off(); offStatus(); };
  }, [connected, ctx.bridge]);

  useEffect(() => {
    if (!config || !target.every(Number.isFinite)) { setPoseResult(null); setPoseError(""); return; }
    const controller = new AbortController();
    const key = poseKey;
    const timer = setTimeout(() => {
      armRequest("pose", url, { configuration: config, frame: controlMode, target }, "POST", controller.signal).then((value) => {
        if (controller.signal.aborted) return;
        const response = snapshotSchema.extend({ pose: poseSchema }).parse(value);
        setPoseResult({ pose: response.pose, key }); setPoseError("");
      }).catch((error) => { if (!controller.signal.aborted) { setPoseResult(null); setPoseError(String(error)); } });
    }, 100);
    return () => { clearTimeout(timer); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poseKey, url]);

  useEffect(() => {
    if (!telemetry || !memory || !feedbackValid) { setMeasuredResult(null); return; }
    const controller = new AbortController();
    const key = measuredKey;
    armRequest("pose", url, { configuration: memory.configuration, frame: "model_joints",
      target: telemetry.model_joint_state.position }, "POST", controller.signal).then((value) => {
      if (!controller.signal.aborted) setMeasuredResult({ pose: snapshotSchema.extend({ pose: poseSchema }).parse(value).pose, key });
    }).catch((error) => { if (!controller.signal.aborted) { setMeasuredResult(null); log(String(error)); } });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measuredKey, feedbackValid, url]);

  useEffect(() => {
    if (level === "info" || !connected) return;
    const topics = level === "trace" ? ["trajectory_header", "trajectory_point", "control_mode"] : ["trajectory_header", "control_mode"];
    const offs = topics.map((name) => ctx.bridge.subscribe("/fruit_hardware_bridge/arm/" + name, (payload) => {
      if (payload.kind === "raw") log(`${name} ${JSON.stringify(payload.message)}`);
    }));
    return () => offs.forEach((off) => off());
  }, [level, connected, ctx.bridge, log]);

  const resetJogInput = () => {
    setJog(false); jogDirty.current = false; jogTarget.current = null; pendingGripper.current = null;
  };
  const clearInput = () => {
    setEnabled(false); resetJogInput();
    if (pending.current) pending.current.cancelled = true;
  };
  const stop = async (emergency = false) => {
    clearInput();
    const action = emergency ? "ESTOP" : "STOP";
    try {
      const response = resultSchema.parse(await ctx.bridge.callService(ROOT + (emergency ? "emergency_stop" : "stop"), {}));
      log(`${action}: ${response.success ? tr("已请求", "requested") : tr("失败", "failed")} ${response.message}. ${tr("硬件停稳未由网页确认", "Hardware standstill not confirmed by web")}`);
    } catch (error) { log(`${action} ${tr("异常", "error")}: ${String(error)}`); }
  };
  useEffect(() => {
    const handleBackground = () => {
      const command = pending.current;
      resetJogInput();
      if (command) {
        command.cancelled = true;
        if (command.kind === "jog" && command.sent && ctx.bridge.state === "open") void stop();
      }
    };
    window.addEventListener("blur", handleBackground);
    const visibility = () => { if (document.hidden) handleBackground(); };
    document.addEventListener("visibilitychange", visibility);
    if (!ctx.active) clearInput();
    return () => { window.removeEventListener("blur", handleBackground); document.removeEventListener("visibilitychange", visibility); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.active, ctx.bridge]);

  const perform = async (kind: string, label: string,
    prepare: (snapshot: Snapshot, start: number[]) => Promise<{ service: string; request: unknown }>): Promise<boolean> => {
    const state = latest.current;
    if (!state.enabled || !state.ctx.active || state.ctx.connectionState !== "open" || !hasValidFeedback(state.telemetry, state.memory?.configuration ?? null) || pending.current) {
      log(tr("先启用控制并确认有效反馈，不能排队或抢占", "Enable control with valid feedback. No queue or preemption.")); return false;
    }
    const command = { kind, sent: false, cancelled: false };
    pending.current = command; setBusy(true);
    const current = generation.current;
    try {
      const snapshot = await readMemory();
      if (generation.current !== current || command.cancelled) return false;
      setMemory(snapshot);
      if (state.memory?.revision !== snapshot.revision) throw new Error(tr("运行配置已变化，请刷新后执行", "Loaded configuration changed. Refresh before execution."));
      if (!hasValidFeedback(latest.current.telemetry, snapshot.configuration)) throw new Error(tr("需要有效的四轴反馈", "Valid four-joint feedback is required"));
      const start = latest.current.telemetry!.hardware_joint_state.position;
      const call = await prepare(snapshot, start);
      if (generation.current !== current || command.cancelled || !latest.current.enabled || !latest.current.ctx.active
          || !hasValidFeedback(latest.current.telemetry, snapshot.configuration)) return false;
      command.sent = true; log(`${label}: ${tr("已提交，等待执行结果", "submitted, waiting for execution result")}`);
      const response = resultSchema.parse(await ctx.bridge.callService(ROOT + call.service, call.request, { timeoutMs: null }));
      if (generation.current !== current) return false;
      log(`${label}: ${response.success ? "OK" : "FAILED"} ${response.message} trajectory_id=${response.trajectory_id ?? "?"}`);
      if (!response.success) { jogDirty.current = false; pendingGripper.current = null; setJog(false); }
      return response.success;
    } catch (error) {
      if (generation.current === current) log(`${label}: ${command.sent ? tr("结果未知", "result unknown") : tr("未提交", "not submitted")} ${String(error)}`);
      jogDirty.current = false; pendingGripper.current = null; setJog(false); return false;
    } finally {
      if (pending.current === command) { pending.current = null; if (mounted.current) setBusy(false); }
    }
  };

  const targetCall = async (_snapshot: Snapshot, _start: number[], goal: Target, mode: ControlMode,
    milliseconds: number, action: number, lin: boolean) => mode === "cartesian"
    ? { service: "move_cartesian", request: { x: goal[0], y: goal[1], z: goal[2], pitch_deg: goal[3],
      duration_ms: milliseconds, gripper_action: action, linear_path: lin } }
    : { service: "move_joints", request: { joints_deg: [...goal], duration_ms: milliseconds, gripper_action: action } };

  const pumpJog = async () => {
    if (pending.current) return;
    while (latest.current.jog && latest.current.enabled && (jogDirty.current || pendingGripper.current !== null)) {
      const action = pendingGripper.current; pendingGripper.current = null;
      const ok = action !== null
        ? await perform("jog", `gripper ${action}`, async (_snapshot, start) => ({ service: "move_joints",
          request: { joints_deg: start.map((value) => value * 180 / Math.PI), duration_ms: 0, gripper_action: action } }))
        : await perform("jog", "jog", (snapshot, start) => {
          const goal = jogTarget.current!; jogDirty.current = false;
          return targetCall(snapshot, start, goal, latest.current.controlMode, 0, 0, false);
        });
      if (!ok) { jogDirty.current = false; jogTarget.current = null; pendingGripper.current = null; break; }
    }
  };

  const jogStepFor = (axis: number, sign: number) => {
    if (!validateInputs(jogFields.current)) return;
    const state = latest.current;
    if (!state.jog || !state.enabled || !hasValidFeedback(state.telemetry, state.memory?.configuration ?? null)) return;
    const message = state.telemetry!;
    const measuredTarget: Target = state.controlMode === "cartesian"
      ? [message.tcp_position.x, message.tcp_position.y, message.tcp_position.z, message.tcp_pitch_deg]
      : message.hardware_joint_state.position.map((value) => value * 180 / Math.PI) as Target;
    const goal: Target = [...(jogTarget.current ?? measuredTarget)] as Target;
    const increment = state.controlMode === "cartesian"
      ? axis === 3 ? state.pitchStep : state.step
      : state.jointJogStep;
    goal[axis] += sign * increment;
    jogTarget.current = goal; jogDirty.current = true; void pumpJog();
  };

  const changeControlMode = (next: ControlMode) => {
    if (next === controlMode) return;
    const nextTarget = pose
      ? next === "cartesian" ? pose.tcp : pose.hardware_deg
      : next === "cartesian" && measured ? measured.tcp : measured?.hardware_deg;
    if (!nextTarget) { log(tr("先获取有效姿态再切换控制模式", "Get a valid pose before changing control mode")); return; }
    jogDirty.current = false; jogTarget.current = null; pendingGripper.current = null;
    setControlMode(next); setTarget(nextTarget as Target); setLinear(false);
    persist(draft, baseVersion, selected, pointIndex, { controlMode: next });
  };

  const selectPoint = (name: string, index: number) => {
    setSelected(name); setPointIndex(index);
    const point = draft[name]?.waypoints[index]; if (!point) return;
    setDuration(point.duration_ms); setGripper(point.gripper ?? 0); setLinear(point.linear ?? false);
    if (draft[name].coordinate_frame === "cartesian" || draft[name].coordinate_frame === "joints") {
      const nextMode = draft[name].coordinate_frame;
      setControlMode(nextMode); setTarget(point.target.slice(0, 4) as Target);
      persist(draft, baseVersion, name, index, { controlMode: nextMode });
      return;
    }
    persist(draft, baseVersion, name, index);
  };

  const editWaypoint = (name: string, index: number, change: Partial<Waypoint>) => {
    const current = draft[name]; if (!current) return;
    const points = current.waypoints.map((point, pointIndexValue) => pointIndexValue === index ? { ...point, ...change } : point);
    edit({ ...draft, [name]: { ...current, waypoints: points } }, name, index);
  };

  const reorderWaypoint = (name: string, from: number, to: number) => {
    const current = draft[name]; if (!current || from === to) return;
    const points = [...current.waypoints]; const [moved] = points.splice(from, 1); points.splice(to, 0, moved);
    edit({ ...draft, [name]: { ...current, waypoints: points } }, name, to);
  };

  const appendCurrentToPreset = (name: string) => {
    if (!validateInputs(controlFields.current)) return;
    const current = draft[name];
    if (!current || !pose || !config) { log(tr("需要有效直控姿态和预设", "A valid direct-control pose and preset are required")); return; }
    const pointTarget = current.coordinate_frame === "cartesian" ? pose.tcp
      : current.coordinate_frame === "joints" ? pose.hardware_deg : pose.link_deg;
    edit({ ...draft, [name]: { ...current, waypoints: [...current.waypoints, {
      target: [...pointTarget], duration_ms: config.planning.default_duration_ms, gripper: 0,
    }] } }, name, current.waypoints.length);
    setExpandedPresets((old) => old.includes(name) ? old : [...old, name]);
  };

  const addWaypoint = (name: string) => {
    const current = draft[name]; if (!current || !config) return;
    const pointTarget = pose ? current.coordinate_frame === "cartesian" ? pose.tcp
      : current.coordinate_frame === "joints" ? pose.hardware_deg : pose.link_deg : [0, 0, 0, 0];
    edit({ ...draft, [name]: { ...current, waypoints: [...current.waypoints, {
      target: [...pointTarget], duration_ms: config.planning.default_duration_ms, gripper: 0,
    }] } }, name, current.waypoints.length);
  };

  const renamePreset = () => {
    const name = prompt(tr("新预设名称", "New preset name"), selected)?.trim();
    if (!name || name === selected || !selectedPreset) return;
    if (Object.hasOwn(draft, name)) { log("Duplicate preset name"); return; }
    const next = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key === selected ? name : key, value]));
    edit(next, name);
  };

  const setLayoutValue = (key: keyof Layout, value: Record<string, number>) => {
    const next = { ...layout, [key]: value } as Layout;
    setLayout(next); persist(draft, baseVersion, selected, pointIndex, { layout: next });
  };

  const handleStartNodes = async () => {
    if (runtimeStarting) return;
    setRuntimeStarting(true); setRuntimeError("");
    const current = generation.current;
    try {
      const checkVal = runtimeTaskSchema.parse(await runtimeRequest("tasks/arm", runtimeBaseUrl, undefined, "GET"));
      if (generation.current !== current) return;
      setRuntime(checkVal);
      if (checkVal.ready) { log(tr("机械臂任务已在运行，无需重复启动", "Arm task is already running")); return; }
      log(tr("正在启动机械臂任务及其缺失依赖...", "Starting the arm task and missing dependencies..."));
      const reply = runtimeTaskReplySchema.parse(await runtimeRequest("tasks/arm/start", runtimeBaseUrl, {}, "POST", undefined, 25_000));
      if (generation.current !== current) return;
      setRuntime(reply.task); log(reply.task.detail);
      if (!reply.task.ready) setRuntimeError(tr("机械臂任务未就绪", "Arm task is not ready"));
    } catch (error) { if (generation.current === current) { const message = String(error); setRuntimeError(message); log(message); } }
    finally { if (generation.current === current) setRuntimeStarting(false); }
  };

  const renderWaypoint = (name: string, point: Waypoint, index: number, coordinateFrame: CoordinateFrame) => (
    <li key={`${name}-${index}`} className="fruit-arm-waypoint" draggable onDragStart={() => { draggedWaypoint.current = { name, index }; }}
      onDragOver={(event) => event.preventDefault()} onDrop={() => {
        const dragged = draggedWaypoint.current; draggedWaypoint.current = null;
        if (dragged?.name === name) reorderWaypoint(name, dragged.index, index);
      }}>
      <div className="fruit-arm-waypoint-header"><span className="fruit-arm-drag-handle" aria-label={tr("拖动排序", "Drag to reorder")}>☷</span>
        <button className={selected === name && pointIndex === index ? "selected" : ""} onClick={() => selectPoint(name, index)}>{index + 1}</button>
        <span>{coordinateFrame} · {point.linear ? "LIN" : "PTP"}</span>
        <button onClick={() => { const points = [...draft[name].waypoints]; [points[index - 1], points[index]] = [points[index], points[index - 1]];
          if (index > 0) edit({ ...draft, [name]: { ...draft[name], waypoints: points } }, name, index - 1); }} disabled={index === 0}>↑</button>
        <button onClick={() => { const points = [...draft[name].waypoints]; [points[index + 1], points[index]] = [points[index], points[index + 1]];
          if (index < draft[name].waypoints.length - 1) edit({ ...draft, [name]: { ...draft[name], waypoints: points } }, name, index + 1); }} disabled={index === draft[name].waypoints.length - 1}>↓</button>
        <button onClick={() => { const points = draft[name].waypoints.filter((_, pointIndexValue) => pointIndexValue !== index);
          edit({ ...draft, [name]: { ...draft[name], waypoints: points } }, name, Math.max(0, index - 1)); }}>×</button>
      </div>
      <div className="fruit-arm-grid">{point.target.slice(0, 4).map((value, targetIndex) => <NumberField key={targetIndex}
        label={coordinateFrame === "cartesian" ? ["X / m", "Y / m", "Z / m", "pitch / °"][targetIndex] : `angle ${targetIndex + 1} / °`}
        value={value} onChange={(next) => editWaypoint(name, index, { target: point.target.map((old, valueIndex) => valueIndex === targetIndex ? next ?? NaN : old) })} />)}</div>
      <div className="fruit-arm-grid"><NumberField label="duration_ms" value={point.duration_ms} min={1} step={1}
        onChange={(next) => editWaypoint(name, index, { duration_ms: next ?? NaN })} />
        <NumberField label="dwell_ms" value={point.dwell_ms} min={0} step={1} required={false} onChange={(next) => {
          editWaypoint(name, index, { dwell_ms: next });
        }} /></div>
      <div className="fruit-arm-waypoint-options"><label>gripper<select value={point.gripper ?? 0} onChange={(event) => editWaypoint(name, index, { gripper: Number(event.target.value) })}>
        <option value={0}>HOLD</option><option value={1}>OPEN</option><option value={2}>CLOSE</option></select></label>
        <label><input type="checkbox" checked={point.linear ?? false} disabled={coordinateFrame !== "cartesian" && !point.linear}
          onChange={(event) => editWaypoint(name, index, { linear: event.target.checked })} /> LIN</label>
        <label><input type="checkbox" checked={point.is_via_point ?? false}
          onChange={(event) => editWaypoint(name, index, { is_via_point: event.target.checked })} /> {tr("途经点", "Via point")}</label></div>
    </li>
  );

  const renderPresetCard = (name: string) => {
    const item = draft[name]; if (!item) return null;
    const isExpanded = expandedPresets.includes(name);
    const canExecute = canMove && !jog && !dirty && applied && !!file && !!memory && file.file === memory.config_path
      && same(item, memory.configuration.presets[name]);
    return <article className={`fruit-arm-preset-card ${isExpanded ? "expanded" : ""}`} key={name}>
      <header className="fruit-arm-preset-header"><button className="fruit-arm-expand" onClick={() => {
        const next = isExpanded ? expandedPresets.filter((value) => value !== name) : [...expandedPresets, name];
        setExpandedPresets(next); persist(draft, baseVersion, selected, pointIndex, { expandedPresets: next });
      }} aria-expanded={isExpanded}>{isExpanded ? "▾" : "▸"}</button>
        <button className="fruit-arm-preset-title" onClick={() => { setSelected(name); setPointIndex(0); }}>{name}</button>
        <span>{item.coordinate_frame} · {item.waypoints.length}</span>
        <button disabled={!canExecute} onClick={() => void perform("preset", `preset ${name}`, async (snapshot) => {
          const currentFile = documentSchema.parse(await armRequest("document", url));
          if (currentFile.presets_revision !== snapshot.presets_revision || !same(item, snapshot.configuration.presets[name])) throw new Error("Save and reload this preset first");
          return { service: "execute_preset", request: { preset_name: name } };
        })}>{tr("执行", "Execute")}</button>
      </header>
      {isExpanded && <div className="fruit-arm-preset-body"><label>{tr("描述", "Description")}<textarea value={item.description ?? ""}
        onChange={(event) => edit({ ...draft, [name]: { ...item, description: event.target.value } }, name)} /></label>
        <label>{tr("坐标类型", "Coordinate frame")}<select value={item.coordinate_frame} disabled={item.waypoints.length > 0}
          onChange={(event) => edit({ ...draft, [name]: { ...item, coordinate_frame: event.target.value as CoordinateFrame } }, name)}>
          <option>cartesian</option><option>joints</option><option>link_angles</option></select></label>
        <ol className="fruit-arm-point-list">{item.waypoints.map((point, index) => renderWaypoint(name, point, index, item.coordinate_frame))}</ol>
        <div className="fruit-arm-actions"><button onClick={() => addWaypoint(name)}>{tr("新增航点", "Add waypoint")}</button>
          <button disabled={!pose} onClick={() => appendCurrentToPreset(name)}>{tr("追加当前直控目标", "Append direct target")}</button></div>
      </div>}
    </article>;
  };

  return <div className="fruit-arm">
    <div className="fruit-arm-toolbar"><strong>{tr("机械臂", "Arm")}</strong><span>{!connected ? tr("离线", "Offline") : `${tr("在线", "Online")} · ${!memory ? tr("配置未加载", "Config not loaded") : !feedbackValid ? tr("等待/无效反馈", "Waiting/invalid feedback") : tr("已收到有效反馈（时效由 planner 判断）", "Valid feedback received (timing checked by planner)")}`}</span>
      <button disabled={runtimeStarting} onClick={() => void handleStartNodes()}>{runtimeStarting ? tr("启动中...", "Starting...") : runtime?.ready ? tr("节点就绪", "Nodes ready") : tr("一键启动节点", "Start nodes")}</button>
      {runtime && <span className="fruit-arm-runtime-badges" aria-label={tr("节点状态", "Node status")}>{runtime.dependencies.map((dep) => <span key={dep.id}
        className={`fruit-arm-runtime-tag ${dep.ready ? "ready" : "missing"}`} title={`${dep.id}: ${dep.detail}`}>
        {dep.id === "serial_controller" ? tr("串口", "Serial") : dep.id === "arm_planner_node" ? tr("规划器", "Planner") : "Foxglove"}{dep.ready ? " ✓" : " ✗"}</span>)}</span>}
      {runtimeError && <span className="fruit-arm-runtime-error" role="alert">{runtimeError}</span>}
      <button disabled={!connected || !memory || !feedbackValid || busy} aria-pressed={enabled} onClick={() => {
        if (enabled) { if (jog && pending.current?.sent) void stop(); else clearInput(); }
        else setEnabled(true);
      }}>{enabled ? tr("停用控制", "Disable control") : tr("启用实机控制", "Enable real control")}</button>
      <button disabled={!connected} onClick={() => void stop()}>STOP</button><button disabled={!connected} onClick={() => void stop(true)}>ESTOP</button>
      <span>{tr("停稳未由网页确认，直接调用 planner 服务", "Standstill not confirmed by web; calls planner services")}</span>
    </div>
    <Group id="fruit-arm-main" className="fruit-arm-main-panels" orientation="horizontal" disabled={isMobile} defaultLayout={layout.main}
      resizeTargetMinimumSize={{ fine: 8, coarse: 20 }} onLayoutChanged={(value, meta) => {
        if (!meta.isUserInteraction) return;
        setLayoutValue("main", mapPanelLayout(value, ["presets", "control", "status"], layout.main));
      }}>
      <Panel id="presets" minSize={22}><aside className="fruit-arm-panel fruit-arm-presets" ref={presetFields}><div className="fruit-arm-panel-title"><h3>{tr("预设路径点集", "Preset waypoint sets")}</h3><span>{Object.keys(draft).length}</span></div>
        <label>{tr("追加目标到", "Append target to")}<select aria-label={tr("预设", "Preset")} value={selected} onChange={(event) => { setSelected(event.target.value); setPointIndex(0); }}>
          <option value="">{tr("选择预设", "Select preset")}</option>{Object.keys(draft).map((name) => <option key={name}>{name}</option>)}</select></label>
        <button disabled={!selected || !pose} onClick={() => appendCurrentToPreset(selected)}>{tr("追加当前直控目标", "Append current direct target")}</button>
        <div className="fruit-arm-actions"><button onClick={() => { const name = prompt(tr("新预设名称", "New preset name"))?.trim(); if (!name) return;
          if (Object.hasOwn(draft, name)) { log("Duplicate preset name"); return; }
          edit({ ...draft, [name]: { coordinate_frame: "cartesian", description: "", waypoints: [] } }, name); setExpandedPresets([...expandedPresets, name]); }}>{tr("新建", "New")}</button>
          <button disabled={!selectedPreset} onClick={renamePreset}>{tr("改名", "Rename")}</button>
          <button disabled={!selectedPreset} onClick={() => { const name = prompt(tr("副本名称", "Copy name"), `${selected}_copy`)?.trim();
            if (name && !Object.hasOwn(draft, name)) edit({ ...draft, [name]: structuredClone(selectedPreset) }, name); }}>{tr("复制", "Copy")}</button>
          <button disabled={!selectedPreset} onClick={() => { if (!confirm(tr("删除此草稿预设？", "Delete this draft preset?"))) return;
            const next = Object.fromEntries(Object.entries(draft).filter(([key]) => key !== selected)); edit(next, Object.keys(next)[0] ?? "", 0); }}>{tr("删除", "Delete")}</button></div>
        <div className="fruit-arm-preset-list">{Object.keys(draft).map(renderPresetCard)}</div>
        <p>{dirty ? tr("未保存草稿", "Unsaved draft") : tr("文件未修改", "File unchanged")} · {applied ? tr("预设已应用", "Presets applied") : tr("预设未应用/未知", "Presets not applied / unknown")}</p>
        {file && baseVersion !== file.version && <p className="fruit-arm-error" role="alert">{tr("草稿基线与文件冲突，不会覆盖。", "Draft baseline conflicts with the file. No overwrite.")}</p>}
        {file && memory && file.file !== memory.config_path && <p className="fruit-arm-error" role="alert">{tr("文件路径与 planner 路径不同，不能重载或执行。", "Editor and planner paths differ. Reload and execution are blocked.")}</p>}
        <div className="fruit-arm-actions"><button disabled={!file || saving || !dirty || baseVersion !== file.version} onClick={async () => {
          if (!validateInputs(presetFields.current)) return;
          if (!validDraft) { log(tr("请填写有效的预设字段，展开预设检查空值", "Fill in valid preset fields. Expand presets to check empty values.")); return; }
          setSaving(true); const current = generation.current;
          try { const saved = documentSchema.parse(await armRequest("presets", url, { version: baseVersion, presets: draft }, "PUT"));
            if (current !== generation.current) return; setFile(saved); setBaseVersion(saved.version); persist(draft, saved.version); log(tr("已保存，尚未重载", "Saved, not reloaded"));
          } catch (error) { log(String(error)); } finally { if (current === generation.current) setSaving(false); }
        }}>{tr("保存文件", "Save file")}</button>
          <button disabled={!connected || busy || saving || file?.file !== memory?.config_path} onClick={async () => {
            const current = generation.current;
            try { const result = resultSchema.parse(await ctx.bridge.callService(ROOT + "reload_presets", {})); log(result.message);
              if (result.success) { const snapshot = await readMemory(); const doc = documentSchema.parse(await armRequest("document", url));
                if (current === generation.current) { setMemory(snapshot); setFile(doc); setBaseVersion(doc.version); } }
            } catch (error) { log(String(error)); }
          }}>{tr("重载预设", "Reload presets")}</button>
          <button onClick={async () => { if (dirty && !confirm(tr("丢弃未保存草稿，重新加载文件？", "Discard unsaved draft and reload file?"))) return;
            const current = generation.current; try { const doc = documentSchema.parse(await armRequest("document", url)); if (current !== generation.current) return;
              setFile(doc); setDraft(doc.configuration.presets); setBaseVersion(doc.version); setHistory([]); const name = Object.keys(doc.configuration.presets)[0] ?? "";
              setSelected(name); setPointIndex(0); persist(doc.configuration.presets, doc.version, name, 0); } catch (error) { log(String(error)); } }}>{tr("重新加载文件", "Reload file")}</button></div>
        <div className="fruit-arm-actions"><button disabled={!history.length} onClick={() => { const previous = history.at(-1)!; setDraft(previous); setHistory(history.slice(0, -1));
          const name = previous[selected] ? selected : Object.keys(previous)[0] ?? ""; setSelected(name); setPointIndex(0); persist(previous, baseVersion, name, 0); }}>{tr("撤销", "Undo")}</button></div>
      </aside></Panel>
      <Separator className="fruit-arm-resize-handle vertical" />
      <Panel id="control" minSize={28}><Group id="fruit-arm-control" className="fruit-arm-inner-panels" orientation="vertical" disabled={isMobile} defaultLayout={layout.control}
        resizeTargetMinimumSize={{ fine: 8, coarse: 20 }} onLayoutChanged={(value, meta) => {
          if (!meta.isUserInteraction) return; setLayoutValue("control", mapPanelLayout(value, ["direct", "jog"], layout.control));
        }}>
        <Panel id="direct" minSize={30}><section className="fruit-arm-panel fruit-arm-controls" ref={controlFields}><h3>{tr("直接控制", "Direct control")}</h3>
          <label>{tr("输入模式", "Input mode")}<select value={controlMode} onChange={(event) => changeControlMode(event.target.value as ControlMode)}>
            <option value="cartesian">TCP / Cartesian</option><option value="joints">{tr("原始电机角 / Joints", "Raw motor angles / Joints")}</option></select></label>
          <div className="fruit-arm-grid">{target.map((value, index) => <NumberField key={`${controlMode}-${index}`}
            label={controlMode === "cartesian" ? ["X / m", "Y / m", "Z / m", "pitch / °"][index] : `motor ${index + 1} / °`}
            value={value} onChange={(next) => setTarget(target.map((old, targetIndex) => targetIndex === index ? next ?? NaN : old) as Target)} />)}</div>
          <NumberField label={tr("时长 ms，0=默认", "Duration ms, 0=default")} value={duration} min={0} max={0xffffffff} step={1} onChange={(next) => setDuration(next ?? NaN)} />
          <label>{tr("夹爪动作", "Gripper action")}<select value={gripper} onChange={(event) => setGripper(Number(event.target.value))}><option value={0}>HOLD</option><option value={1}>OPEN</option><option value={2}>CLOSE</option></select></label>
          <label><input type="checkbox" checked={linear} disabled={controlMode !== "cartesian"} onChange={(event) => setLinear(event.target.checked)} /> LIN {tr("否则 PTP", "otherwise PTP")}</label>
          <p className={pose ? "" : "fruit-arm-error"}>{pose ? `TCP: ${pose.tcp.map((value, index) => `${fmt(value)}${index === 3 ? "°" : "m"}`).join(" · ")}` : poseError || tr("目标等待校验", "Target awaiting validation")}</p>
          <div className="fruit-arm-actions"><button disabled={!canMove || jog}
            onClick={() => {
              if (!validateInputs(controlFields.current)) return;
              if (!pose || !Number.isInteger(duration) || duration < 0 || duration > 0xffffffff) { log(tr("目标或时长无效", "Invalid target or duration")); return; }
              void perform("manual", "pose", (snapshot, start) => targetCall(snapshot, start, [...target], controlMode, duration, gripper, controlMode === "cartesian" && linear));
            }}>{tr("下发当前目标", "Dispatch target")}</button>
            <button disabled={!canMove || jog || !memory?.configuration.presets.home} onClick={() => void perform("manual", "home", async () => ({ service: "home", request: {} }))}>Home</button>
            <button disabled={!canMove || jog || !selectedPreset || dirty || !applied || !file || !memory || file.file !== memory.config_path}
              onClick={() => void perform("manual", `preset ${selected}`, async (snapshot) => {
                const currentFile = documentSchema.parse(await armRequest("document", url));
                if (currentFile.presets_revision !== snapshot.presets_revision || !same(selectedPreset, snapshot.configuration.presets[selected])) throw new Error("Save and reload this preset first");
                return { service: "execute_preset", request: { preset_name: selected } };
              })}>{tr("执行已应用预设", "Execute applied preset")}</button></div>
          <div className="fruit-arm-actions">{["HOLD", "OPEN", "CLOSE"].map((name, action) => <button key={name} disabled={!enabled || !feedbackValid || (busy && !jog)} onClick={() => {
            if (jog) { pendingGripper.current = action; void pumpJog(); }
            else void perform("manual", `gripper ${name}`, async (_snapshot, start) => ({ service: "move_joints", request: { joints_deg: start.map((value) => value * 180 / Math.PI), duration_ms: 0, gripper_action: action } }));
          }}>{name}</button>)}</div>
        </section></Panel>
        <Separator className="fruit-arm-resize-handle horizontal" />
        <Panel id="jog" minSize={25}><section className="fruit-arm-panel fruit-arm-jog-panel" ref={jogFields}><h3>Jog</h3>
          <button aria-pressed={jog} disabled={!enabled || !feedbackValid || (busy && !jog)} onClick={() => {
            if (jog) { if (pending.current?.sent) void stop(); else { setJog(false); jogDirty.current = false; jogTarget.current = null; pendingGripper.current = null; } }
            else { if (!validateInputs(jogFields.current)) return; jogTarget.current = null; setJog(true); }
          }}>{jog ? tr("停用 Jog", "Disable Jog") : tr("启用 Jog", "Enable Jog")}</button>
          <div className="fruit-arm-grid"><NumberField label="XYZ / m" value={step} min={0.0001} max={0.1} onChange={(value) => { if (value !== undefined && Number.isFinite(value) && value > 0 && value <= 0.1) {
            setStep(value); persist(draft, baseVersion, selected, pointIndex, { step: value }); } }} />
            <NumberField label="pitch / °" value={pitchStep} min={0.1} max={30} onChange={(value) => { if (value !== undefined && Number.isFinite(value) && value > 0 && value <= 30) {
              setPitchStep(value); persist(draft, baseVersion, selected, pointIndex, { pitchStep: value }); } }} />
            <NumberField label={tr("关节步长 / °", "Joint step / °")} value={jointJogStep} min={0.1} max={30} step={0.1} onChange={(value) => { if (value !== undefined && Number.isFinite(value) && value >= 0.1 && value <= 30) {
              setJointJogStep(value); persist(draft, baseVersion, selected, pointIndex, { jointJogStep: value }); } }} /></div>
          <div className="fruit-arm-jog" tabIndex={0} aria-label={tr("Jog 控制区", "Jog control area")} onKeyDown={(event) => {
            if ((event.target as HTMLElement).matches("input,textarea,select")) return;
            const keys: Record<string, [number, number]> = controlMode === "cartesian"
              ? { ArrowLeft: [1, 1], ArrowRight: [1, -1], ArrowUp: [0, 1], ArrowDown: [0, -1], a: [2, 1], z: [2, -1], s: [3, 1], x: [3, -1] }
              : { q: [0, 1], a: [0, -1], w: [1, 1], s: [1, -1], e: [2, 1], d: [2, -1], r: [3, 1], f: [3, -1] };
            const change = keys[event.key]; if (change) { event.preventDefault(); jogStepFor(...change); }
            if (event.key === "t") { event.preventDefault(); void stop(); } if (event.key === "Escape") { event.preventDefault(); void stop(true); }
          }}>{["1", "2", "3", "4"].map((axis, index) => <div key={axis}><span>{controlMode === "cartesian" ? ["X", "Y", "Z", "pitch"][index] : `J${axis}`}</span>
            <button disabled={!jog || !enabled || !feedbackValid} onClick={() => jogStepFor(index, -1)}>−</button><button disabled={!jog || !enabled || !feedbackValid} onClick={() => jogStepFor(index, 1)}>+</button></div>)}</div>
          <small>{tr("TCP 使用 XYZ/pitch 累加，关节模式使用原始电机角。聚焦后可用键盘，t=STOP，Escape=ESTOP。", "TCP uses XYZ/pitch accumulation. Joint mode uses raw motor angles. Focus for keys, t=STOP, Escape=ESTOP.")}</small>
        </section></Panel>
      </Group></Panel>
      <Separator className="fruit-arm-resize-handle vertical" />
      <Panel id="status" minSize={22}><Group id="fruit-arm-status" className="fruit-arm-inner-panels" orientation="vertical" disabled={isMobile} defaultLayout={layout.status}
        resizeTargetMinimumSize={{ fine: 8, coarse: 20 }} onLayoutChanged={(value, meta) => {
          if (!meta.isUserInteraction) return; setLayoutValue("status", mapPanelLayout(value, ["telemetry", "debug"], layout.status));
        }}>
        <Panel id="telemetry" minSize={30}><section className="fruit-arm-panel fruit-arm-status-panel"><h3>{tr("最新反馈遥测", "Latest telemetry")} <small>{tr("非当前实测保证，时效由 planner 判定", "Not a real-time guarantee; timing checked by planner")}</small></h3>
          {telemetry ? <div className="fruit-arm-telemetry"><p>trajectory_id={telemetry.trajectory_id} · status={telemetry.task_status} · progress={fmt(telemetry.progress)}</p>
            <p>gripper={telemetry.gripper_state} · error_code={telemetry.error_code}</p>
            <p>{tr("硬件角 °", "Hardware °")}: {telemetry.hardware_joint_state.position.map((value) => fmt(value * 180 / Math.PI, 2)).join(", ")}</p>
            <p>{tr("模型角 °", "Model °")}: {telemetry.model_joint_state.position.map((value) => fmt(value * 180 / Math.PI, 2)).join(", ")}</p>
            <p>TCP: {[telemetry.tcp_position.x, telemetry.tcp_position.y, telemetry.tcp_position.z].map((value) => fmt(value)).join(", ")} m · {fmt(telemetry.tcp_pitch_deg, 2)}°</p></div>
            : <p>{tr("等待遥测", "Waiting for telemetry")}</p>}
          {pose && <details><summary>{tr("目标角度", "Target angles")}</summary><p>hardware °: {pose.hardware_deg.map((value) => fmt(value, 2)).join(", ")}</p><p>link °: {pose.link_deg.map((value) => fmt(value, 2)).join(", ")}</p></details>}
          <details><summary>{tr("只读配置与版本", "Read-only configuration and versions")}</summary><p>file: {file?.file}</p><p>loaded: {memory?.config_path ?? "?"}</p><p>file revision: {file?.revision.slice(0, 12) ?? "?"}</p><p>loaded revision: {memory?.revision.slice(0, 12) ?? "?"}</p><pre>{JSON.stringify(config && { geometry: config.geometry, joint_mapping: config.joint_mapping, planning: config.planning }, null, 2)}</pre></details>
          <button disabled={!connected} onClick={async () => { const current = generation.current; try { const snapshot = await readMemory(); if (current === generation.current) setMemory(snapshot); } catch (error) { log(String(error)); } }}>{tr("刷新运行配置", "Refresh loaded configuration")}</button>
        </section></Panel>
        <Separator className="fruit-arm-resize-handle horizontal" />
        <Panel id="debug" minSize={20}><footer className="fruit-arm-debug"><label>{tr("网页诊断", "Web diagnostics")}<select value={level} onChange={(event) => setLevel(event.target.value as typeof level)}><option>info</option><option>debug</option><option>trace</option></select></label>
          <button onClick={() => { const blob = new Blob([events.join("\n") + "\n"], { type: "text/plain" }); const href = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = href; link.download = `fruit-arm-${new Date().toISOString().replaceAll(":", "-")}.log`; link.click(); setTimeout(() => URL.revokeObjectURL(href), 1000); }}>{tr("下载诊断", "Download diagnostics")}</button>
          <button onClick={() => setEvents([])}>{tr("清空", "Clear")}</button><small>{tr("日志级别只控制网页订阅，不修改 planner 日志级别。", "Log level controls web subscriptions only. It does not change planner logging.")}</small><pre aria-live="polite">{events.slice(-20).join("\n")}</pre>
        </footer></Panel>
      </Group></Panel>
    </Group>
  </div>;
}

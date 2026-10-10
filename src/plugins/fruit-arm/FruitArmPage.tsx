import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import type { PluginPageProps } from "../types";
import { Arm2D, Arm3D } from "./ArmViews";
import { armRequest, configurationReplySchema, documentSchema, draftsSchema, fmt, isFresh, poseSchema,
  presetsSchema, previewSchema, resultSchema, same, snapshotSchema, telemetrySchema } from "./api";
import type { ArmDocument, ArmPose, ArmPreview, CoordinateFrame, Presets, Snapshot, Telemetry, Waypoint } from "./api";
import "./fruit-arm.css";

type Target = [number, number, number, number];
type LoadedSnapshot = Snapshot & { config_path: string; max_trajectory_points: number };
const ROOT = "/arm_planner_node/";
const storedSchema = z.object({ baseVersion: z.string(), presets: draftsSchema, selected: z.string(),
  pointIndex: z.number().int().nonnegative().optional(),
  step: z.number().positive().max(0.1).optional(), pitchStep: z.number().positive().max(30).optional() });

function NumberField({ label, value, onChange, min, step = "any" }: {
  label: string; value: number | undefined; onChange: (value: number | undefined) => void;
  min?: number; step?: number | "any";
}) {
  return <label className="fruit-arm-number"><span>{label}</span><input type="number" min={min} step={step}
    value={value !== undefined && Number.isFinite(value) ? value : ""}
    onChange={(event) => onChange(event.currentTarget.value === "" ? undefined : event.currentTarget.valueAsNumber)} /></label>;
}

export default function FruitArmPage({ ctx, bridgeUrl, fontScale, isMobile }: PluginPageProps) {
  const en = ctx.locale === "en";
  const tr = (cn: string, english: string) => en ? english : cn;
  const url = bridgeUrl ?? ctx.bridge.url;
  const connected = ctx.active && ctx.connectionState === "open";
  const [file, setFile] = useState<ArmDocument | null>(null);
  const [memory, setMemory] = useState<LoadedSnapshot | null>(null);
  const [draft, setDraft] = useState<Presets>({});
  const [baseVersion, setBaseVersion] = useState("");
  const [selected, setSelected] = useState("");
  const [pointIndex, setPointIndex] = useState(0);
  const [history, setHistory] = useState<Presets[]>([]);
  const [frame, setFrame] = useState<CoordinateFrame>("cartesian");
  const [target, setTarget] = useState<Target>([0, 0, 0, 0]);
  const [duration, setDuration] = useState(0);
  const [gripper, setGripper] = useState(0);
  const [linear, setLinear] = useState(false);
  const [lastPose, setLastPose] = useState<ArmPose | null>(null);
  const [poseResult, setPoseResult] = useState<{ pose: ArmPose; key: string } | null>(null);
  const [poseError, setPoseError] = useState("");
  const [measuredResult, setMeasuredResult] = useState<{ pose: ArmPose; key: string } | null>(null);
  const [telemetry, setTelemetry] = useState<{ message: Telemetry; received: number } | null>(null);
  const [tick, setTick] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const [jog, setJog] = useState(false);
  const [step, setStep] = useState(0.01);
  const [pitchStep, setPitchStep] = useState(5);
  const [startMode, setStartMode] = useState<"measured" | "manual">("measured");
  const [manualStart, setManualStart] = useState<Target>([0, 0, 0, 0]);
  const [preview, setPreview] = useState<ArmPreview | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playbackTime = useRef(time);
  playbackTime.current = time;
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [level, setLevel] = useState<"info" | "debug" | "trace">("info");
  const [stopAt, setStopAt] = useState<number | null>(null);
  const generation = useRef(0);
  const mounted = useRef(false);
  const jogTarget = useRef<Target | null>(null);
  const jogDirty = useRef(false);
  const pendingGripper = useRef<number | null>(null);
  const pending = useRef<{ kind: string; sent: boolean; cancelled: boolean } | null>(null);
  const previewController = useRef<AbortController | null>(null);
  const abortPreview = useCallback(() => previewController.current?.abort(), []);
  const latest = useRef({ ctx, enabled, jog, telemetry, memory, target, frame, duration, gripper, linear, step, pitchStep });
  latest.current = { ctx, enabled, jog, telemetry, memory, target, frame, duration, gripper, linear, step, pitchStep };

  const config = memory?.configuration ?? file?.configuration ?? null;
  const fresh = connected && isFresh(telemetry, memory?.configuration ?? null);
  const measuredKey = memory && telemetry ? JSON.stringify([memory.revision, telemetry.message.model_joint_state.position]) : "";
  const measured = fresh && measuredResult?.key === measuredKey ? measuredResult.pose : null;
  const preset = draft[selected];
  const waypoint = preset?.waypoints[pointIndex];
  const dirty = !!file && !same(draft, file.configuration.presets);
  const validDraft = presetsSchema.safeParse(draft).success;
  const applied = !!file && !!memory && file.file === memory.config_path && file.presets_revision === memory.presets_revision;
  const poseKey = JSON.stringify([memory?.revision ?? file?.revision, frame, target]);
  const pose = poseResult?.key === poseKey ? poseResult.pose : null;
  const canMove = enabled && fresh && !!memory && !busy && [0, 2].includes(telemetry?.message.task_status ?? -1);

  const log = useCallback((message: string) => {
    if (mounted.current) setEvents((old) => [...old.slice(-199), `${new Date().toISOString()} ${message}`]);
  }, []);

  const persist = (presets: Presets, version: string, name = selected, index = pointIndex) => {
    if (draftsSchema.safeParse(presets).success) ctx.onPluginStateChange("fruit-arm", {
      presets, baseVersion: version, selected: name, pointIndex: index, step, pitchStep,
    });
  };
  const edit = (next: Presets, name = selected) => {
    setHistory((old) => [...old.slice(-39), structuredClone(draft)]);
    setDraft(next); setSelected(name); persist(next, baseVersion, name);
  };
  const editWaypoint = (change: Partial<Waypoint>) => {
    if (!preset || !waypoint) return;
    const points = preset.waypoints.map((point, i) => i === pointIndex ? { ...point, ...change } : point);
    edit({ ...draft, [selected]: { ...preset, waypoints: points } });
    if (change.target) { setFrame(preset.coordinate_frame); setTarget(change.target.slice(0, 4) as Target); }
  };

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
    setPreview(null); setPoseResult(null); setLastPose(null); setHistory([]); setBusy(false); setEvents([]);
    const stored = storedSchema.safeParse(ctx.pluginStates["fruit-arm"]);
    armRequest("document", url, undefined, "GET", controller.signal).then((value) => {
      if (generation.current !== current) return;
      const doc = documentSchema.parse(value);
      setFile(doc);
      const presets = stored.success ? stored.data.presets : doc.configuration.presets;
      const name = stored.success && presets[stored.data.selected] ? stored.data.selected : Object.keys(presets)[0] ?? "";
      const index = Math.min(stored.success ? stored.data.pointIndex ?? 0 : 0, Math.max(0, (presets[name]?.waypoints.length ?? 0) - 1));
      setDraft(presets); setBaseVersion(stored.success ? stored.data.baseVersion : doc.version); setSelected(name); setPointIndex(index);
      setStep(stored.success ? stored.data.step ?? 0.01 : 0.01);
      setPitchStep(stored.success ? stored.data.pitchStep ?? 5 : 5);
      setManualStart((["q1", "q2", "q3", "q4"] as const).map((key) => {
        const limits = doc.configuration.joint_mapping[key].limits_deg; return (limits[0] + limits[1]) / 2;
      }) as Target);
      if (presets[name]?.waypoints[index]) { setFrame(presets[name].coordinate_frame); setTarget(presets[name].waypoints[index].target.slice(0, 4) as Target); }
    }).catch((error) => { if (!controller.signal.aborted) log(String(error)); });
    return () => {
      const command = pending.current;
      if (command?.kind === "jog" && command.sent && ctx.bridge.state === "open" && ctx.bridge.url === url) {
        ctx.bridge.callService(ROOT + "stop", {}).catch((error) => console.error("Arm jog cleanup STOP failed", error));
      }
      if (command) command.cancelled = true;
      pending.current = null;
      jogDirty.current = false; jogTarget.current = null; pendingGripper.current = null;
      controller.abort(); abortPreview(); mounted.current = false; generation.current = current + 1;
    };
    // Machine identity changes restore only that machine's draft, never control state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.bridge, url, log, abortPreview]);

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
      setTelemetry({ message: parsed.data, received: performance.now() });
    }, { maxFrequency: 10 });
    const offStatus = ctx.bridge.subscribe("/fruit_hardware_bridge/arm/status", (payload) => {
      if (payload.kind !== "raw" || !payload.message || typeof payload.message !== "object") return;
      const raw = payload.message as Record<string, unknown>;
      const positions = [raw.joint_1, raw.joint_2, raw.joint_3, raw.joint_4];
      const cfg = latest.current.memory?.configuration;
      if (!positions.every((value, i) => {
        if (typeof value !== "number" || !Number.isFinite(value)) return false;
        const limits = cfg?.joint_mapping[(["q1", "q2", "q3", "q4"] as const)[i]].limits_deg;
        const degrees = value * 180 / Math.PI;
        return !limits || (degrees >= limits[0] - 0.006 && degrees <= limits[1] + 0.006);
      })) clear();
    }, { maxFrequency: 10 });
    const timer = setInterval(() => setTick((old) => old + 1), 100);
    return () => { off(); offStatus(); clearInterval(timer); };
  }, [connected, ctx.bridge]);

  useEffect(() => {
    if (!config) return;
    const controller = new AbortController();
    const key = poseKey;
    const timer = setTimeout(() => {
      armRequest("pose", url, { configuration: config, frame, target }, "POST", controller.signal).then((value) => {
        if (controller.signal.aborted) return;
        const response = snapshotSchema.extend({ pose: poseSchema }).parse(value);
        setLastPose(response.pose); setPoseResult({ pose: response.pose, key }); setPoseError("");
      }).catch((error) => { if (!controller.signal.aborted) { setPoseResult(null); setPoseError(String(error)); } });
    }, 100);
    return () => { clearTimeout(timer); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poseKey, url]);

  useEffect(() => {
    if (!telemetry || !memory || !fresh) { setMeasuredResult(null); return; }
    const controller = new AbortController();
    const key = measuredKey;
    armRequest("pose", url, { configuration: memory.configuration, frame: "model_joints",
      target: telemetry.message.model_joint_state.position }, "POST", controller.signal).then((value) => {
      if (!controller.signal.aborted) setMeasuredResult({ pose: snapshotSchema.extend({ pose: poseSchema }).parse(value).pose, key });
    }).catch((error) => { if (!controller.signal.aborted) { setMeasuredResult(null); log(String(error)); } });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measuredKey, fresh, url]);

  useEffect(() => { setPreview(null); setPlaying(false); abortPreview(); },
    [poseKey, duration, gripper, linear, draft, startMode, manualStart, abortPreview]);

  useEffect(() => {
    if (!playing || !preview || !ctx.active) return;
    let frameId = 0;
    const started = performance.now();
    const initial = playbackTime.current;
    const advance = (now: number) => {
      const next = Math.min(preview.duration_ms, initial + now - started);
      setTime(next);
      if (next >= preview.duration_ms) { setPlaying(false); return; }
      frameId = requestAnimationFrame(advance);
    };
    frameId = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frameId);
  }, [playing, preview, ctx.active]);

  useEffect(() => {
    if (level === "info" || !connected) return;
    const topics = level === "trace" ? ["trajectory_header", "trajectory_point", "control_mode"] : ["trajectory_header", "control_mode"];
    const offs = topics.map((name) => ctx.bridge.subscribe("/fruit_hardware_bridge/arm/" + name, (payload) => {
      if (payload.kind === "raw") log(`${name} ${JSON.stringify(payload.message)}`);
    }));
    return () => offs.forEach((off) => off());
  }, [level, connected, ctx.bridge, log]);

  const clearInput = () => {
    setEnabled(false); setJog(false); setPlaying(false); jogDirty.current = false; jogTarget.current = null; pendingGripper.current = null;
    if (pending.current) pending.current.cancelled = true;
  };
  const stop = async (emergency = false) => {
    clearInput(); setStopAt(performance.now());
    try {
      const response = resultSchema.parse(await ctx.bridge.callService(ROOT + (emergency ? "emergency_stop" : "stop"), {}));
      log(`${emergency ? "ESTOP" : "STOP"}: ${response.message}. ${tr("已请求，不等于停稳", "Requested, not standstill confirmation")}`);
    } catch (error) { log(String(error)); }
  };
  useEffect(() => {
    const deactivate = () => {
      const command = pending.current;
      clearInput();
      if (command?.kind === "jog" && command.sent && ctx.bridge.state === "open") void stop();
    };
    window.addEventListener("blur", deactivate);
    const visibility = () => { if (document.hidden) deactivate(); };
    document.addEventListener("visibilitychange", visibility);
    if (!ctx.active) deactivate();
    return () => { window.removeEventListener("blur", deactivate); document.removeEventListener("visibilitychange", visibility); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.active, ctx.bridge]);

  const perform = async (kind: string, label: string,
    prepare: (snapshot: Snapshot, start: number[]) => Promise<{ service: string; request: unknown }>): Promise<boolean> => {
    const state = latest.current;
    if (!state.enabled || !state.ctx.active || state.ctx.connectionState !== "open" || !isFresh(state.telemetry, state.memory?.configuration ?? null) || pending.current) {
      log(tr("先启用控制并确认新鲜反馈，不能排队或抢占", "Enable control with fresh feedback. No queue or preemption.")); return false;
    }
    const command = { kind, sent: false, cancelled: false };
    pending.current = command; setBusy(true);
    const current = generation.current;
    try {
      const snapshot = await readMemory();
      if (generation.current !== current || command.cancelled) return false;
      setMemory(snapshot);
      if (state.memory?.revision !== snapshot.revision) throw new Error(tr("运行配置已变化，请重新预览后执行", "Loaded configuration changed. Preview again before execution."));
      if (!isFresh(latest.current.telemetry, snapshot.configuration)) throw new Error("Fresh feedback required");
      const start = latest.current.telemetry!.message.hardware_joint_state.position;
      const call = await prepare(snapshot, start);
      if (generation.current !== current || command.cancelled || !latest.current.enabled || !latest.current.ctx.active
          || !isFresh(latest.current.telemetry, snapshot.configuration)) return false;
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

  const targetCall = async (snapshot: Snapshot, start: number[], goal: Target, kind: CoordinateFrame,
    milliseconds: number, action: number, lin: boolean) => {
    const checked = previewSchema.parse(await armRequest("preview", url, { configuration: snapshot.configuration,
      start_hw_rad: start, target: goal, frame: kind, duration_ms: milliseconds, gripper: action, linear: lin }));
    if (kind === "cartesian") return { service: "move_cartesian", request: {
      x: goal[0], y: goal[1], z: goal[2], pitch_deg: goal[3], duration_ms: milliseconds, gripper_action: action, linear_path: lin,
    } };
    return { service: "move_joints", request: { joints_deg: checked.points.at(-1)!.hardware_deg,
      duration_ms: milliseconds, gripper_action: action } };
  };

  const pumpJog = async () => {
    if (pending.current) return;
    while (latest.current.jog && latest.current.enabled && (jogDirty.current || pendingGripper.current !== null)) {
      const action = pendingGripper.current; pendingGripper.current = null;
      let ok: boolean;
      if (action !== null) ok = await perform("jog", `gripper ${action}`, async (_snapshot, start) => ({ service: "move_joints",
        request: { joints_deg: start.map((v) => v * 180 / Math.PI), duration_ms: 0, gripper_action: action } }));
      else {
        const goal = jogTarget.current!; jogDirty.current = false;
        ok = await perform("jog", "jog", (snapshot, start) => targetCall(snapshot, start, goal, "cartesian", 0, 0, false));
      }
      if (!ok) { jogDirty.current = false; jogTarget.current = null; pendingGripper.current = null; break; }
    }
  };
  const jogStep = (axis: number, sign: number) => {
    const state = latest.current;
    if (!state.jog || !state.enabled || !isFresh(state.telemetry, state.memory?.configuration ?? null)) return;
    const measuredTcp = state.telemetry!.message;
    const goal: Target = [...(jogTarget.current ?? [measuredTcp.tcp_position.x, measuredTcp.tcp_position.y,
      measuredTcp.tcp_position.z, measuredTcp.tcp_pitch_deg])] as Target;
    goal[axis] += sign * (axis === 3 ? state.pitchStep : state.step);
    jogTarget.current = goal; jogDirty.current = true; void pumpJog();
  };

  const makePreview = async (sequence: boolean) => {
    if (!config || (sequence && !preset)) return;
    abortPreview();
    const controller = new AbortController(); previewController.current = controller; setPreviewBusy(true);
    try {
      const start = startMode === "measured" ? (fresh ? telemetry!.message.hardware_joint_state.position : null)
        : manualStart.map((v) => v * Math.PI / 180);
      if (!start) throw new Error(tr("没有新鲜起点，可选择手动模拟起点", "No fresh start. Select a manual simulation start."));
      const request = { configuration: config, start_hw_rad: start, ...(sequence ? { preset } : { target, frame, duration_ms: duration, gripper, linear }) };
      const result = previewSchema.parse(await armRequest("preview", url, request, "POST", controller.signal));
      if (!controller.signal.aborted) { setPreview(result); setTime(0); setPlaying(false); log(`preview: ${result.point_count} points, ${result.duration_ms} ms`); }
    } catch (error) { if (!controller.signal.aborted) { setPreview(null); log(String(error)); } }
    finally { if (previewController.current === controller) setPreviewBusy(false); }
  };

  const insertPose = (mode: "insert" | "append" | "replace", actual = false) => {
    const value = actual ? (fresh ? measured : null) : pose;
    if (!value || !preset || !config) { log(tr("需要有效姿态与选中的预设", "Select a preset and a valid pose")); return; }
    const pointTarget = preset.coordinate_frame === "cartesian" ? value.tcp
      : preset.coordinate_frame === "joints" ? value.hardware_deg : value.link_deg;
    const points = [...preset.waypoints];
    let index = points.length;
    if (mode === "replace" && points[pointIndex]) { index = pointIndex;
      points[index] = { ...points[index], target: [...pointTarget, ...points[index].target.slice(4)] }; }
    else {
      index = mode === "append" ? points.length : Math.min(pointIndex + 1, points.length);
      points.splice(index, 0, { target: [...pointTarget], duration_ms: config.planning.default_duration_ms });
    }
    edit({ ...draft, [selected]: { ...preset, waypoints: points } }); setPointIndex(index);
  };

  const selectPoint = (name: string, index: number) => {
    setSelected(name); setPointIndex(index);
    const point = draft[name]?.waypoints[index]; if (!point) return;
    setFrame(draft[name].coordinate_frame); setTarget(point.target.slice(0, 4) as Target);
    setDuration(point.duration_ms); setGripper(point.gripper ?? 0); setLinear(point.linear ?? false);
    persist(draft, baseVersion, name, index);
  };
  const renamePreset = () => {
    const name = prompt(tr("新预设名称", "New preset name"), selected)?.trim();
    if (!name || name === selected || !preset) return;
    if (Object.hasOwn(draft, name)) { log("Duplicate preset name"); return; }
    const next = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key === selected ? name : key, value]));
    edit(next, name);
  };

  const currentCartesian = frame === "cartesian" ? target : pose?.tcp ?? lastPose?.tcp ?? [0, 0, 0, 0] as Target;
  const yaw = Math.atan2(currentCartesian[1], currentCartesian[0]) * 180 / Math.PI;
  const changeCartesian = (value: Target) => {
    if (frame !== "cartesian") { log(tr("先将控制输入切换为 Cartesian", "Switch control input to Cartesian first")); return; }
    setTarget(value);
  };
  const playback = preview ? (preview.points.find((point) => point.time_ms >= time) ?? preview.points.at(-1)!) : null;
  const stopped = stopAt !== null && fresh && telemetry!.received > stopAt && telemetry!.message.task_status === 0
    && telemetry!.message.hardware_joint_state.velocity.every((v) => typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 0.05);
  void tick; // Recheck reception and header freshness even when the stream stops.

  return <div className={`fruit-arm ${isMobile ? "fruit-arm-mobile" : ""}`}>
    <div className="fruit-arm-toolbar">
      <strong>{tr("机械臂", "Arm")}</strong><span>{connected ? tr("在线", "Online") : tr("离线", "Offline")} · {fresh ? tr("反馈新鲜", "Fresh feedback") : tr("反馈无效/过期", "Invalid/stale feedback")}</span>
      <button disabled={!connected || !memory || !fresh || busy} aria-pressed={enabled} onClick={() => {
        if (enabled) { if (jog && pending.current?.sent) void stop(); else clearInput(); }
        else if (confirm(tr("确认 mission 和其他运动客户端已停止，现场安全。启用真实机械臂控制？", "Confirm mission and other motion clients are stopped, and the area is safe. Enable real arm control?"))) setEnabled(true);
      }}>{enabled ? tr("停用控制", "Disable control") : tr("启用实机控制", "Enable real control")}</button>
      <button disabled={!connected} onClick={() => void stop()}>STOP</button>
      <button disabled={!connected} onClick={() => void stop(true)}>ESTOP</button>
      <span>{stopAt !== null ? (stopped ? tr("实测低速与 IDLE 已确认", "Measured low speed and IDLE confirmed") : tr("停稳未确认", "Standstill not confirmed")) : tr("预览不会运动", "Preview never moves hardware")}</span>
    </div>
    <div className="fruit-arm-columns">
      <aside className="fruit-arm-presets">
        <h3>{tr("预设与航点", "Presets and waypoints")}</h3>
        <select aria-label={tr("预设", "Preset")} value={selected} onChange={(event) => selectPoint(event.target.value, 0)}>
          <option value="">{tr("选择预设", "Select preset")}</option>{Object.keys(draft).map((name) => <option key={name}>{name}</option>)}
        </select>
        <div className="fruit-arm-actions">
          <button onClick={() => {
            const name = prompt(tr("新预设名称", "New preset name"))?.trim(); if (!name) return;
            if (Object.hasOwn(draft, name)) { log("Duplicate preset name"); return; }
            edit({ ...draft, [name]: { coordinate_frame: "cartesian", description: "", waypoints: [] } }, name); setPointIndex(0);
          }}>{tr("新建", "New")}</button>
          <button disabled={!preset} onClick={renamePreset}>{tr("改名", "Rename")}</button>
          <button disabled={!preset} onClick={() => { const name = prompt(tr("副本名称", "Copy name"), `${selected}_copy`)?.trim();
            if (name && !Object.hasOwn(draft, name)) edit({ ...draft, [name]: structuredClone(preset) }, name); }}>{tr("复制", "Copy")}</button>
          <button disabled={!preset} onClick={() => { if (confirm(tr("删除此草稿预设？", "Delete this draft preset?"))) {
            edit(Object.fromEntries(Object.entries(draft).filter(([key]) => key !== selected)), ""); setPointIndex(0); } }}>{tr("删除", "Delete")}</button>
        </div>
        {preset && <>
          <label>{tr("描述", "Description")}<textarea value={preset.description ?? ""} onChange={(event) => edit({ ...draft, [selected]: { ...preset, description: event.target.value } })} /></label>
          <label>{tr("预设坐标类型", "Preset coordinate frame")}<select value={preset.coordinate_frame} disabled={preset.waypoints.length > 0}
            onChange={(event) => edit({ ...draft, [selected]: { ...preset, coordinate_frame: event.target.value as CoordinateFrame } })}>
            <option>cartesian</option><option>link_angles</option><option>joints</option></select></label>
          <small>{tr("有航点后类型锁定。复制后手动转换，不重解释旧数字。", "Frame is locked after adding points. Convert manually in a copy.")}</small>
          <ol className="fruit-arm-point-list">{preset.waypoints.map((point, index) => <li key={index}>
            <button className={pointIndex === index ? "selected" : ""} onClick={() => selectPoint(selected, index)}>
              {index + 1}. {point.target.slice(0, 4).map((v) => fmt(v)).join(", ")}<small>{point.duration_ms} ms · {point.linear ? "LIN" : "PTP"} · {point.gripper ?? 0}</small>
            </button>
          </li>)}</ol>
          <div className="fruit-arm-actions">
            <button disabled={!waypoint || pointIndex === 0} onClick={() => { const points = [...preset.waypoints];
              [points[pointIndex - 1], points[pointIndex]] = [points[pointIndex], points[pointIndex - 1]];
              edit({ ...draft, [selected]: { ...preset, waypoints: points } }); setPointIndex(pointIndex - 1); }}>{tr("上移", "Up")}</button>
            <button disabled={!waypoint || pointIndex === preset.waypoints.length - 1} onClick={() => { const points = [...preset.waypoints];
              [points[pointIndex + 1], points[pointIndex]] = [points[pointIndex], points[pointIndex + 1]];
              edit({ ...draft, [selected]: { ...preset, waypoints: points } }); setPointIndex(pointIndex + 1); }}>{tr("下移", "Down")}</button>
            <button disabled={!waypoint} onClick={() => { edit({ ...draft, [selected]: { ...preset, waypoints: preset.waypoints.filter((_, i) => i !== pointIndex) } }); setPointIndex(Math.max(0, pointIndex - 1)); }}>{tr("删点", "Delete point")}</button>
          </div>
        </>}
        <div className="fruit-arm-actions">
          <button disabled={!pose || !preset} onClick={() => insertPose("insert")}>{tr("插入姿态", "Insert pose")}</button>
          <button disabled={!pose || !preset} onClick={() => insertPose("append")}>{tr("追加姿态", "Append pose")}</button>
          <button disabled={!pose || !waypoint} onClick={() => insertPose("replace")}>{tr("替换姿态", "Replace pose")}</button>
          <button disabled={!fresh || !measured || !preset} onClick={() => insertPose("append", true)}>{tr("追加实测点", "Teach measured pose")}</button>
          <button disabled={!history.length} onClick={() => { const previous = history.at(-1)!; setDraft(previous); setHistory(history.slice(0, -1));
            const name = previous[selected] ? selected : Object.keys(previous)[0] ?? ""; setSelected(name); setPointIndex(0); persist(previous, baseVersion, name, 0); }}>{tr("撤销", "Undo")}</button>
        </div>
        <p>{dirty ? tr("未保存草稿", "Unsaved draft") : tr("文件未修改", "File unchanged")} · {applied ? tr("预设已应用", "Presets applied") : tr("预设未应用/未知", "Presets not applied / unknown")}</p>
        {file && baseVersion !== file.version && <p role="alert">{tr("草稿基线与文件冲突，不会覆盖。", "Draft baseline conflicts with the file. No overwrite.")}</p>}
        {file && memory && file.file !== memory.config_path && <p role="alert">{tr("文件路径与 planner 路径不同，不能重载或执行此文件工序。", "Editor and planner paths differ. File reload and preset execution are blocked.")}</p>}
        {file && memory && (["geometry", "joint_mapping", "planning"] as const).some((key) => !same(file.configuration[key], memory.configuration[key]))
          && <p role="alert">{tr("只读配置与磁盘不同，需要停稳后重启。预览和实机控制使用运行配置。", "Read-only configuration differs from disk. Restart after standstill. Online preview and control use loaded configuration.")}</p>}
        <div className="fruit-arm-actions">
          <button disabled={!file || !validDraft || saving || !dirty} onClick={async () => {
            setSaving(true); const current = generation.current;
            try { const saved = documentSchema.parse(await armRequest("presets", url, { version: baseVersion, presets: draft }, "PUT"));
              if (current !== generation.current) return;
              setFile(saved); setBaseVersion(saved.version); persist(draft, saved.version); log(tr("已保存，尚未重载", "Saved, not reloaded"));
            } catch (error) { log(String(error)); } finally { if (current === generation.current) setSaving(false); }
          }}>{tr("保存文件", "Save file")}</button>
          <button disabled={!connected || busy || saving || file?.file !== memory?.config_path} onClick={async () => {
            const current = generation.current;
            try { const result = resultSchema.parse(await ctx.bridge.callService(ROOT + "reload_presets", {})); log(result.message);
              if (result.success) { const snapshot = await readMemory(); const doc = documentSchema.parse(await armRequest("document", url));
                if (current === generation.current) { setMemory(snapshot); setFile(doc); } }
            } catch (error) { log(String(error)); }
          }}>{tr("重载预设", "Reload presets")}</button>
          <button onClick={async () => {
            if (dirty && !confirm(tr("丢弃未保存草稿，重新加载文件？", "Discard unsaved draft and reload file?"))) return;
            const current = generation.current;
            try { const doc = documentSchema.parse(await armRequest("document", url));
              if (current !== generation.current) return;
              setFile(doc); setDraft(doc.configuration.presets); setBaseVersion(doc.version); setHistory([]);
              const name = Object.keys(doc.configuration.presets)[0] ?? ""; setSelected(name); setPointIndex(0); persist(doc.configuration.presets, doc.version, name, 0);
            } catch (error) { log(String(error)); }
          }}>{tr("重新加载文件", "Reload file")}</button>
        </div>
      </aside>

      <main className="fruit-arm-preview">
        <h3>{tr("姿态编辑与预览", "Pose authoring and preview")} <small>arm_base_link · {tr("真实解算位置（TCP）", "Real TCP")}</small></h3>
        {config ? <Arm2D config={config} measured={measured} pose={lastPose} valid={!!pose}
          target={currentCartesian} onChange={changeCartesian} step={step} en={en} /> : <p>{tr("正在读取机器端配置，需部署 HTTP API。", "Loading machine configuration. Deploy the HTTP API.")}</p>}
        <div className="fruit-arm-sliders">
          <label>{tr("左右 yaw", "Base yaw")} {fmt(yaw, 1)}°<input type="range" min={-180} max={180} step={0.5} value={yaw} disabled={frame !== "cartesian"}
            onChange={(event) => { const angle = Number(event.target.value) * Math.PI / 180; const radius = Math.hypot(target[0], target[1]);
              setTarget([radius * Math.cos(angle), radius * Math.sin(angle), target[2], target[3]]); }} /></label>
          <label>{tr("末端绝对 pitch", "Absolute tool pitch")} {fmt(currentCartesian[3], 1)}°<input type="range" min={-180} max={180} step={0.5} value={currentCartesian[3]} disabled={frame !== "cartesian"}
            onChange={(event) => setTarget([target[0], target[1], target[2], Number(event.target.value)])} /></label>
        </div>
        <small>{tr("原点 yaw=0。pitch=0 表示 a4 水平，不表示腕轴到 TCP 的斜线水平。", "Yaw is zero at origin. Pitch zero means horizontal a4, not a horizontal wrist-to-TCP diagonal.")}</small>
        <p className={pose ? "" : "fruit-arm-error"}>{pose ? `TCP: ${pose.tcp.map((v, i) => `${fmt(v)}${i === 3 ? "°" : "m"}`).join(" · ")}` : poseError || tr("目标等待校验", "Target awaiting validation")}</p>
        <Arm3D measured={measured} target={lastPose} playback={playback} path={preview} active={ctx.active} fontScale={fontScale} en={en} />
        <div className="fruit-arm-legend"><span style={{ color: "#52b8df" }}>{tr("虚线/蓝：实测", "Dashed/blue: measured")}</span><span style={{ color: "#dfad52" }}>{tr("橙：最后有效目标", "Orange: last valid target")}</span><span style={{ color: "#bb85e4" }}>{tr("紫：模拟路径", "Purple: simulated path")}</span></div>
        <label>{tr("预览起点", "Preview start")}<select value={startMode} onChange={(event) => setStartMode(event.target.value as typeof startMode)}>
          <option value="measured">{tr("新鲜实测快照", "Fresh measured snapshot")}</option><option value="manual">{tr("手动模拟硬件角", "Manual simulated hardware angles")}</option></select></label>
        {startMode === "manual" && <div className="fruit-arm-grid">{manualStart.map((value, i) => <NumberField key={i} label={`Q${i + 1} / °`} value={value}
          onChange={(next) => setManualStart(manualStart.map((old, j) => i === j ? next ?? NaN : old) as Target)} />)}</div>}
        <div className="fruit-arm-actions"><button disabled={!config || previewBusy} onClick={() => void makePreview(false)}>{tr("预览当前目标", "Preview target")}</button>
          <button disabled={!config || !preset || previewBusy} onClick={() => void makePreview(true)}>{tr("预览草稿工序", "Preview draft sequence")}</button>
          <button disabled={!preview} onClick={() => { if (preview && time >= preview.duration_ms) setTime(0); setPlaying(!playing); }}>{playing ? tr("暂停", "Pause") : tr("模拟播放", "Play simulation")}</button></div>
        {preview && <><input aria-label={tr("模拟时间轴", "Simulation timeline")} type="range" min={0} max={preview.duration_ms} value={time} step={1} onChange={(event) => { setPlaying(false); setTime(Number(event.target.value)); }} />
          <p>{preview.point_count} / {memory?.max_trajectory_points ?? 64} {tr("点", "points")} · {Math.round(time)} / {preview.duration_ms} ms · {tr("夹爪事件", "gripper events")}: {preview.points.filter((p) => p.gripper !== 0).map((p) => `${p.time_ms}ms:${p.gripper}`).join(", ") || "HOLD"}</p></>}
        <small>{tr("按离散轨迹点播放，不检测碰撞。实机从执行时的反馈重新规划，不执行动画帧。", "Playback uses discrete points, without collision detection. Execution replans from measured feedback, not animation frames.")}</small>
      </main>

      <aside className="fruit-arm-controls">
        <h3>{tr("单姿态控制", "Single-pose control")}</h3>
        <label>{tr("输入坐标", "Input coordinates")}<select value={frame} onChange={(event) => {
          const next = event.target.value as CoordinateFrame;
          if (!pose) { log(tr("先校验当前姿态再转换输入类型", "Validate current pose before converting input frame")); return; }
          setFrame(next); setLinear(false); setTarget(next === "cartesian" ? pose.tcp : next === "joints" ? pose.hardware_deg : pose.link_deg);
        }}><option>cartesian</option><option>link_angles</option><option>joints</option></select></label>
        <div className="fruit-arm-grid">{target.map((value, i) => <NumberField key={i} label={frame === "cartesian" ? ["X / m", "Y / m", "Z / m", "pitch / °"][i] : `${frame === "joints" ? "motor" : "link"} ${i + 1} / °`}
          value={value} onChange={(next) => setTarget(target.map((old, j) => i === j ? next ?? NaN : old) as Target)} />)}</div>
        <NumberField label={tr("时长 ms，0=默认", "Duration ms, 0=default")} value={duration} min={0} step={1} onChange={(next) => setDuration(next ?? NaN)} />
        <label>{tr("目标夹爪动作", "Target gripper action")}<select value={gripper} onChange={(event) => setGripper(Number(event.target.value))}><option value={0}>HOLD</option><option value={1}>OPEN</option><option value={2}>CLOSE</option></select></label>
        <label><input type="checkbox" checked={linear} disabled={frame !== "cartesian"} onChange={(event) => setLinear(event.target.checked)} />LIN {tr("否则 PTP", "otherwise PTP")}</label>
        <small>{tr("Cartesian 强制高位构型。link 2 从竖直起算，link 3/4 为绝对角。硬件 Q3 包含肩部耦合。", "Cartesian forces elbow-up. Link 2 starts at vertical, links 3/4 are absolute. Hardware Q3 includes shoulder coupling.")}</small>
        <div className="fruit-arm-actions">
          <button disabled={!canMove || !pose || jog || !Number.isInteger(duration) || duration < 0 || duration > 0xFFFFFFFF || (linear && frame !== "cartesian")}
            onClick={() => void perform("manual", "pose", (snapshot, start) => targetCall(snapshot, start, [...target], frame, duration, gripper, linear))}>{tr("执行当前姿态", "Execute current pose")}</button>
          <button disabled={!canMove || jog || !memory?.configuration.presets.home} onClick={() => void perform("manual", "home", async (snapshot, start) => {
            previewSchema.parse(await armRequest("preview", url, { configuration: snapshot.configuration, start_hw_rad: start, preset: snapshot.configuration.presets.home }));
            return { service: "home", request: {} };
          })}>Home</button>
          <button disabled={!canMove || jog || !preset || dirty || !applied} onClick={() => void perform("manual", `preset ${selected}`, async (snapshot, start) => {
            const currentFile = documentSchema.parse(await armRequest("document", url));
            if (currentFile.presets_revision !== snapshot.presets_revision || !same(preset, snapshot.configuration.presets[selected])) throw new Error("Save and reload this preset first");
            previewSchema.parse(await armRequest("preview", url, { configuration: snapshot.configuration, start_hw_rad: start, preset }));
            return { service: "execute_preset", request: { preset_name: selected } };
          })}>{tr("执行已应用工序", "Execute applied preset")}</button>
        </div>
        <small>{tr("单姿态不执行驻留/途经点属性；完整工序必须保存并重载。", "Single-pose execution excludes dwell/via-point semantics. Save and reload full sequences.")}</small>
        <div className="fruit-arm-actions">{["HOLD", "OPEN", "CLOSE"].map((name, action) => <button key={name} disabled={!enabled || !fresh || (busy && !jog)} onClick={() => {
          if (jog) { pendingGripper.current = action; void pumpJog(); }
          else void perform("manual", `gripper ${name}`, async (_snapshot, start) => ({ service: "move_joints", request: { joints_deg: start.map((v) => v * 180 / Math.PI), duration_ms: 0, gripper_action: action } }));
        }}>{name}</button>)}</div>
        <h3>Jog</h3>
        <button aria-pressed={jog} disabled={!enabled || !fresh || (busy && !jog)} onClick={() => {
          if (jog) { if (pending.current?.sent) void stop(); else { setJog(false); jogDirty.current = false; jogTarget.current = null; pendingGripper.current = null; } }
          else { jogTarget.current = null; setJog(true); }
        }}>{jog ? tr("停用 jog", "Disable jog") : tr("启用 jog", "Enable jog")}</button>
        <div className="fruit-arm-grid"><NumberField label="XYZ / m" value={step} min={0.0001} onChange={(value) => { if (value !== undefined && Number.isFinite(value) && value > 0 && value <= 0.1) { setStep(value); ctx.onPluginStateChange("fruit-arm", { presets: draft, baseVersion, selected, step: value, pitchStep }); } }} />
          <NumberField label="pitch / °" value={pitchStep} min={0.1} onChange={(value) => { if (value !== undefined && Number.isFinite(value) && value > 0 && value <= 30) { setPitchStep(value); ctx.onPluginStateChange("fruit-arm", { presets: draft, baseVersion, selected, step, pitchStep: value }); } }} /></div>
        <div className="fruit-arm-jog" tabIndex={0} aria-label={tr("Jog 控制区", "Jog control area")} onKeyDown={(event) => {
          if ((event.target as HTMLElement).matches("input,textarea,select")) return;
          const keys: Record<string, [number, number]> = { ArrowLeft: [1, 1], ArrowRight: [1, -1], ArrowUp: [0, 1], ArrowDown: [0, -1], a: [2, 1], z: [2, -1], s: [3, 1], x: [3, -1] };
          const change = keys[event.key]; if (change) { event.preventDefault(); jogStep(...change); }
          if (event.key === "t") { event.preventDefault(); void stop(); }
          if (event.key === "e") { event.preventDefault(); void stop(true); }
        }}>{["X", "Y", "Z", "pitch"].map((axis, i) => <div key={axis}><span>{axis}</span><button disabled={!jog || !enabled || !fresh} onClick={() => jogStep(i, -1)}>−</button><button disabled={!jog || !enabled || !fresh} onClick={() => jogStep(i, 1)}>+</button></div>)}</div>
        <small>{tr("聚焦上方 jog 区：方向键 XY，a/z 高度，s/x pitch，t/e STOP/ESTOP。仅累计最新目标。", "Focus jog area: arrows XY, a/z Z, s/x pitch, t/e STOP/ESTOP. Only the latest accumulated target is submitted.")}</small>
        {waypoint && <><h3>{tr("草稿航点属性", "Draft waypoint properties")}</h3>
          <div className="fruit-arm-grid">{waypoint.target.slice(0, 4).map((value, i) => <NumberField key={i} label={preset.coordinate_frame === "cartesian" ? ["X / m", "Y / m", "Z / m", "pitch / °"][i] : `angle ${i + 1} / °`} value={value}
            onChange={(next) => editWaypoint({ target: waypoint.target.map((old, j) => i === j ? next ?? NaN : old) })} />)}</div>
          <NumberField label="duration_ms" value={waypoint.duration_ms} min={1} step={1} onChange={(next) => editWaypoint({ duration_ms: next ?? NaN })} />
          <NumberField label={tr("dwell_ms，留空=默认", "dwell_ms, blank=default")} value={waypoint.dwell_ms} min={0} step={1} onChange={(next) => {
            const point = { ...waypoint }; if (next === undefined) delete point.dwell_ms; else point.dwell_ms = next;
            const points = preset.waypoints.map((old, i) => i === pointIndex ? point : old); edit({ ...draft, [selected]: { ...preset, waypoints: points } });
          }} />
          <label>gripper<select value={waypoint.gripper ?? 0} onChange={(event) => editWaypoint({ gripper: Number(event.target.value) })}><option value={0}>HOLD</option><option value={1}>OPEN</option><option value={2}>CLOSE</option></select></label>
          <label><input type="checkbox" checked={waypoint.linear ?? false} disabled={preset.coordinate_frame !== "cartesian" && !waypoint.linear} onChange={(event) => editWaypoint({ linear: event.target.checked })} />linear (LIN)</label>
          <label><input type="checkbox" checked={waypoint.is_via_point ?? false} onChange={(event) => editWaypoint({ is_via_point: event.target.checked })} />is_via_point</label>
        </>}
        <h3>{tr("实测遥测", "Measured telemetry")}</h3>
        {telemetry && <div className="fruit-arm-telemetry"><p>trajectory_id={telemetry.message.trajectory_id} · status={telemetry.message.task_status} · progress={fmt(telemetry.message.progress)}</p>
          <p>gripper={telemetry.message.gripper_state} · error_code={telemetry.message.error_code}</p>
          <p>{tr("硬件角 °", "Hardware °")}: {telemetry.message.hardware_joint_state.position.map((v) => fmt(v * 180 / Math.PI, 2)).join(", ")}</p>
          <p>{tr("模型角 °", "Model °")}: {telemetry.message.model_joint_state.position.map((v) => fmt(v * 180 / Math.PI, 2)).join(", ")}</p>
          <p>{tr("原始速度 rad/s", "Raw velocity rad/s")}: {telemetry.message.hardware_joint_state.velocity.map((v) => typeof v === "number" ? fmt(v) : "?").join(", ")}</p>
          <p>TCP: {[telemetry.message.tcp_position.x, telemetry.message.tcp_position.y, telemetry.message.tcp_position.z].map((v) => fmt(v)).join(", ")} m · {fmt(telemetry.message.tcp_pitch_deg, 2)}°</p></div>}
        {pose && <details><summary>{tr("目标角度", "Target angles")}</summary><p>hardware °: {pose.hardware_deg.map((v) => fmt(v, 2)).join(", ")}</p><p>link °: {pose.link_deg.map((v) => fmt(v, 2)).join(", ")}</p></details>}
        <details><summary>{tr("只读配置与版本", "Read-only configuration and versions")}</summary><p>file: {file?.file}</p><p>loaded: {memory?.config_path ?? "?"}</p><p>file revision: {file?.revision.slice(0, 12) ?? "?"}</p><p>loaded revision: {memory?.revision.slice(0, 12) ?? "?"}</p>
          <pre>{JSON.stringify(config && { geometry: config.geometry, joint_mapping: config.joint_mapping, planning: config.planning }, null, 2)}</pre></details>
        <button disabled={!connected} onClick={async () => { const current = generation.current; try { const snapshot = await readMemory(); if (current === generation.current) setMemory(snapshot); } catch (error) { log(String(error)); } }}>{tr("刷新运行配置", "Refresh loaded configuration")}</button>
      </aside>
    </div>
    <footer className="fruit-arm-debug"><label>{tr("网页诊断", "Web diagnostics")}<select value={level} onChange={(event) => setLevel(event.target.value as typeof level)}><option>info</option><option>debug</option><option>trace</option></select></label>
      <button onClick={() => { const blob = new Blob([events.join("\n") + "\n"], { type: "text/plain" }); const href = URL.createObjectURL(blob);
        const link = document.createElement("a"); link.href = href; link.download = `fruit-arm-${new Date().toISOString().replaceAll(":", "-")}.log`; link.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
      }}>{tr("下载诊断", "Download diagnostics")}</button><button onClick={() => setEvents([])}>{tr("清空", "Clear")}</button>
      <small>{tr("日志级别仅控制网页订阅与显示，不修改 planner 日志级别。浏览器与机器人需同步时钟。", "Log level controls web subscriptions only. It does not change planner logging. Synchronize browser and robot clocks.")}</small>
      <pre aria-live="polite">{events.slice(-20).join("\n")}</pre>
    </footer>
  </div>;
}

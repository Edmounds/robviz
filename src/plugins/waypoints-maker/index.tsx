/** 项目插件：航点录制、编辑和逐段试跑。 */
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Odometry, TFMessage } from "../../core/types";
import type { PluginContext, PluginSectionProps, RobvizPlugin } from "../types";

const COMMAND_TOPIC = "/fruit/waypoint_maker/command";
const STATE_TOPIC = "/fruit/waypoint_maker/state";
const PROMPT_TOPIC = "/fruit_waypoint_recorder/prompt";
const MARKER_TOPIC = "/fruit/waypoint_maker/markers";
const ODOM_TOPIC = "/odometry";
const ODOM_SCHEMA = "nav_msgs/msg/Odometry";
const POINT_TYPES = ["waypoint", "goal"] as const;

type PointType = (typeof POINT_TYPES)[number];

interface MakerPluginState {
  name: string;
  pointType: PointType;
  overwrite: boolean;
}

interface WaypointPoint {
  name: string;
  type: PointType;
  position?: { x: number; y: number; z: number };
  yaw?: number;
}

interface TemplateEntry {
  name: string;
  type: PointType;
  recorded: boolean;
  point?: WaypointPoint;
}

interface RecorderState {
  status: string;
  message: string;
  fileId: string;
  formal: boolean;
  version: string;
  diskVersion?: string;
  diskSynced?: boolean;
  dirty: boolean;
  points: WaypointPoint[];
  lastBackupPath: string;
  waypoints: {
    count: number;
    cursor: number;
    nextGoal: string;
    nextName: string;
    template: TemplateEntry[];
  };
  navigation: {
    active: boolean;
    goalAccepted: boolean;
    cancelRequested: boolean;
    awaitingStandstill: boolean;
    cursor: number;
    nextGoal: string;
  };
}

interface BoundRouteQueue {
  fileId: string;
  version: string;
  names: string[];
}

interface OdomStatus {
  receivedAt: number;
  linear: number;
  angular: number;
}

const DEFAULT_MAKER_STATE: MakerPluginState = {
  name: "",
  pointType: "goal",
  overwrite: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readMakerState(raw: unknown): MakerPluginState {
  if (!isRecord(raw)) return { ...DEFAULT_MAKER_STATE };
  const pointType = raw.pointType;
  return {
    name: typeof raw.name === "string" ? raw.name : DEFAULT_MAKER_STATE.name,
    pointType: POINT_TYPES.includes(pointType as PointType)
      ? (pointType as PointType)
      : DEFAULT_MAKER_STATE.pointType,
    overwrite: typeof raw.overwrite === "boolean" ? raw.overwrite : DEFAULT_MAKER_STATE.overwrite,
  };
}

function readPoint(raw: unknown): WaypointPoint | undefined {
  if (!isRecord(raw) || typeof raw.name !== "string" || !POINT_TYPES.includes(raw.type as PointType)) {
    return undefined;
  }
  const position = isRecord(raw.position)
    && typeof raw.position.x === "number"
    && typeof raw.position.y === "number"
    && typeof raw.position.z === "number"
    ? { x: raw.position.x, y: raw.position.y, z: raw.position.z }
    : undefined;
  return {
    name: raw.name,
    type: raw.type as PointType,
    position,
    yaw: typeof raw.yaw === "number" ? raw.yaw : undefined,
  };
}

export function readRecorderState(raw: unknown): RecorderState | undefined {
  let data: unknown = raw;
  if (isRecord(raw) && typeof raw.data === "string") {
    try {
      data = JSON.parse(raw.data);
    } catch {
      return undefined;
    }
  }
  if (!isRecord(data) || !isRecord(data.waypoints) || !isRecord(data.navigation)) return undefined;
  const waypoints = data.waypoints;
  const navigation = data.navigation;
  const points = Array.isArray(data.points)
    ? data.points.map(readPoint).filter((point): point is WaypointPoint => point !== undefined)
    : [];
  const template = Array.isArray(waypoints.template)
    ? waypoints.template.flatMap((item): TemplateEntry[] => {
        if (!isRecord(item) || typeof item.name !== "string" || !POINT_TYPES.includes(item.type as PointType)) return [];
        const point = readPoint(item.point);
        return [{
          name: item.name,
          type: item.type as PointType,
          recorded: item.recorded === true,
          ...(point ? { point } : {}),
        }];
      })
    : [];
  return {
    status: typeof data.status === "string" ? data.status : "idle",
    message: typeof data.message === "string" ? data.message : "",
    fileId: typeof data.file_id === "string" ? data.file_id : "",
    formal: data.formal === true,
    version: typeof data.version === "string" ? data.version : "",
    diskVersion: typeof data.disk_version === "string" ? data.disk_version : undefined,
    diskSynced: typeof data.disk_synced === "boolean" ? data.disk_synced : true,
    dirty: data.dirty === true,
    points,
    lastBackupPath: typeof data.last_backup_path === "string" ? data.last_backup_path : "",
    waypoints: {
      count: typeof waypoints.count === "number" ? waypoints.count : points.length,
      cursor: typeof waypoints.cursor === "number" ? waypoints.cursor : 0,
      nextGoal: typeof waypoints.next_goal === "string" ? waypoints.next_goal : "",
      nextName: typeof waypoints.next_name === "string" ? waypoints.next_name : "",
      template,
    },
    navigation: {
      active: navigation.active === true,
      goalAccepted: navigation.goal_accepted === true,
      cancelRequested: navigation.cancel_requested === true,
      awaitingStandstill: navigation.awaiting_standstill === true,
      cursor: typeof navigation.cursor === "number" ? navigation.cursor : 0,
      nextGoal: typeof navigation.next_goal === "string" ? navigation.next_goal : "",
    },
  };
}

function canWrite(ctx: PluginContext): boolean {
  return ctx.active && ctx.connectionState === "open";
}

function MakerSection({ ctx }: PluginSectionProps) {
  const stored = readMakerState(ctx.pluginStates["waypoints-maker"]);
  const [recorder, setRecorder] = useState<RecorderState>();
  const [prompt, setPrompt] = useState("");
  const [name, setName] = useState(stored.name);
  const [pointType, setPointType] = useState<PointType>(stored.pointType);
  const [overwrite, setOverwrite] = useState(stored.overwrite);
  const [directTarget, setDirectTarget] = useState("");
  const [routeQueue, setRouteQueue] = useState<BoundRouteQueue>({ fileId: "", version: "", names: [] });
  const [filePending, setFilePending] = useState(false);
  const [localError, setLocalError] = useState("");
  const [odom, setOdom] = useState<OdomStatus>();
  const [lastTfAt, setLastTfAt] = useState(0);
  const [poseTick, setPoseTick] = useState(0);

  const odomTopic = useMemo(
    () => ctx.topics.find((topic) => topic.topic === ODOM_TOPIC && topic.schemaName === ODOM_SCHEMA)?.topic
      ?? ctx.topics.find((topic) => topic.schemaName === ODOM_SCHEMA)?.topic
      ?? ODOM_TOPIC,
    [ctx.topics],
  );
  const currentPose = useMemo(() => {
    void poseTick;
    return ctx.tf.lookup("odom", "base_link", 0);
  }, [ctx.tf, poseTick]);

  useEffect(() => {
    const unsubscribeState = ctx.bridge.subscribe(STATE_TOPIC, (payload) => {
      if (payload.kind !== "raw") return;
      setRecorder(readRecorderState(payload.message));
      setFilePending(false);
    });
    const unsubscribePrompt = ctx.bridge.subscribe(PROMPT_TOPIC, (payload) => {
      if (payload.kind !== "raw") return;
      const message = payload.message as { data?: unknown };
      if (typeof message.data === "string") setPrompt(message.data);
      setFilePending(false);
    });
    const unsubscribeTf = ctx.bridge.subscribe("/tf", (payload) => {
      if (payload.kind !== "raw") return;
      const message = payload.message as TFMessage;
      if (message.transforms?.some((item) => item.header?.frame_id === "odom" && item.child_frame_id === "base_link")) {
        setLastTfAt(Date.now());
      }
    });
    return () => {
      unsubscribeState();
      unsubscribePrompt();
      unsubscribeTf();
    };
  }, [ctx.bridge]);

  useEffect(() => {
    const unsubscribe = ctx.bridge.subscribe(odomTopic, (payload) => {
      if (payload.kind !== "raw") return;
      const message = payload.message as Odometry;
      const linear = message.twist?.twist?.linear;
      const angular = message.twist?.twist?.angular;
      if (!linear || !angular) return;
      setOdom({
        receivedAt: Date.now(),
        linear: Math.hypot(linear.x, linear.y, linear.z),
        angular: Math.hypot(angular.x, angular.y, angular.z),
      });
    }, { maxFrequency: 10 });
    return unsubscribe;
  }, [ctx.bridge, odomTopic]);

  useEffect(() => {
    const timer = window.setInterval(() => setPoseTick((value) => value + 1), 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => setName(stored.name), [stored.name]);
  useEffect(() => setPointType(stored.pointType), [stored.pointType]);
  useEffect(() => setOverwrite(stored.overwrite), [stored.overwrite]);

  const persist = useCallback((next: Partial<MakerPluginState>) => {
    ctx.onPluginStateChange("waypoints-maker", { ...readMakerState(ctx.pluginStates["waypoints-maker"]), ...next });
  }, [ctx]);

  useEffect(() => {
    if (recorder?.formal && name && !recorder.waypoints.template.some((entry) => entry.name === name)) {
      setName("");
      persist({ name: "" });
    }
  }, [name, persist, recorder?.fileId, recorder?.formal, recorder?.waypoints.template]);

  useEffect(() => {
    if (recorder?.fileId || recorder?.version) {
      setRouteQueue((prev) => {
        if (prev.names.length > 0 && (prev.fileId !== recorder.fileId || prev.version !== recorder.version)) {
          return { fileId: recorder.fileId, version: recorder.version, names: [] };
        }
        return prev;
      });
      setDirectTarget((prev) => {
        const recorded = (recorder.points ?? []).map((p) => p.name);
        return recorded.includes(prev) ? prev : "";
      });
    }
  }, [recorder?.fileId, recorder?.version, recorder?.points]);

  const send = (command: Record<string, unknown>): boolean => {
    if (!canWrite(ctx)) {
      setLocalError(ctx.locale === "en" ? "Active online session required" : "需要活动且在线的机器会话");
      setFilePending(false);
      return false;
    }
    try {
      ctx.bridge.publish(COMMAND_TOPIC, "std_msgs/msg/String", { data: JSON.stringify(command) });
      setLocalError("");
      return true;
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : String(error));
      setFilePending(false);
      return false;
    }
  };

  const formal = recorder?.formal === true;
  const template = recorder?.waypoints.template ?? [];
  const effectiveName = name.trim() || recorder?.waypoints.nextName || "";
  const selectedTemplate = template.find((entry) => entry.name === effectiveName);
  const effectiveType = formal ? selectedTemplate?.type ?? pointType : pointType;
  const existing = recorder?.points.some((point) => point.name === effectiveName) === true;
  const recordedNames = useMemo(
    () => (recorder?.points ?? []).map((p) => p.name),
    [recorder?.points]
  );
  const effectiveDirectTarget = (directTarget && recordedNames.includes(directTarget))
    ? directTarget
    : (recordedNames[0] || "");
  const odomAgeMs = odom ? Date.now() - odom.receivedAt : Number.POSITIVE_INFINITY;
  const tfAgeMs = lastTfAt > 0 ? Date.now() - lastTfAt : Number.POSITIVE_INFINITY;
  const odomFresh = odomAgeMs <= 1500;
  const tfFresh = tfAgeMs <= 1500;
  const poseAvailable = currentPose !== undefined && tfFresh && odomFresh;
  const markerAdvertised = ctx.topics.some((topic) => topic.topic === MARKER_TOPIC);
  const busy = recorder?.status === "sampling" || recorder?.navigation.active === true;
  const navigationActive = recorder?.navigation.active === true;

  const record = () => {
    if (!effectiveName) {
      setLocalError(ctx.locale === "en" ? "Select or enter a waypoint name" : "请选择或输入航点名称");
      return;
    }
    if (formal && !selectedTemplate) {
      setLocalError(ctx.locale === "en" ? "Select a template name" : "请选择模板名称");
      return;
    }
    if (existing && !overwrite) {
      setLocalError(ctx.locale === "en" ? "Enable overwrite confirmation first" : "请先启用覆盖确认");
      return;
    }
    if (existing && !window.confirm(ctx.locale === "en" ? `Overwrite ${effectiveName}?` : `确认覆盖 ${effectiveName}？`)) return;
    send({
      command: "record",
      mode: "waypoints",
      name: effectiveName,
      point_type: effectiveType,
      confirm_overwrite: overwrite,
      auto_name: false,
    });
  };

  const runToTarget = () => {
    if (filePending || !recorder?.fileId || !recorder?.version) {
      setLocalError(ctx.locale === "en" ? "Waypoint file is loading" : "航点文件加载中");
      return;
    }
    if (!effectiveDirectTarget) {
      setLocalError(ctx.locale === "en" ? "No recorded waypoint selected" : "未选择已录制航点");
      return;
    }
    send({
      command: "run_to_waypoint",
      file_id: recorder.fileId,
      version: recorder.version,
      name: effectiveDirectTarget,
    });
  };

  const addToQueue = () => {
    if (filePending || !recorder?.fileId || !recorder?.version || !effectiveDirectTarget) return;
    setRouteQueue((prev) => {
      if (prev.fileId !== recorder.fileId || prev.version !== recorder.version) {
        return { fileId: recorder.fileId, version: recorder.version, names: [effectiveDirectTarget] };
      }
      return { ...prev, names: [...prev.names, effectiveDirectTarget] };
    });
  };

  const clearQueue = () => {
    setRouteQueue({ fileId: recorder?.fileId ?? "", version: recorder?.version ?? "", names: [] });
  };

  const removeFromQueue = (index: number) => {
    setRouteQueue((prev) => ({
      ...prev,
      names: prev.names.filter((_, i) => i !== index),
    }));
  };

  const runRoute = () => {
    if (filePending || !recorder?.fileId || !recorder?.version) {
      setLocalError(ctx.locale === "en" ? "Waypoint file is loading" : "航点文件加载中");
      return;
    }
    if (routeQueue.names.length === 0) {
      setLocalError(ctx.locale === "en" ? "Route queue is empty" : "路径队列为空");
      return;
    }
    if (routeQueue.fileId !== recorder.fileId || routeQueue.version !== recorder.version) {
      setLocalError(ctx.locale === "en" ? "Queue expired due to file or version change" : "队列因航点文件或版本变化已失效");
      setRouteQueue({ fileId: recorder.fileId, version: recorder.version, names: [] });
      return;
    }
    send({
      command: "run_route",
      file_id: recorder.fileId,
      version: recorder.version,
      names: routeQueue.names,
    });
  };

  const loadFile = (fileId: string) => {
    if (fileId === recorder?.fileId) return;
    if (recorder?.dirty && !window.confirm(ctx.locale === "en" ? "Discard unsaved waypoint changes?" : "放弃未保存的航点修改？")) return;
    setFilePending(true);
    setRouteQueue({ fileId: "", version: "", names: [] });
    setDirectTarget("");
    send({ command: "load_waypoint_file", file_id: fileId, confirm_discard: true });
  };

  const reloadFile = () => {
    if (recorder?.dirty && !window.confirm(ctx.locale === "en" ? "Discard unsaved waypoint changes?" : "放弃未保存的航点修改？")) return;
    setFilePending(true);
    setRouteQueue({ fileId: "", version: "", names: [] });
    setDirectTarget("");
    send({ command: "reload", confirm_discard: true });
  };

  const statusText = ctx.connectionState !== "open"
    ? (ctx.locale === "en" ? "Disconnected" : "未连接")
    : recorder?.status ?? (ctx.locale === "en" ? "Waiting for recorder" : "等待录点器状态");
  const poseText = poseAvailable && currentPose
    ? `${currentPose.translation.x.toFixed(3)}, ${currentPose.translation.y.toFixed(3)}`
    : "N/A";
  const en = ctx.locale === "en";

  return (
    <div className="waypoint-maker">
      <div className="waypoint-maker-status">
        <span className={`session-status ${ctx.connectionState}`} aria-hidden="true" />
        <span>{statusText}</span>
        <span className="waypoint-maker-spacer" />
        {recorder?.diskSynced === false && (
          <span className="waypoint-maker-dirty" title={en ? "Disk file was modified externally" : "磁盘文件已变化，请重载"}>
            {en ? "Disk modified" : "磁盘已变"}
          </span>
        )}
        <span className={recorder?.dirty ? "waypoint-maker-dirty" : "side-label"}>
          {recorder?.dirty ? (en ? "Unsaved" : "未保存") : (en ? "Saved" : "已保存")}
        </span>
      </div>

      <div className="side-row">
        <label className="side-label" htmlFor="waypoint-maker-file">{en ? "File" : "文件"}</label>
        <select
          id="waypoint-maker-file"
          className="topic-input"
          value={recorder?.fileId || "odom"}
          onChange={(event) => loadFile(event.target.value)}
          disabled={!canWrite(ctx) || busy || filePending}
        >
          <option value="odom">odom / formal</option>
          <option value="debug">odom / debug</option>
        </select>
      </div>

      <div className="side-row">
        <label className="side-label" htmlFor="waypoint-maker-name">{en ? "Name" : "名称"}</label>
        {formal ? (
          <select
            id="waypoint-maker-name"
            className="topic-input"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              persist({ name: event.target.value });
            }}
            disabled={!canWrite(ctx) || busy}
          >
            <option value="">{recorder?.waypoints.nextName || (en ? "Select" : "选择")}</option>
            {template.map((entry) => (
              <option key={entry.name} value={entry.name}>
                {entry.name} · {entry.recorded ? "saved" : "missing"}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="waypoint-maker-name"
            className="topic-input"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              persist({ name: event.target.value });
            }}
            disabled={!canWrite(ctx) || busy}
            spellCheck={false}
          />
        )}
      </div>

      <div className="side-row">
        <label className="side-label" htmlFor="waypoint-maker-type">{en ? "Type" : "类型"}</label>
        <select
          id="waypoint-maker-type"
          className="topic-input"
          value={effectiveType}
          onChange={(event) => {
            const next = event.target.value as PointType;
            setPointType(next);
            persist({ pointType: next });
          }}
          disabled={formal || !canWrite(ctx) || busy}
        >
          {POINT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      <div className="side-row waypoint-maker-check-row">
        <label className="side-label">
          <input
            type="checkbox"
            checked={overwrite}
            onChange={(event) => {
              setOverwrite(event.target.checked);
              persist({ overwrite: event.target.checked });
            }}
            disabled={!canWrite(ctx) || busy}
          />
          {en ? "Confirm overwrite" : "允许覆盖"}
        </label>
        <span className="side-label">{poseAvailable ? `odom ${poseText}` : "odom N/A"}</span>
      </div>

      <div className="waypoint-maker-actions">
        <button type="button" onClick={record} disabled={!canWrite(ctx) || busy || !poseAvailable}>
          {en ? "Record" : "录点"}
        </button>
        <button type="button" onClick={() => send({ command: "undo" })} disabled={!canWrite(ctx) || busy}>
          {en ? "Undo" : "撤销"}
        </button>
        <button type="button" onClick={reloadFile} disabled={!canWrite(ctx) || busy || filePending}>
          {en ? "Reload" : "重载"}
        </button>
        <button type="button" onClick={() => send({ command: "save" })} disabled={!canWrite(ctx) || busy}>
          {en ? "Save" : "保存"}
        </button>
      </div>

      <div className="side-row">
        <label className="side-label" htmlFor="waypoint-maker-direct">{en ? "Target" : "直达目标"}</label>
        <select
          id="waypoint-maker-direct"
          className="topic-input"
          value={effectiveDirectTarget}
          onChange={(event) => setDirectTarget(event.target.value)}
          disabled={!canWrite(ctx) || busy || filePending || recordedNames.length === 0}
        >
          {recordedNames.length === 0 ? (
            <option value="">{en ? "No recorded points" : "无已录制航点"}</option>
          ) : (
            recordedNames.map((pName) => (
              <option key={pName} value={pName}>{pName}</option>
            ))
          )}
        </select>
      </div>

      <div className="waypoint-maker-actions">
        <button
          type="button"
          onClick={runToTarget}
          disabled={!canWrite(ctx) || busy || filePending || !effectiveDirectTarget || !recorder?.fileId || !recorder?.version}
          title={en ? "Navigate directly to target in straight line" : "从当前位置直线导航前往该目标点"}
        >
          {en ? "Go to point" : "前往该点"}
        </button>
        <button
          type="button"
          onClick={addToQueue}
          disabled={!canWrite(ctx) || busy || filePending || !effectiveDirectTarget || !recorder?.fileId || !recorder?.version}
          title={en ? "Add point to continuous route queue" : "将该点追加到连续路径队列"}
        >
          {en ? "+ Add queue" : "+ 加入队列"}
        </button>
      </div>

      {routeQueue.names.length > 0 && (
        <div className="waypoint-maker-queue-card">
          <div className="waypoint-maker-queue-title">
            <span>{en ? `Queue (${routeQueue.names.length})` : `连续路径队列 (${routeQueue.names.length}点)`}</span>
            <button
              type="button"
              className="queue-clear-btn"
              onClick={clearQueue}
              disabled={busy || filePending}
            >
              {en ? "Clear" : "清空"}
            </button>
          </div>
          <div className="waypoint-maker-queue-tags">
            {routeQueue.names.map((pointName, index) => (
              <span key={`${pointName}-${index}`} className="waypoint-queue-tag">
                <span className="tag-index">{index + 1}.</span> {pointName}
                <button
                  type="button"
                  className="tag-remove"
                  onClick={() => removeFromQueue(index)}
                  disabled={busy || filePending}
                  title={en ? "Remove" : "移除"}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <button
            type="button"
            className="queue-run-btn"
            onClick={runRoute}
            disabled={!canWrite(ctx) || busy || filePending || routeQueue.names.length === 0 || routeQueue.fileId !== recorder?.fileId || routeQueue.version !== recorder?.version}
          >
            {en ? `Run route queue (${routeQueue.names.length})` : `执行连续路径 (${routeQueue.names.length}点)`}
          </button>
        </div>
      )}

      <div className="waypoint-maker-actions">
        <button
          type="button"
          onClick={() => send({ command: "run_next_test" })}
          disabled={!canWrite(ctx) || busy || !recorder?.waypoints.nextGoal}
        >
          {en ? "Run next goal" : "运行下一段"}
        </button>
        <button
          type="button"
          onClick={() => send({ command: "reset_test_cursor" })}
          disabled={!canWrite(ctx) || busy}
        >
          {en ? "Reset cursor" : "复位游标"}
        </button>
        <button
          type="button"
          onClick={() => send({ command: "cancel_navigation" })}
          disabled={!canWrite(ctx) || !navigationActive}
        >
          {recorder?.navigation.awaitingStandstill ? (en ? "Waiting" : "停稳中") : (en ? "Cancel" : "取消")}
        </button>
      </div>

      <div className="waypoint-maker-status">
        <span>{en ? "Next" : "下一目标"}: {recorder?.navigation.nextGoal || "N/A"}</span>
        <span className="waypoint-maker-spacer" />
        <span>{recorder ? `${recorder.points.length}/${recorder.waypoints.count}` : "N/A"}</span>
      </div>
      <div className="waypoint-maker-status">
        <span>{en ? "Pose" : "位姿"}: {poseText}</span>
        <span className="waypoint-maker-spacer" />
        <span>{en ? "Markers" : "标记"}: {markerAdvertised ? "available" : "N/A"}</span>
      </div>
      {recorder?.lastBackupPath && (
        <div className="waypoint-maker-message" title={recorder.lastBackupPath}>
          {en ? "Backup" : "备份"}: {recorder.lastBackupPath}
        </div>
      )}
      {(localError || prompt || recorder?.message) && (
        <div className="waypoint-maker-message" role="status">
          {localError || prompt || recorder?.message}
        </div>
      )}
    </div>
  );
}

const plugin: RobvizPlugin = {
  id: "waypoints-maker",
  name: "航点 Maker",
  sections: [{ id: "maker", title: "航点 Maker", component: MakerSection }],
};

export default plugin;

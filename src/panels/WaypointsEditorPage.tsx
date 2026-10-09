import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  FileText,
  ListOrdered,
  LocateFixed,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  Undo2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { WorkerBridge } from "../bridge/WorkerBridge";
import type { TfBuffer } from "../core/TfBuffer";
import type { Odometry, TFMessage } from "../core/types";
import type {
  WaypointDocument,
  WaypointFileInfo,
  WaypointPoint,
} from "../core/waypointApi";
import {
  fetchWaypointDocument,
  fetchWaypointFiles,
  saveWaypointDocument,
  WaypointApiError,
} from "../core/waypointApi";
import { useI18n } from "../app/i18n";

const FRESHNESS_LIMIT_MS = 1_500;

interface PoseSample {
  x: number;
  y: number;
  yawDeg: number;
  speed: number;
  ageMs: number;
  available: boolean;
}

interface CanvasSize {
  width: number;
  height: number;
}

interface MapTransform {
  minX: number;
  maxY: number;
  scale: number;
  height: number;
}

function clonePoints(points: WaypointPoint[]): WaypointPoint[] {
  return points.map((point) => ({ ...point, extra: { ...point.extra } }));
}

function yawFromQuaternion(rotation: { x: number; y: number; z: number; w: number }): number {
  return Math.atan2(
    2 * (rotation.w * rotation.z + rotation.x * rotation.y),
    1 - 2 * (rotation.y * rotation.y + rotation.z * rotation.z),
  ) * 180 / Math.PI;
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(3) : "N/A";
}

function formatAge(ageMs: number): string {
  if (!Number.isFinite(ageMs)) return "N/A";
  return `${Math.max(0, Math.round(ageMs))} ms`;
}

function makeMapTransform(
  points: WaypointPoint[],
  pose: PoseSample | undefined,
  size: CanvasSize,
): MapTransform {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  if (pose?.available) {
    xs.push(pose.x);
    ys.push(pose.y);
  }
  const centerX = xs.length > 0 ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0;
  const centerY = ys.length > 0 ? (Math.min(...ys) + Math.max(...ys)) / 2 : 0;
  const rangeX = Math.max(4, (xs.length > 0 ? Math.max(...xs) - Math.min(...xs) : 4) * 1.25);
  const rangeY = Math.max(4, (ys.length > 0 ? Math.max(...ys) - Math.min(...ys) : 4) * 1.25);
  const scale = Math.max(1, Math.min(size.width / rangeX, size.height / rangeY));
  return {
    minX: centerX - size.width / scale / 2,
    maxY: centerY + size.height / scale / 2,
    scale,
    height: size.height,
  };
}

function worldToCanvas(transform: MapTransform, x: number, y: number): [number, number] {
  return [(x - transform.minX) * transform.scale, (transform.maxY - y) * transform.scale];
}

function canvasToWorld(transform: MapTransform, x: number, y: number): { x: number; y: number } {
  return {
    x: transform.minX + x / transform.scale,
    y: transform.maxY - y / transform.scale,
  };
}

function PointValue({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <input
      type="number"
      step="0.001"
      value={Number.isFinite(value) ? value : ""}
      onChange={(event) => {
        const next = Number(event.target.value);
        if (Number.isFinite(next)) onChange(next);
      }}
    />
  );
}

export function WaypointsEditorPage({
  bridge,
  tf,
  topics,
  fontScale = 1,
}: {
  bridge: WorkerBridge;
  tf: TfBuffer;
  topics: Array<{ topic: string; schemaName: string }>;
  fontScale?: number;
}) {
  const { locale } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<MapTransform | undefined>(undefined);
  const dragPointRef = useRef<string | undefined>(undefined);
  const undoStackRef = useRef<WaypointPoint[][]>([]);
  const baselineRef = useRef("");
  const lastTfWallRef = useRef(0);
  const lastOdomWallRef = useRef(0);
  const [files, setFiles] = useState<WaypointFileInfo[]>([]);
  const [selectedFileId, setSelectedFileId] = useState("odom");
  const [waypointDocument, setWaypointDocument] = useState<WaypointDocument | undefined>(undefined);
  const [draftPoints, setDraftPoints] = useState<WaypointPoint[]>([]);
  const [selectedName, setSelectedName] = useState<string | undefined>(undefined);
  const [pose, setPose] = useState<PoseSample | undefined>(undefined);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 640, height: 420 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [undoDepth, setUndoDepth] = useState(0);
  const [newPointName, setNewPointName] = useState("");
  const [newPointType, setNewPointType] = useState<"goal" | "waypoint">("goal");

  const selectedFile = files.find((file) => file.id === selectedFileId);
  const isTemplate = selectedFile?.mode === "template" || waypointDocument?.id === "template";
  const dirty = JSON.stringify(draftPoints) !== baselineRef.current;
  const activeOdomTopic = topics.find(
    (topic) => topic.topic === "/odometry" && topic.schemaName === "nav_msgs/msg/Odometry",
  )?.topic ?? topics.find((topic) => topic.schemaName === "nav_msgs/msg/Odometry")?.topic;

  const displayRows = useMemo(() => {
    if (!waypointDocument) return [];
    if (isTemplate || !waypointDocument.formal) return draftPoints.map((point) => ({
      point,
      templateName: point.name,
      templateType: point.type,
      missing: false,
    }));
    const pointsByName = new Map(draftPoints.map((point) => [point.name, point]));
    return waypointDocument.template.map((templatePoint) => ({
      point: pointsByName.get(templatePoint.name),
      templateName: templatePoint.name,
      templateType: templatePoint.type,
      missing: !pointsByName.has(templatePoint.name),
    }));
  }, [draftPoints, isTemplate, waypointDocument]);

  const loadDocument = useCallback(async (fileId: string) => {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      const next = await fetchWaypointDocument(fileId);
      setWaypointDocument(next);
      setDraftPoints(clonePoints(next.points));
      baselineRef.current = JSON.stringify(next.points);
      undoStackRef.current = [];
      setUndoDepth(0);
      setSelectedName(next.points[0]?.name);
    } catch (loadError) {
      setWaypointDocument(undefined);
      setDraftPoints([]);
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchWaypointFiles()
      .then((nextFiles) => {
        if (cancelled) return;
        setFiles(nextFiles);
        const preferred = nextFiles.find((file) => file.id === selectedFileId && file.file_available)
          ?? nextFiles.find((file) => file.file_available);
        if (preferred) setSelectedFileId(preferred.id);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : String(loadError));
      });
    return () => { cancelled = true; };
  }, [selectedFileId]);

  useEffect(() => {
    if (!selectedFileId || !files.some((file) => file.id === selectedFileId && file.file_available)) return;
    void loadDocument(selectedFileId);
  }, [files, loadDocument, selectedFileId]);

  useEffect(() => {
    if (isTemplate) return;
    const element = canvasWrapRef.current;
    if (!element) return;
    const update = () => setCanvasSize({
      width: Math.max(1, element.clientWidth),
      height: Math.max(1, element.clientHeight),
    });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isTemplate]);

  useEffect(() => {
    const unsubTf = bridge.subscribe("/tf", (payload) => {
      if (payload.kind !== "raw") return;
      const message = payload.message as TFMessage;
      if (message.transforms.some((item) => item.header.frame_id === "odom" && item.child_frame_id === "base_link")) {
        lastTfWallRef.current = Date.now();
      }
    });
    const unsubOdom = activeOdomTopic
      ? bridge.subscribe(activeOdomTopic, (payload) => {
        if (payload.kind !== "raw") return;
        const message = payload.message as Odometry;
        lastOdomWallRef.current = Date.now();
        const linear = message.twist?.twist?.linear;
        if (linear && Number.isFinite(linear.x) && Number.isFinite(linear.y)) {
          setPose((current) => current ? { ...current, speed: Math.hypot(linear.x, linear.y) } : current);
        }
      })
      : undefined;
    return () => {
      unsubTf();
      unsubOdom?.();
    };
  }, [activeOdomTopic, bridge]);

  useEffect(() => {
    const update = () => {
      const transform = tf.lookup("odom", "base_link", 0);
      const now = Date.now();
      const tfAgeMs = lastTfWallRef.current > 0 ? now - lastTfWallRef.current : Infinity;
      const odomAgeMs = lastOdomWallRef.current > 0 ? now - lastOdomWallRef.current : Infinity;
      const available = Boolean(transform) && tfAgeMs <= FRESHNESS_LIMIT_MS && odomAgeMs <= FRESHNESS_LIMIT_MS;
      setPose((current) => ({
        x: transform?.translation.x ?? current?.x ?? 0,
        y: transform?.translation.y ?? current?.y ?? 0,
        yawDeg: transform ? yawFromQuaternion(transform.rotation) : current?.yawDeg ?? 0,
        speed: current?.speed ?? 0,
        ageMs: tfAgeMs,
        available,
      }));
    };
    update();
    const timer = window.setInterval(update, 200);
    return () => window.clearInterval(timer);
  }, [tf]);

  const actualPoints = useMemo(() => draftPoints, [draftPoints]);

  useEffect(() => {
    if (isTemplate) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(canvasSize.width * devicePixelRatio));
    canvas.height = Math.max(1, Math.round(canvasSize.height * devicePixelRatio));
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    context.clearRect(0, 0, canvasSize.width, canvasSize.height);
    const transform = makeMapTransform(actualPoints, pose, canvasSize);
    transformRef.current = transform;
    const style = getComputedStyle(document.documentElement);
    const foreground = style.getPropertyValue("--foreground").trim() || "#f5f5f5";
    const muted = style.getPropertyValue("--text-faint").trim() || "#777";
    const border = style.getPropertyValue("--border-soft").trim() || "#444";
    const canvasBackground = style.getPropertyValue("--canvas").trim() || "#000";
    context.fillStyle = canvasBackground;
    context.fillRect(0, 0, canvasSize.width, canvasSize.height);

    const gridStep = transform.scale > 80 ? 0.5 : 1;
    const startX = Math.floor(transform.minX / gridStep) * gridStep;
    const endX = transform.minX + canvasSize.width / transform.scale;
    const startY = Math.floor((transform.maxY - canvasSize.height / transform.scale) / gridStep) * gridStep;
    const endY = transform.maxY;
    context.lineWidth = 1;
    context.strokeStyle = border;
    context.beginPath();
    for (let x = startX; x <= endX; x += gridStep) {
      const [px] = worldToCanvas(transform, x, 0);
      context.moveTo(Math.round(px) + 0.5, 0);
      context.lineTo(Math.round(px) + 0.5, canvasSize.height);
    }
    for (let y = startY; y <= endY; y += gridStep) {
      const [, py] = worldToCanvas(transform, 0, y);
      context.moveTo(0, Math.round(py) + 0.5);
      context.lineTo(canvasSize.width, Math.round(py) + 0.5);
    }
    context.stroke();

    context.font = `${Math.max(9, Math.round(11 * fontScale))}px ui-monospace, monospace`;
    context.fillStyle = muted;
    context.fillText("odom x", 8, canvasSize.height - 8);
    context.save();
    context.translate(8, 18);
    context.rotate(-Math.PI / 2);
    context.fillText("odom y", 0, 0);
    context.restore();

    for (const point of actualPoints) {
      const [px, py] = worldToCanvas(transform, point.x, point.y);
      const selected = point.name === selectedName;
      context.fillStyle = point.type === "goal" ? foreground : muted;
      context.strokeStyle = selected ? foreground : muted;
      context.lineWidth = selected ? 2 : 1;
      context.beginPath();
      context.arc(px, py, selected ? 7 : 5, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      const yawRadians = point.yaw_deg * Math.PI / 180;
      context.beginPath();
      context.moveTo(px, py);
      context.lineTo(px + Math.cos(yawRadians) * 18, py - Math.sin(yawRadians) * 18);
      context.stroke();
      context.fillStyle = foreground;
      context.fillText(point.name, px + 9, py - 8);
    }

    if (pose?.available) {
      const [px, py] = worldToCanvas(transform, pose.x, pose.y);
      const yawRadians = pose.yawDeg * Math.PI / 180;
      context.fillStyle = "#e6b800";
      context.strokeStyle = "#e6b800";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(px + Math.cos(yawRadians) * 14, py - Math.sin(yawRadians) * 14);
      context.lineTo(px + Math.cos(yawRadians + 2.5) * 9, py - Math.sin(yawRadians + 2.5) * 9);
      context.lineTo(px + Math.cos(yawRadians - 2.5) * 9, py - Math.sin(yawRadians - 2.5) * 9);
      context.closePath();
      context.fill();
      context.stroke();
    }
  }, [actualPoints, canvasSize, fontScale, isTemplate, pose, selectedName]);

  const pushUndo = useCallback(() => {
    undoStackRef.current = [...undoStackRef.current.slice(-99), clonePoints(draftPoints)];
    setUndoDepth(undoStackRef.current.length);
  }, [draftPoints]);

  const updatePoint = useCallback((name: string, patch: Partial<WaypointPoint>) => {
    pushUndo();
    setDraftPoints((current) => current.map((point) => point.name === name ? { ...point, ...patch } : point));
  }, [pushUndo]);

  const handleAddTemplatePoint = useCallback(() => {
    const trimmed = newPointName.trim();
    if (!trimmed) {
      setError(locale === "en" ? "Please enter a point name" : "请输入点位名称");
      return;
    }
    if (draftPoints.some((p) => p.name === trimmed)) {
      setError(locale === "en" ? `Point '${trimmed}' already exists` : `点位 '${trimmed}' 已存在`);
      return;
    }
    pushUndo();
    setDraftPoints((prev) => [
      ...prev,
      {
        name: trimmed,
        type: newPointType,
        x: 0,
        y: 0,
        z: 0,
        yaw_deg: 0,
        extra: {},
      },
    ]);
    setSelectedName(trimmed);
    setNewPointName("");
    setError(undefined);
  }, [draftPoints, locale, newPointName, newPointType, pushUndo]);

  const updateTemplatePointName = useCallback((index: number, newName: string) => {
    pushUndo();
    setDraftPoints((prev) => prev.map((p, i) => i === index ? { ...p, name: newName } : p));
  }, [pushUndo]);

  const updateTemplatePointType = useCallback((index: number, nextType: "goal" | "waypoint") => {
    pushUndo();
    setDraftPoints((prev) => prev.map((p, i) => i === index ? { ...p, type: nextType } : p));
  }, [pushUndo]);

  const moveTemplatePoint = useCallback((index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= draftPoints.length) return;
    pushUndo();
    setDraftPoints((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  }, [draftPoints.length, pushUndo]);

  const deleteTemplatePoint = useCallback((index: number) => {
    const pointToDelete = draftPoints[index];
    if (!pointToDelete) return;
    if (!window.confirm(locale === "en" ? `Delete template point '${pointToDelete.name}'?` : `确定删除模板点位 '${pointToDelete.name}'？`)) return;
    pushUndo();
    setDraftPoints((prev) => prev.filter((_, i) => i !== index));
    if (selectedName === pointToDelete.name) {
      setSelectedName(undefined);
    }
  }, [draftPoints, locale, pushUndo, selectedName]);

  const templateStats = useMemo(() => {
    if (!isTemplate) return { total: 0, goals: 0, waypoints: 0, hasDuplicates: false, hasEmpty: false };
    const names = draftPoints.map((p) => p.name.trim());
    const hasEmpty = names.some((n) => !n);
    const hasDuplicates = new Set(names).size !== names.length;
    const goals = draftPoints.filter((p) => p.type === "goal").length;
    const waypoints = draftPoints.filter((p) => p.type === "waypoint").length;
    return {
      total: draftPoints.length,
      goals,
      waypoints,
      hasDuplicates,
      hasEmpty,
    };
  }, [draftPoints, isTemplate]);

  const undo = useCallback(() => {
    const previous = undoStackRef.current.pop();
    if (!previous) return;
    setDraftPoints(previous);
    setUndoDepth(undoStackRef.current.length);
  }, []);

  const reload = useCallback(() => {
    if (dirty && !window.confirm(locale === "en" ? "Discard unsaved waypoint edits?" : "放弃未保存的航点修改？")) return;
    void loadDocument(selectedFileId);
  }, [dirty, loadDocument, locale, selectedFileId]);

  const save = useCallback(async () => {
    if (!waypointDocument || !dirty || busy) return;
    if (isTemplate) {
      if (templateStats.hasEmpty) {
        setError(locale === "en" ? "Point names cannot be empty" : "点位名称不能为空");
        return;
      }
      if (templateStats.hasDuplicates) {
        setError(locale === "en" ? "Duplicate point names are not allowed" : "模板中存在重复的点位名称");
        return;
      }
    }
    if (!window.confirm(locale === "en"
      ? `Overwrite ${waypointDocument.id} (${selectedFile?.file_name ?? waypointDocument.id})?`
      : `确认覆盖 ${waypointDocument.id}（${selectedFile?.file_name ?? waypointDocument.id}）？`)) return;
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      const result = await saveWaypointDocument({
        id: waypointDocument.id,
        version: waypointDocument.version,
        points: draftPoints,
      });
      setWaypointDocument((current) => current ? { ...current, points: clonePoints(draftPoints), version: result.version } : current);
      baselineRef.current = JSON.stringify(draftPoints);
      setNotice(locale === "en" ? `Saved. Backup: ${result.backup}` : `已保存。备份：${result.backup}`);
    } catch (saveError) {
      if (saveError instanceof WaypointApiError && saveError.status === 409) {
        setError(locale === "en" ? "The waypoint file changed externally. Reload before saving." : "航点文件已被外部修改，请重新加载后再保存。");
      } else {
        setError(saveError instanceof Error ? saveError.message : String(saveError));
      }
    } finally {
      setBusy(false);
    }
  }, [busy, draftPoints, dirty, isTemplate, locale, selectedFile?.file_name, templateStats, waypointDocument]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const transform = transformRef.current;
    if (!transform) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = draftPoints.find((point) => {
      const [px, py] = worldToCanvas(transform, point.x, point.y);
      return Math.hypot(px - x, py - y) <= 14;
    });
    if (!hit) return;
    pushUndo();
    dragPointRef.current = hit.name;
    setSelectedName(hit.name);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [draftPoints, pushUndo]);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const name = dragPointRef.current;
    const transform = transformRef.current;
    if (!name || !transform) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const next = canvasToWorld(transform, event.clientX - rect.left, event.clientY - rect.top);
    setDraftPoints((current) => current.map((point) => point.name === name ? { ...point, x: next.x, y: next.y } : point));
  }, []);

  const stopDragging = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    dragPointRef.current = undefined;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  return (
    <section className="waypoints-editor-page">
      <div className="waypoints-toolbar">
        <FileText />
        <select
          value={selectedFileId}
          onChange={(event) => {
            const next = event.target.value;
            if (dirty && !window.confirm(locale === "en" ? "Discard unsaved waypoint edits?" : "放弃未保存的航点修改？")) return;
            setSelectedFileId(next);
          }}
          aria-label={locale === "en" ? "Waypoint file" : "航点文件"}
        >
          {files.map((file) => (
            <option key={file.id} value={file.id} disabled={!file.file_available}>
              {file.label}{file.file_available ? "" : " (N/A)"}
            </option>
          ))}
        </select>
        <span className="waypoints-file-meta">
          {isTemplate
            ? (locale === "en" ? `template · ${draftPoints.length} points` : `规则模板 · 共 ${draftPoints.length} 个点`)
            : `${waypointDocument?.frame_id ?? selectedFile?.frame_id ?? "odom"} · ${waypointDocument?.formal ? (locale === "en" ? "formal" : "正式") : (locale === "en" ? "debug" : "调试")}`
          }
        </span>
        <span className="spacer" />
        <button className="icon-action" onClick={reload} disabled={busy} title={locale === "en" ? "Reload file" : "重新加载文件"} aria-label={locale === "en" ? "Reload file" : "重新加载文件"}>
          <RefreshCcw />
        </button>
        <button onClick={() => void save()} disabled={!dirty || busy || !waypointDocument}>
          <Save /> {locale === "en" ? "Save" : "保存"}
        </button>
        <button className="icon-action" onClick={undo} disabled={undoDepth === 0} title={locale === "en" ? "Undo" : "撤销"} aria-label={locale === "en" ? "Undo" : "撤销"}>
          <Undo2 />
        </button>
        <span className={`waypoints-draft-status ${dirty ? "dirty" : "clean"}`}>
          {dirty ? (locale === "en" ? "Draft changed" : "草稿已修改") : (locale === "en" ? "Loaded" : "已加载")}
        </span>
      </div>

      {isTemplate ? (
        <div className="waypoints-workspace template-workspace">
          <div className="waypoints-template-pane">
            <div className="waypoints-template-toolbar">
              <div className="waypoints-section-title">
                <ListOrdered /> {locale === "en" ? "Template sequence" : "模板航点序列"}
              </div>
              <div className="waypoints-template-add-bar">
                <input
                  type="text"
                  placeholder={locale === "en" ? "New point name (e.g. A5)" : "新点位名称 (例如 A5)"}
                  value={newPointName}
                  onChange={(e) => setNewPointName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddTemplatePoint(); }}
                  spellCheck={false}
                />
                <select value={newPointType} onChange={(e) => setNewPointType(e.target.value as "goal" | "waypoint")}>
                  <option value="goal">goal</option>
                  <option value="waypoint">waypoint</option>
                </select>
                <button type="button" onClick={handleAddTemplatePoint}>
                  <Plus /> {locale === "en" ? "Add point" : "添加点位"}
                </button>
              </div>
            </div>

            <div className="waypoints-template-list">
              {draftPoints.length === 0 ? (
                <p className="empty-hint">{locale === "en" ? "No points in template" : "模板中暂无点位"}</p>
              ) : (
                draftPoints.map((point, index) => (
                  <div
                    key={`${index}-${point.name}`}
                    className={`waypoints-template-row ${selectedName === point.name ? "active" : ""}`}
                    onClick={() => setSelectedName(point.name)}
                  >
                    <span className="template-row-idx">#{index + 1}</span>
                    <input
                      className="template-name-input"
                      value={point.name}
                      onChange={(e) => updateTemplatePointName(index, e.target.value)}
                      placeholder={locale === "en" ? "Point name" : "点位名称"}
                      spellCheck={false}
                    />
                    <select
                      className="template-type-select"
                      value={point.type}
                      onChange={(e) => updateTemplatePointType(index, e.target.value as "goal" | "waypoint")}
                    >
                      <option value="goal">goal</option>
                      <option value="waypoint">waypoint</option>
                    </select>
                    <div className="template-row-actions">
                      <button
                        type="button"
                        className="icon-action"
                        title={locale === "en" ? "Move up" : "上移"}
                        disabled={index === 0}
                        onClick={(e) => { e.stopPropagation(); moveTemplatePoint(index, -1); }}
                        aria-label={locale === "en" ? "Move up" : "上移"}
                      >
                        <ArrowUp />
                      </button>
                      <button
                        type="button"
                        className="icon-action"
                        title={locale === "en" ? "Move down" : "下移"}
                        disabled={index === draftPoints.length - 1}
                        onClick={(e) => { e.stopPropagation(); moveTemplatePoint(index, 1); }}
                        aria-label={locale === "en" ? "Move down" : "下移"}
                      >
                        <ArrowDown />
                      </button>
                      <button
                        type="button"
                        className="icon-action delete"
                        title={locale === "en" ? "Delete point" : "删除点位"}
                        onClick={(e) => { e.stopPropagation(); deleteTemplatePoint(index); }}
                        aria-label={locale === "en" ? "Delete point" : "删除点位"}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="waypoints-inspector">
            <div className="waypoints-section-title">{locale === "en" ? "Template specs & stats" : "模板规范与统计"}</div>
            <div className="template-stats-content">
              <div className="template-stat-item">
                <span>{locale === "en" ? "Total points" : "总点数"}</span>
                <strong>{templateStats.total}</strong>
              </div>
              <div className="template-stat-item">
                <span>{locale === "en" ? "Goals" : "作业/目标点 (goal)"}</span>
                <strong>{templateStats.goals}</strong>
              </div>
              <div className="template-stat-item">
                <span>{locale === "en" ? "Waypoints" : "途经点 (waypoint)"}</span>
                <strong>{templateStats.waypoints}</strong>
              </div>

              {templateStats.hasDuplicates && (
                <div className="template-warning-box">
                  <AlertTriangle />
                  <span>{locale === "en" ? "Duplicate point names found! Please ensure all names are unique." : "检测到重名点位！请确保每个点名称唯一。"}</span>
                </div>
              )}

              {templateStats.hasEmpty && (
                <div className="template-warning-box">
                  <AlertTriangle />
                  <span>{locale === "en" ? "Empty point names found! All points must have a name." : "存在未命名的点位！点位名称不能为空。"}</span>
                </div>
              )}

              <div className="template-guide-box">
                <p>
                  {locale === "en"
                    ? "template.yaml defines the formal competition skeleton: official names, types, and sequence order. Points in formal odom_waypoints.yaml must match this template."
                    : "template.yaml 规定正式比赛（formal）的标准航点名称、类型与执行顺序。在 formal 模式下录入或加载的航点文件必须完全符合此模板。"}
                </p>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="waypoints-workspace">
        <aside className="waypoints-list">
          <div className="waypoints-section-title">{locale === "en" ? "Points" : "航点"}</div>
          {busy && <p className="empty-hint">{locale === "en" ? "Loading..." : "加载中..."}</p>}
          {!busy && displayRows.length === 0 && <p className="empty-hint">{locale === "en" ? "No available points" : "暂无可用航点"}</p>}
          {displayRows.map((row) => {
            const name = row.point?.name ?? row.templateName ?? "";
            return (
              <button
                className={`waypoint-row ${selectedName === name ? "active" : ""} ${row.missing ? "missing" : ""}`}
                key={name}
                onClick={() => row.point && setSelectedName(row.point.name)}
                disabled={!row.point}
              >
                <span className="waypoint-row-mark">{row.point?.type === "goal" ? "G" : row.point ? "W" : "!"}</span>
                <span>{name}</span>
                <small>{row.point ? `${row.point.x.toFixed(2)}, ${row.point.y.toFixed(2)}` : (locale === "en" ? "missing" : "缺失")}</small>
              </button>
            );
          })}
        </aside>

        <div className="waypoints-map-wrap" ref={canvasWrapRef}>
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
            aria-label={locale === "en" ? "Waypoint map" : "航点地图"}
          />
          {!pose?.available && (
            <div className="waypoints-map-status">
              <AlertTriangle /> {locale === "en" ? "odom → base_link unavailable or stale" : "odom → base_link 不可用或已过期"}
            </div>
          )}
          <div className="waypoints-map-legend">
            <span><i className="waypoint-legend-point" /> {locale === "en" ? "point" : "航点"}</span>
            <span><i className="waypoint-legend-robot" /> {locale === "en" ? "robot" : "机器人"}</span>
          </div>
        </div>

        <aside className="waypoints-inspector">
          <div className="waypoints-section-title">{locale === "en" ? "Point data" : "航点数据"}</div>
          {(() => {
            const point = draftPoints.find((candidate) => candidate.name === selectedName);
            if (!point) return <p className="empty-hint">{locale === "en" ? "Select an available point" : "选择一个已有航点"}</p>;
            return (
              <div className="waypoint-form">
                <label><span>{locale === "en" ? "Name" : "名称"}</span><input value={point.name} readOnly /></label>
                <label><span>{locale === "en" ? "Type" : "类型"}</span><select value={point.type} disabled={waypointDocument?.formal} onChange={(event) => updatePoint(point.name, { type: event.target.value as WaypointPoint["type"] })}><option value="waypoint">waypoint</option><option value="goal">goal</option></select></label>
                <label><span>X (m)</span><PointValue value={point.x} onChange={(value) => updatePoint(point.name, { x: value })} /></label>
                <label><span>Y (m)</span><PointValue value={point.y} onChange={(value) => updatePoint(point.name, { y: value })} /></label>
                <label><span>Z (m)</span><PointValue value={point.z} onChange={(value) => updatePoint(point.name, { z: value })} /></label>
                <label><span>Yaw (deg)</span><PointValue value={point.yaw_deg} onChange={(value) => updatePoint(point.name, { yaw_deg: value })} /></label>
              </div>
            );
          })()}
          <div className="waypoints-pose-status">
            <div className="waypoints-section-title"><LocateFixed /> {locale === "en" ? "Current robot" : "当前机器人"}</div>
            <div className={pose?.available ? "available" : "unavailable"}>
              {pose?.available ? `${formatNumber(pose.x)}, ${formatNumber(pose.y)} m · ${formatNumber(pose.yawDeg)}°` : (locale === "en" ? "Unavailable" : "不可用")}
            </div>
            <small>{locale === "en" ? `TF age ${formatAge(pose?.ageMs ?? Infinity)} · speed ${formatNumber(pose?.speed ?? NaN)} m/s` : `TF 新鲜度 ${formatAge(pose?.ageMs ?? Infinity)} · 速度 ${formatNumber(pose?.speed ?? NaN)} m/s`}</small>
          </div>
        </aside>
      </div>
      )}

      {(error || notice) && (
        <div className={`waypoints-feedback ${error ? "error-line" : ""}`} role={error ? "alert" : "status"}>
          {error ?? notice}
        </div>
      )}
    </section>
  );
}

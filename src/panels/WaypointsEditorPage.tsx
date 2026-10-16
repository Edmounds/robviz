import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Crosshair,
  FileText,
  Grid,
  Image as ImageIcon,
  Layers,
  List,
  ListOrdered,
  MapPin,
  Maximize2,
  Plus,
  RefreshCcw,
  RotateCcw,
  Save,
  Sliders,
  Trash2,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useI18n } from "../app/i18n";
import { NumberInput, TextInput, validateInputs } from "../app/EditableInput";
import type {
  BackgroundConfig,
  WaypointDocument,
  WaypointFileInfo,
  WaypointPoint,
} from "../core/waypointApi";
import {
  deleteBackground,
  fetchBackground,
  fetchWaypointDocument,
  fetchWaypointFiles,
  saveBackgroundConfig,
  saveWaypointDocument,
  uploadBackgroundImage,
  WaypointApiError,
} from "../core/waypointApi";
import {
  canvasToWorld,
  centerFromPivotInvariant,
  fitViewToBounds,
  imagePixelToWorld,
  panView,
  placeWaypointLabels,
  worldToCanvas,
  worldToImagePixel,
  zoomViewAtAnchor,
  type View2DTransform,
} from "../core/view2d";

interface CanvasSize {
  width: number;
  height: number;
}

interface BackgroundDraft {
  centerX: number;
  centerY: number;
  metersPerPixel: number;
  rotationDeg: number;
  opacity: number;
  visible: boolean;
  pivotU: number;
  pivotV: number;
  width: number;
  height: number;
  imageFile: string;
}

function clonePoints(points: WaypointPoint[]): WaypointPoint[] {
  return points.map((point) => ({ ...point, extra: { ...point.extra } }));
}

function PointValue({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <NumberInput
      value={value}
      onValueChange={(next) => onChange(next ?? NaN)}
      onInvalidValue={() => onChange(NaN)}
    />
  );
}

export function WaypointsEditorPage({
  fontScale = 1,
}: {
  fontScale?: number;
}) {
  const { locale } = useI18n();
  const fields = useRef<HTMLElement>(null);
  const addFields = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<View2DTransform | undefined>(undefined);
  const dragPointRef = useRef<string | undefined>(undefined);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const undoStackRef = useRef<WaypointPoint[][]>([]);
  const baselineRef = useRef("");

  const [files, setFiles] = useState<WaypointFileInfo[]>([]);
  const [selectedFileId, setSelectedFileId] = useState(() => {
    if (typeof window !== "undefined" && window.location?.search) {
      const p = new URLSearchParams(window.location.search).get("file");
      if (p) return p;
    }
    return "odom";
  });
  const [waypointDocument, setWaypointDocument] = useState<WaypointDocument | undefined>(undefined);
  const [draftPoints, setDraftPoints] = useState<WaypointPoint[]>([]);
  const [selectedName, setSelectedName] = useState<string | undefined>(undefined);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 640, height: 420 });
  const [viewTransform, setViewTransform] = useState<View2DTransform>({
    centerX: 0,
    centerY: 0,
    scale: 50,
    width: 640,
    height: 420,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [undoDepth, setUndoDepth] = useState(0);
  const [newPointName, setNewPointName] = useState("");
  const [newPointType, setNewPointType] = useState<"goal" | "waypoint">("goal");
  const [crowdedListOpen, setCrowdedListOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"list" | "map" | "inspector">(() => {
    if (typeof window !== "undefined" && window.location?.search) {
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (tab === "list" || tab === "map" || tab === "inspector") return tab;
    }
    return "map";
  });
  const [isNarrow, setIsNarrow] = useState(false);

  // 背景底图与网格状态
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgDraft, setBgDraft] = useState<BackgroundDraft | null>(null);
  const [bgBaseline, setBgBaseline] = useState<string>("");
  const [bgNewFile, setBgNewFile] = useState<File | null>(null);
  const [isPickingPivot, setIsPickingPivot] = useState(false);
  const [bgSaving, setBgSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [gridMode, setGridMode] = useState<string>("auto");
  const [customGridStep, setCustomGridStep] = useState<number>(1.0);

  viewRef.current = viewTransform;

  const selectedFile = files.find((file) => file.id === selectedFileId);
  const isTemplate = selectedFile?.mode === "template" || waypointDocument?.id === "template";
  const dirty = JSON.stringify(draftPoints) !== baselineRef.current;
  const bgDirty = Boolean(bgNewFile || (bgDraft && JSON.stringify(bgDraft) !== bgBaseline));

  // 响应式检测
  useEffect(() => {
    const checkWidth = () => {
      setIsNarrow(window.innerWidth < 860);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  const displayRows = useMemo(() => {
    if (!waypointDocument) return [];
    if (isTemplate || !waypointDocument.formal) {
      return draftPoints.map((point) => ({
        point,
        templateName: point.name,
        templateType: point.type,
        missing: false,
      }));
    }
    const pointsByName = new Map(draftPoints.map((point) => [point.name, point]));
    return waypointDocument.template.map((templatePoint) => ({
      point: pointsByName.get(templatePoint.name),
      templateName: templatePoint.name,
      templateType: templatePoint.type,
      missing: !pointsByName.has(templatePoint.name),
    }));
  }, [draftPoints, isTemplate, waypointDocument]);

  // 自适应视图
  const canvasSizeRef = useRef<CanvasSize>({ width: 640, height: 420 });

  const fitView = useCallback((points: WaypointPoint[], size?: CanvasSize) => {
    points = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    const currentSize = size ?? canvasSizeRef.current;
    if (points.length === 0) {
      setViewTransform({
        centerX: 0,
        centerY: 0,
        scale: 50,
        width: currentSize.width,
        height: currentSize.height,
      });
      return;
    }
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const bounds = {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
    const nextView = fitViewToBounds(bounds, currentSize.width, currentSize.height, 60);
    setViewTransform(nextView);
  }, []);

  const loadDocument = useCallback(async (fileId: string) => {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      const next = await fetchWaypointDocument(fileId);
      setWaypointDocument(next);
      const cloned = clonePoints(next.points);
      setDraftPoints(cloned);
      baselineRef.current = JSON.stringify(next.points);
      undoStackRef.current = [];
      setUndoDepth(0);
      setSelectedName(next.points[0]?.name);
      fitView(cloned);
    } catch (loadError) {
      setWaypointDocument(undefined);
      setDraftPoints([]);
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setBusy(false);
    }
  }, [fitView]);

  useEffect(() => {
    let cancelled = false;
    void fetchWaypointFiles()
      .then((nextFiles) => {
        if (cancelled) return;
        setFiles(nextFiles);
        const preferred =
          nextFiles.find((file) => file.id === selectedFileId && file.file_available) ??
          nextFiles.find((file) => file.file_available);
        if (preferred) setSelectedFileId(preferred.id);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : String(loadError));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedFileId]);

  useEffect(() => {
    if (!selectedFileId || !files.some((file) => file.id === selectedFileId && file.file_available)) return;
    void loadDocument(selectedFileId);
  }, [files, loadDocument, selectedFileId]);

  const loadBg = useCallback(async (fileId: string) => {
    try {
      const res = await fetchBackground(fileId);
      if (res.has_image && res.config && res.image_url) {
        const img = new Image();
        img.src = res.image_url;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load background image"));
        });
        const draft: BackgroundDraft = {
          centerX: res.config.center_x,
          centerY: res.config.center_y,
          metersPerPixel: res.config.meters_per_pixel,
          rotationDeg: res.config.rotation_deg,
          opacity: res.config.opacity,
          visible: res.config.visible,
          pivotU: res.config.pivot_u,
          pivotV: res.config.pivot_v,
          width: res.config.width || img.naturalWidth,
          height: res.config.height || img.naturalHeight,
          imageFile: res.config.image_file,
        };
        setBgImage(img);
        setBgDraft(draft);
        setBgBaseline(JSON.stringify(draft));
        setBgNewFile(null);
      } else {
        setBgImage(null);
        setBgDraft(null);
        setBgBaseline("");
        setBgNewFile(null);
      }
    } catch {
      setBgImage(null);
      setBgDraft(null);
      setBgBaseline("");
      setBgNewFile(null);
    }
  }, []);

  useEffect(() => {
    if (selectedFile?.formal) {
      void loadBg(selectedFileId);
    } else {
      setBgImage(null);
      setBgDraft(null);
      setBgBaseline("");
      setBgNewFile(null);
    }
  }, [loadBg, selectedFile?.formal, selectedFileId]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError(locale === "en" ? "Image size exceeds 20 MiB limit" : "图片大小超过 20 MiB 限制");
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setBgImage(img);
      setBgNewFile(file);
      const draft: BackgroundDraft = {
        centerX: 0.0,
        centerY: 0.0,
        metersPerPixel: 1.0,
        rotationDeg: 0.0,
        opacity: 0.5,
        visible: true,
        pivotU: img.naturalWidth / 2,
        pivotV: img.naturalHeight / 2,
        width: img.naturalWidth,
        height: img.naturalHeight,
        imageFile: file.name,
      };
      setBgDraft(draft);
      setNotice(locale === "en" ? `Loaded image: ${file.name}` : `已加载图片: ${file.name}`);
    };
    event.target.value = "";
  }, [locale]);

  const updateBgCenter = useCallback((cx: number, cy: number) => {
    setBgDraft((prev) => (prev ? { ...prev, centerX: cx, centerY: cy } : prev));
  }, []);

  const updateBgScaleOrRot = useCallback((newScale: number, newRot: number) => {
    setBgDraft((prev) => {
      if (!prev) return prev;
      const pw = imagePixelToWorld(prev, prev.width, prev.height, prev.pivotU, prev.pivotV);
      const nextCenter = centerFromPivotInvariant(
        pw,
        { u: prev.pivotU, v: prev.pivotV },
        prev.width,
        prev.height,
        newScale,
        newRot,
      );
      return {
        ...prev,
        centerX: nextCenter.centerX,
        centerY: nextCenter.centerY,
        metersPerPixel: newScale,
        rotationDeg: newRot,
      };
    });
  }, []);

  const handleSaveBackground = useCallback(async () => {
    if (!bgDraft || !selectedFileId || bgSaving) return;
    setBgSaving(true);
    setError(undefined);
    setNotice(undefined);
    try {
      let imageFileName = bgDraft.imageFile;
      if (bgNewFile) {
        const uploadRes = await uploadBackgroundImage(selectedFileId, bgNewFile);
        imageFileName = uploadRes.image_file;
      }
      const configToSave: BackgroundConfig = {
        center_x: bgDraft.centerX,
        center_y: bgDraft.centerY,
        meters_per_pixel: bgDraft.metersPerPixel,
        rotation_deg: bgDraft.rotationDeg,
        opacity: bgDraft.opacity,
        visible: bgDraft.visible,
        pivot_u: bgDraft.pivotU,
        pivot_v: bgDraft.pivotV,
        width: bgDraft.width,
        height: bgDraft.height,
        image_file: imageFileName,
      };
      await saveBackgroundConfig(selectedFileId, configToSave);
      const updatedDraft = { ...bgDraft, imageFile: imageFileName };
      setBgDraft(updatedDraft);
      setBgBaseline(JSON.stringify(updatedDraft));
      setBgNewFile(null);
      setNotice(locale === "en" ? "Background image and transform saved" : "背景图与变换已保存");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBgSaving(false);
    }
  }, [bgDraft, bgNewFile, bgSaving, locale, selectedFileId]);

  const handleDeleteBackground = useCallback(async () => {
    if (!selectedFileId) return;
    if (
      !window.confirm(
        locale === "en"
          ? "Delete background image for this preset?"
          : "确定删除当前预设的背景图？",
      )
    ) {
      return;
    }
    try {
      await deleteBackground(selectedFileId);
      setBgImage(null);
      setBgDraft(null);
      setBgBaseline("");
      setBgNewFile(null);
      setNotice(locale === "en" ? "Background deleted" : "已删除背景图");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [locale, selectedFileId]);

  const handleResetBackground = useCallback(() => {
    if (!bgDraft || !bgImage) return;
    setBgDraft((prev) =>
      prev
        ? {
            ...prev,
            centerX: 0.0,
            centerY: 0.0,
            metersPerPixel: 1.0,
            rotationDeg: 0.0,
            opacity: 0.5,
            visible: true,
            pivotU: bgImage.naturalWidth / 2,
            pivotV: bgImage.naturalHeight / 2,
          }
        : prev,
    );
    setNotice(locale === "en" ? "Reset background transform" : "已恢复默认背景变换");
  }, [bgDraft, bgImage, locale]);

  useEffect(() => {
    if (isTemplate) return;
    const element = canvasWrapRef.current;
    if (!element) return;
    const update = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      if (width <= 0 || height <= 0) return;
      canvasSizeRef.current = { width, height };
      setCanvasSize({ width, height });
      setViewTransform((current) => ({
        ...current,
        width,
        height,
      }));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isTemplate]);

  // 绘图循环
  useEffect(() => {
    if (isTemplate) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(canvasSize.width * dpr));
    canvas.height = Math.max(1, Math.round(canvasSize.height * dpr));
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    const style = getComputedStyle(document.documentElement);
    const foreground = style.getPropertyValue("--foreground").trim() || "#f5f5f5";
    const textMuted = style.getPropertyValue("--text-muted").trim() || "#888888";
    const textFaint = style.getPropertyValue("--text-faint").trim() || "#555555";
    const borderSoft = style.getPropertyValue("--border-soft").trim() || "#333333";
    const canvasBg = style.getPropertyValue("--canvas").trim() || "#0f0f12";
    const surfaceSoft = style.getPropertyValue("--surface-soft").trim() || "#1e1e24";
    const isLight = document.documentElement.getAttribute("data-theme") === "light" ||
      style.getPropertyValue("--canvas").trim() === "#ffffff" ||
      style.getPropertyValue("--canvas").trim() === "#fff";
    const goalColor = isLight ? "#16a34a" : "#22c55e"; // 绿色 goal
    const waypointColor = isLight ? "#2563eb" : "#3b82f6"; // 蓝色 waypoint

    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    const view = viewTransform;

    // 1. 绘制背景底图（位于网格下方，航点下方）
    if (bgImage && bgDraft && bgDraft.visible) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, bgDraft.opacity));
      const [cx, cy] = worldToCanvas(view, bgDraft.centerX, bgDraft.centerY);
      ctx.translate(cx, cy);
      ctx.rotate(-(bgDraft.rotationDeg * Math.PI) / 180);
      const cScale = bgDraft.metersPerPixel * view.scale;
      ctx.scale(cScale, cScale);
      ctx.drawImage(bgImage, -bgDraft.width / 2, -bgDraft.height / 2, bgDraft.width, bgDraft.height);
      ctx.restore();

      // 绘制旋转与缩放中心指示器
      if (bgDraft.pivotU !== undefined && bgDraft.pivotV !== undefined) {
        const pw = imagePixelToWorld(bgDraft, bgDraft.width, bgDraft.height, bgDraft.pivotU, bgDraft.pivotV);
        const [ppx, ppy] = worldToCanvas(view, pw.x, pw.y);
        ctx.save();
        ctx.strokeStyle = isLight ? "#d97706" : "#f59e0b";
        ctx.fillStyle = isLight ? "rgba(217, 119, 6, 0.25)" : "rgba(245, 158, 11, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ppx, ppy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ppx - 10, ppy);
        ctx.lineTo(ppx + 10, ppy);
        ctx.moveTo(ppx, ppy - 10);
        ctx.lineTo(ppx, ppy + 10);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 2. 动态或自定义实际距离网格线
    let autoStep = 1;
    for (const cand of [0.1, 0.2, 0.5, 1, 2, 5, 10, 20]) {
      if (cand * view.scale >= 40) {
        autoStep = cand;
        break;
      }
    }
    let gridStep = autoStep;
    if (gridMode !== "auto") {
      const parsed = parseFloat(gridMode);
      if (Number.isFinite(parsed) && parsed > 0) {
        gridStep = parsed;
      } else if (gridMode === "custom" && Number.isFinite(customGridStep) && customGridStep > 0) {
        gridStep = customGridStep;
      }
    }

    const minWorld = canvasToWorld(view, 0, canvasSize.height);
    const maxWorld = canvasToWorld(view, canvasSize.width, 0);

    const startX = Math.floor(minWorld.x / gridStep) * gridStep;
    const endX = Math.ceil(maxWorld.x / gridStep) * gridStep;
    const startY = Math.floor(minWorld.y / gridStep) * gridStep;
    const endY = Math.ceil(maxWorld.y / gridStep) * gridStep;

    ctx.lineWidth = 1;
    ctx.strokeStyle = borderSoft;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridStep) {
      const [px] = worldToCanvas(view, x, 0);
      const roundedX = Math.round(px) + 0.5;
      ctx.moveTo(roundedX, 0);
      ctx.lineTo(roundedX, canvasSize.height);
    }
    for (let y = startY; y <= endY; y += gridStep) {
      const [, py] = worldToCanvas(view, 0, y);
      const roundedY = Math.round(py) + 0.5;
      ctx.moveTo(0, roundedY);
      ctx.lineTo(canvasSize.width, roundedY);
    }
    ctx.stroke();

    // 绘制 X=0 与 Y=0 原点坐标轴
    const [originPx, originPy] = worldToCanvas(view, 0, 0);
    ctx.strokeStyle = isLight ? "rgba(0, 0, 0, 0.35)" : "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (originPx >= 0 && originPx <= canvasSize.width) {
      ctx.moveTo(Math.round(originPx) + 0.5, 0);
      ctx.lineTo(Math.round(originPx) + 0.5, canvasSize.height);
    }
    if (originPy >= 0 && originPy <= canvasSize.height) {
      ctx.moveTo(0, Math.round(originPy) + 0.5);
      ctx.lineTo(canvasSize.width, Math.round(originPy) + 0.5);
    }
    ctx.stroke();

    // 轴与实际距离数值标注
    const axisFontSize = Math.max(9, Math.round(11 * fontScale));
    ctx.font = `${axisFontSize}px ui-monospace, monospace`;
    ctx.fillStyle = textFaint;

    const formatDist = (val: number) => {
      if (Math.abs(val) < 1e-6) return "0m";
      const decimals = gridStep < 0.1 ? 2 : gridStep < 1 ? 1 : gridStep % 1 === 0 ? 0 : 1;
      return `${val > 0 ? "+" : ""}${val.toFixed(decimals)}m`;
    };

    for (let x = startX; x <= endX; x += gridStep) {
      const [px] = worldToCanvas(view, x, 0);
      if (px >= 40 && px <= canvasSize.width - 40) {
        ctx.fillText(formatDist(x), px + 2, canvasSize.height - 4);
      }
    }
    for (let y = startY; y <= endY; y += gridStep) {
      const [, py] = worldToCanvas(view, 0, y);
      if (py >= 20 && py <= canvasSize.height - 20) {
        ctx.fillText(formatDist(y), 4, py - 3);
      }
    }

    ctx.fillText(
      `odom x (grid ${gridStep.toFixed(gridStep < 0.1 ? 2 : gridStep % 1 === 0 ? 0 : 1)}m)`,
      10,
      canvasSize.height - 18,
    );
    ctx.save();
    ctx.translate(14, 20);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(
      `odom y (grid ${gridStep.toFixed(gridStep < 0.1 ? 2 : gridStep % 1 === 0 ? 0 : 1)}m)`,
      0,
      0,
    );
    ctx.restore();

    // 航点位置换算与标签测量
    const labelFontSize = Math.max(10, Math.round(12 * fontScale));
    ctx.font = `${labelFontSize}px ui-monospace, monospace`;

    const pointPixList = draftPoints.filter((point) => [point.x, point.y, point.yaw_deg].every(Number.isFinite)).map((point) => {
      const [px, py] = worldToCanvas(view, point.x, point.y);
      return { name: point.name, px, py, point };
    });

    const measureText = (name: string) => {
      const m = ctx.measureText(name);
      return { width: m.width, height: labelFontSize };
    };

    const placedLabels = placeWaypointLabels(
      pointPixList,
      measureText,
      canvasSize.width,
      canvasSize.height,
    );

    // 绘制航点点位与朝向箭头
    for (const item of pointPixList) {
      const { px, py, point } = item;
      const isSelected = point.name === selectedName;
      const pointColor = point.type === "goal" ? goalColor : waypointColor;

      // 点外圈
      ctx.beginPath();
      ctx.arc(px, py, isSelected ? 8 : 6, 0, Math.PI * 2);
      ctx.fillStyle = pointColor;
      ctx.fill();
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeStyle = isSelected ? foreground : "#ffffff";
      ctx.stroke();

      // 朝向指示线
      const yawRad = (point.yaw_deg * Math.PI) / 180;
      const arrowLen = isSelected ? 22 : 16;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(yawRad) * arrowLen, py - Math.sin(yawRad) * arrowLen);
      ctx.strokeStyle = pointColor;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();
    }

    // 绘制标签引线与避让标签
    for (const label of placedLabels) {
      const isSelected = label.name === selectedName;
      const targetPoint = draftPoints.find((p) => p.name === label.name);
      const badgeColor = targetPoint?.type === "goal" ? goalColor : waypointColor;

      // 引线
      if (label.leaderLine) {
        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.moveTo(label.leaderLine.fromX, label.leaderLine.fromY);
        ctx.lineTo(label.leaderLine.toX, label.leaderLine.toY);
        ctx.strokeStyle = isSelected ? foreground : textMuted;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 处于拥挤状态时使用紧凑小胶囊，空间充裕时完整绘制
      const isCompact = label.crowded;
      const r = label.rect;

      // 标签背景胶囊
      ctx.fillStyle = isSelected
        ? (isLight ? "#e2e8f0" : "#27272a")
        : (isLight ? "#ffffff" : surfaceSoft);
      ctx.strokeStyle = isSelected ? foreground : badgeColor;
      ctx.lineWidth = isSelected ? 2 : 1;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(r.x, r.y, r.width, r.height, 3);
      } else {
        ctx.rect(r.x, r.y, r.width, r.height);
      }
      ctx.fill();
      ctx.stroke();

      // 标签文字：使用高对比度主前景色
      ctx.fillStyle = foreground;
      if (isCompact) {
        ctx.fillText("…", label.textX, label.textY);
      } else {
        ctx.fillText(label.name, label.textX, label.textY);
      }
    }
  }, [
    bgDraft,
    bgImage,
    canvasSize,
    customGridStep,
    draftPoints,
    fontScale,
    gridMode,
    isPickingPivot,
    isTemplate,
    selectedName,
    viewTransform,
  ]);

  const pushUndo = useCallback(() => {
    undoStackRef.current = [...undoStackRef.current.slice(-99), clonePoints(draftPoints)];
    setUndoDepth(undoStackRef.current.length);
  }, [draftPoints]);

  const updatePoint = useCallback(
    (name: string, patch: Partial<WaypointPoint>) => {
      pushUndo();
      setDraftPoints((current) =>
        current.map((point) => (point.name === name ? { ...point, ...patch } : point)),
      );
    },
    [pushUndo],
  );

  const handleAddTemplatePoint = useCallback(() => {
    if (!validateInputs(addFields.current)) return;
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
    if (
      dirty &&
      !window.confirm(
        locale === "en" ? "Discard unsaved waypoint edits?" : "放弃未保存的航点修改？",
      )
    ) {
      return;
    }
    void loadDocument(selectedFileId);
  }, [dirty, loadDocument, locale, selectedFileId]);

  const save = useCallback(async () => {
    if (!validateInputs(fields.current?.querySelector(isTemplate ? ".waypoints-template-list" : ".waypoint-form") ?? null)) return;
    if (!waypointDocument || !dirty || busy) return;
    if (!isTemplate && draftPoints.some((point) => ![point.x, point.y, point.z, point.yaw_deg].every(Number.isFinite))) {
      setError(locale === "en" ? "Fill in all waypoint coordinates" : "请填写所有航点坐标");
      return;
    }
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
    if (
      !window.confirm(
        locale === "en"
          ? `Overwrite ${waypointDocument.id} (${selectedFile?.file_name ?? waypointDocument.id})?`
          : `确认覆盖 ${waypointDocument.id}（${selectedFile?.file_name ?? waypointDocument.id}）？`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      const result = await saveWaypointDocument({
        id: waypointDocument.id,
        version: waypointDocument.version,
        points: draftPoints,
      });
      setWaypointDocument((current) =>
        current
          ? { ...current, points: clonePoints(draftPoints), version: result.version }
          : current,
      );
      baselineRef.current = JSON.stringify(draftPoints);
      setNotice(locale === "en" ? `Saved. Backup: ${result.backup}` : `已保存。备份：${result.backup}`);
    } catch (saveError) {
      if (saveError instanceof WaypointApiError && saveError.status === 409) {
        setError(
          locale === "en"
            ? "The waypoint file changed externally. Reload before saving."
            : "航点文件已被外部修改，请重新加载后再保存。",
        );
      } else {
        setError(saveError instanceof Error ? saveError.message : String(saveError));
      }
    } finally {
      setBusy(false);
    }
  }, [busy, draftPoints, dirty, isTemplate, locale, selectedFile?.file_name, templateStats, waypointDocument]);

  // 画布指针与拖动事件
  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const view = viewRef.current;
      if (!view) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const clientX = event.clientX - rect.left;
      const clientY = event.clientY - rect.top;

      // 处于选中心模式时，点击底图设置旋转缩放中心
      if (isPickingPivot && bgDraft && bgImage) {
        const world = canvasToWorld(view, clientX, clientY);
        const pixel = worldToImagePixel(bgDraft, bgDraft.width, bgDraft.height, world.x, world.y);
        const clampedU = Math.max(0, Math.min(bgDraft.width, pixel.u));
        const clampedV = Math.max(0, Math.min(bgDraft.height, pixel.v));
        setBgDraft((prev) => (prev ? { ...prev, pivotU: clampedU, pivotV: clampedV } : prev));
        setIsPickingPivot(false);
        setNotice(
          locale === "en"
            ? `Set pivot to pixel (${Math.round(clampedU)}, ${Math.round(clampedV)})`
            : `已设置旋转缩放中心为像素 (${Math.round(clampedU)}, ${Math.round(clampedV)})`,
        );
        return;
      }

      // 优先检测是否点中某个航点进行坐标拖拽
      const hit = draftPoints.find((point) => {
        const [px, py] = worldToCanvas(view, point.x, point.y);
        return Math.hypot(px - clientX, py - clientY) <= 15;
      });

      if (hit) {
        pushUndo();
        dragPointRef.current = hit.name;
        setSelectedName(hit.name);
        isPanningRef.current = false;
      } else {
        // 空白处拖拽平移视图
        isPanningRef.current = true;
        panStartRef.current = { x: clientX, y: clientY };
        dragPointRef.current = undefined;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [bgDraft, bgImage, draftPoints, isPickingPivot, locale, pushUndo],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const view = viewRef.current;
      if (!view) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const currentX = event.clientX - rect.left;
      const currentY = event.clientY - rect.top;

      if (dragPointRef.current) {
        // 拖拽航点位置
        const name = dragPointRef.current;
        const nextWorld = canvasToWorld(view, currentX, currentY);
        setDraftPoints((current) =>
          current.map((pt) =>
            pt.name === name ? { ...pt, x: nextWorld.x, y: nextWorld.y } : pt,
          ),
        );
      } else if (isPanningRef.current) {
        // 拖拽平移视图
        const dx = currentX - panStartRef.current.x;
        const dy = currentY - panStartRef.current.y;
        panStartRef.current = { x: currentX, y: currentY };
        setViewTransform((prev) => panView(prev, dx, dy));
      }
    },
    [],
  );

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    dragPointRef.current = undefined;
    isPanningRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  // 滚轮与触控板手势局部缩放/平移（原生监听）
  const lastGestureTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleNativeWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (performance.now() - lastGestureTimeRef.current < 120 && event.ctrlKey) {
        return;
      }

      const view = viewRef.current;
      if (!view) return;
      const rect = canvas.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;

      if (event.ctrlKey) {
        // Mac 触控板捏合手势（带 ctrlKey 的 wheel 事件）
        const zoomFactor = Math.exp(-event.deltaY * 0.01);
        setViewTransform((prev) => zoomViewAtAnchor(prev, cursorX, cursorY, zoomFactor));
      } else if (event.deltaMode === 0) {
        // 像素型滚动（Mac 双指平移）：平移画布
        setViewTransform((prev) => panView(prev, -event.deltaX, -event.deltaY));
      } else {
        // 传统鼠标滚轮：以光标为中心缩放
        const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
        setViewTransform((prev) => zoomViewAtAnchor(prev, cursorX, cursorY, factor));
      }
    };

    let gestureStartScale = 1;
    const handleGestureStart = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      lastGestureTimeRef.current = performance.now();
      gestureStartScale = 1;
    };

    const handleGestureChange = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      lastGestureTimeRef.current = performance.now();
      const ge = e as unknown as { clientX?: number; clientY?: number; scale?: number };
      const view = viewRef.current;
      if (!view) return;
      const rect = canvas.getBoundingClientRect();
      const cursorX = (ge.clientX ?? (rect.left + rect.width / 2)) - rect.left;
      const cursorY = (ge.clientY ?? (rect.top + rect.height / 2)) - rect.top;
      const scale = ge.scale ?? 1;
      const factor = scale / gestureStartScale;
      gestureStartScale = scale;
      if (Math.abs(factor - 1) > 0.001) {
        setViewTransform((prev) => zoomViewAtAnchor(prev, cursorX, cursorY, factor));
      }
    };

    const handleGestureEnd = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      lastGestureTimeRef.current = performance.now();
    };

    canvas.addEventListener("wheel", handleNativeWheel, { passive: false });
    canvas.addEventListener("gesturestart", handleGestureStart, { passive: false });
    canvas.addEventListener("gesturechange", handleGestureChange, { passive: false });
    canvas.addEventListener("gestureend", handleGestureEnd, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleNativeWheel);
      canvas.removeEventListener("gesturestart", handleGestureStart);
      canvas.removeEventListener("gesturechange", handleGestureChange);
      canvas.removeEventListener("gestureend", handleGestureEnd);
    };
  }, []);

  // 缩放控制按钮
  const handleZoomIn = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    setViewTransform((prev) => zoomViewAtAnchor(prev, view.width / 2, view.height / 2, 1.25));
  }, []);

  const handleZoomOut = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    setViewTransform((prev) => zoomViewAtAnchor(prev, view.width / 2, view.height / 2, 0.8));
  }, []);

  const handleResetFit = useCallback(() => {
    fitView(draftPoints);
  }, [draftPoints, fitView]);

  return (
    <section className="waypoints-editor-page" ref={fields}>
      {/* 顶部工具栏 */}
      <div className="waypoints-toolbar">
        <FileText />
        <select
          value={selectedFileId}
          onChange={(event) => {
            const next = event.target.value;
            if (
              dirty &&
              !window.confirm(
                locale === "en" ? "Discard unsaved waypoint edits?" : "放弃未保存的航点修改？",
              )
            ) {
              return;
            }
            if (
              bgDirty &&
              !window.confirm(
                locale === "en"
                  ? "Discard unsaved background image edits?"
                  : "放弃未保存的背景图修改？",
              )
            ) {
              return;
            }
            setSelectedFileId(next);
          }}
          aria-label={locale === "en" ? "Waypoint file" : "航点文件"}
        >
          {files.map((file) => (
            <option key={file.id} value={file.id} disabled={!file.file_available}>
              {file.label}
              {file.file_available ? "" : " (N/A)"}
            </option>
          ))}
        </select>

        <span className="waypoints-file-meta">
          {isTemplate
            ? locale === "en"
              ? `template · ${draftPoints.length} points`
              : `规则模板 · 共 ${draftPoints.length} 个点`
            : `${waypointDocument?.frame_id ?? selectedFile?.frame_id ?? "odom"} · ${
                waypointDocument?.formal
                  ? locale === "en"
                    ? "formal"
                    : "正式"
                  : locale === "en"
                    ? "debug"
                    : "调试"
              }`}
        </span>

        {/* 窄屏分栏切换 */}
        {isNarrow && (
          <nav className="waypoints-mobile-nav" role="tablist">
            <button
              className={mobileTab === "list" ? "active" : ""}
              onClick={() => setMobileTab("list")}
              title={locale === "en" ? "List view" : "列表视图"}
            >
              <List />
            </button>
            <button
              className={mobileTab === "map" ? "active" : ""}
              onClick={() => setMobileTab("map")}
              title={locale === "en" ? "Map view" : "网格视图"}
            >
              <MapPin />
            </button>
            <button
              className={mobileTab === "inspector" ? "active" : ""}
              onClick={() => setMobileTab("inspector")}
              title={locale === "en" ? "Properties view" : "属性视图"}
            >
              <Sliders />
            </button>
          </nav>
        )}

        <span className="spacer" />

        {/* 网格实际距离设置 */}
        {!isTemplate && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Grid style={{ width: 14, height: 14, color: "var(--text-muted)" }} />
            <select
              value={gridMode}
              onChange={(e) => setGridMode(e.target.value)}
              title={locale === "en" ? "Metric grid distance" : "网格实际距离"}
              aria-label={locale === "en" ? "Grid distance" : "网格距离"}
              style={{ minHeight: "var(--ctl-min-h)", maxWidth: 125 }}
            >
              <option value="auto">{locale === "en" ? "Grid: Auto" : "网格: 自动"}</option>
              <option value="0.1">0.1 m</option>
              <option value="0.2">0.2 m</option>
              <option value="0.5">0.5 m</option>
              <option value="1">1.0 m</option>
              <option value="2">2.0 m</option>
              <option value="5">5.0 m</option>
              <option value="custom">{locale === "en" ? "Custom..." : "自定义..."}</option>
            </select>
            {gridMode === "custom" && (
              <NumberInput
                value={customGridStep}
                onValueChange={(val) => setCustomGridStep(val && val > 0 ? val : 1.0)}
                min={0.01}
                max={100}
                step={0.1}
                style={{ width: 55, minHeight: "var(--ctl-min-h)" }}
                title={locale === "en" ? "Custom grid distance (meters)" : "自定义网格距离 (米)"}
              />
            )}
          </div>
        )}

        {/* 画布缩放按钮 */}
        <div className="waypoints-zoom-controls">
          <button
            className="icon-action"
            onClick={handleZoomIn}
            title={locale === "en" ? "Zoom in" : "放大视图"}
            aria-label={locale === "en" ? "Zoom in" : "放大视图"}
          >
            <ZoomIn />
          </button>
          <button
            className="icon-action"
            onClick={handleZoomOut}
            title={locale === "en" ? "Zoom out" : "缩小视图"}
            aria-label={locale === "en" ? "Zoom out" : "缩小视图"}
          >
            <ZoomOut />
          </button>
          <button
            className="icon-action"
            onClick={handleResetFit}
            title={locale === "en" ? "Fit to view" : "自适应居中"}
            aria-label={locale === "en" ? "Fit to view" : "自适应居中"}
          >
            <Maximize2 />
          </button>
        </div>

        <button
          className="icon-action"
          onClick={reload}
          disabled={busy}
          title={locale === "en" ? "Reload file" : "重新加载文件"}
          aria-label={locale === "en" ? "Reload file" : "重新加载文件"}
        >
          <RefreshCcw />
        </button>

        <button onClick={() => void save()} disabled={!dirty || busy || !waypointDocument}>
          <Save /> {locale === "en" ? "Save" : "保存"}
        </button>

        <button
          className="icon-action"
          onClick={undo}
          disabled={undoDepth === 0}
          title={locale === "en" ? "Undo" : "撤销"}
          aria-label={locale === "en" ? "Undo" : "撤销"}
        >
          <Undo2 />
        </button>

        <span className={`waypoints-draft-status ${dirty ? "dirty" : "clean"}`}>
          {dirty
            ? locale === "en"
              ? "Draft changed"
              : "草稿已修改"
            : locale === "en"
              ? "Loaded"
              : "已加载"}
        </span>
      </div>

      {isTemplate ? (
        <div className="waypoints-workspace template-workspace">
          <div className="waypoints-template-pane">
            <div className="waypoints-template-toolbar">
              <div className="waypoints-section-title">
                <ListOrdered /> {locale === "en" ? "Template sequence" : "模板航点序列"}
              </div>
              <div className="waypoints-template-add-bar" ref={addFields}>
                <TextInput
                  type="text"
                  placeholder={locale === "en" ? "New point name (e.g. A5)" : "新点位名称 (例如 A5)"}
                  value={newPointName}
                  onChange={(e) => setNewPointName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddTemplatePoint(); }}
                  spellCheck={false}
                  required
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
                    key={index}
                    className={`waypoints-template-row ${selectedName === point.name ? "active" : ""}`}
                    onClick={() => setSelectedName(point.name)}
                  >
                    <span className="template-row-idx">#{index + 1}</span>
                    <TextInput
                      className="template-name-input"
                      value={point.name}
                      onChange={(e) => updateTemplatePointName(index, e.target.value)}
                      placeholder={locale === "en" ? "Point name" : "点位名称"}
                      spellCheck={false}
                      required
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
        /* 工作区三栏（窄屏自适应） */
        <div className={`waypoints-workspace ${isNarrow ? `mobile-tab-${mobileTab}` : ""}`}>
        {/* 左侧航点列表 */}
        <aside className="waypoints-list">
          <div className="waypoints-section-title">
            <List /> {locale === "en" ? "Points" : "航点列表"}
          </div>
          {busy && <p className="empty-hint">{locale === "en" ? "Loading..." : "加载中..."}</p>}
          {!busy && displayRows.length === 0 && (
            <p className="empty-hint">{locale === "en" ? "No available points" : "暂无可用航点"}</p>
          )}
          {displayRows.map((row) => {
            const name = row.point?.name ?? row.templateName ?? "";
            const isGoal = (row.point?.type ?? row.templateType) === "goal";
            const isMissing = row.missing;

            return (
              <button
                className={`waypoint-row ${selectedName === name ? "active" : ""} ${
                  isMissing ? "missing" : isGoal ? "type-goal" : "type-waypoint"
                }`}
                key={name}
                onClick={() => {
                  if (row.point) {
                    setSelectedName(row.point.name);
                    if (isNarrow) setMobileTab("map");
                  }
                }}
                disabled={!row.point}
              >
                {/* 分类徽章：保留 G / W / ! */}
                <span
                  className={`waypoint-badge ${
                    isMissing ? "badge-missing" : isGoal ? "badge-goal" : "badge-waypoint"
                  }`}
                >
                  {isMissing ? "!" : isGoal ? "G" : "W"}
                </span>

                {/* 文本区域：长名称换行完整显示，坐标独立分行 */}
                <div className="waypoint-row-content">
                  <span className="waypoint-row-name" title={name}>
                    {name}
                  </span>
                  <span className="waypoint-row-coords">
                    {row.point
                      ? `x: ${row.point.x.toFixed(3)}, y: ${row.point.y.toFixed(3)}`
                      : locale === "en"
                        ? "missing"
                        : "缺失"}
                  </span>
                </div>
              </button>
            );
          })}
        </aside>

        {/* 中间 2D 航点网格地图 */}
        <div className="waypoints-map-wrap" ref={canvasWrapRef}>
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{ cursor: isPickingPivot ? "crosshair" : "default" }}
            aria-label={locale === "en" ? "Waypoint map" : "航点地图"}
          />

          {/* 右下角图例 */}
          <div className="waypoints-map-legend">
            <span>
              <i className="waypoint-legend-goal" /> {locale === "en" ? "goal (G)" : "目标点 (G)"}
            </span>
            <span>
              <i className="waypoint-legend-waypoint" />{" "}
              {locale === "en" ? "waypoint (W)" : "途径点 (W)"}
            </span>
          </div>

          {/* 密集点展开清单浮层 */}
          <div className="waypoints-crowded-widget">
            <button
              className="crowded-toggle-btn"
              onClick={() => setCrowdedListOpen((prev) => !prev)}
              title={locale === "en" ? "View all labels list" : "查看全部标签清单"}
            >
              <Layers /> {locale === "en" ? "Labels" : "标签清单"}
            </button>
            {crowdedListOpen && (
              <div className="waypoints-crowded-panel">
                <div className="crowded-panel-header">
                  <span>{locale === "en" ? "Point Labels" : "航点完整清单"}</span>
                  <button className="icon-action" onClick={() => setCrowdedListOpen(false)}>
                    ×
                  </button>
                </div>
                <div className="crowded-panel-body">
                  {draftPoints.map((pt) => (
                    <div
                      key={pt.name}
                      className={`crowded-item ${selectedName === pt.name ? "active" : ""}`}
                      onClick={() => {
                        setSelectedName(pt.name);
                        const view = viewRef.current;
                        if (view) {
                          setViewTransform((prev) => ({
                            ...prev,
                            centerX: pt.x,
                            centerY: pt.y,
                          }));
                        }
                      }}
                    >
                      <span className={pt.type === "goal" ? "text-goal" : "text-waypoint"}>
                        [{pt.type === "goal" ? "G" : "W"}]
                      </span>{" "}
                      {pt.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧航点属性编辑 */}
        <aside className="waypoints-inspector">
          <div className="waypoints-section-title">
            <Sliders /> {locale === "en" ? "Point data" : "航点属性"}
          </div>
          {(() => {
            const point = draftPoints.find((candidate) => candidate.name === selectedName);
            if (!point) {
              return (
                <p className="empty-hint">
                  {locale === "en" ? "Select an available point" : "选择一个已有航点"}
                </p>
              );
            }
            return (
              <div className="waypoint-form" key={point.name}>
                <label>
                  <span>{locale === "en" ? "Name" : "名称"}</span>
                  <input value={point.name} readOnly />
                </label>
                <label>
                  <span>{locale === "en" ? "Type" : "类型"}</span>
                  <select
                    value={point.type}
                    disabled={waypointDocument?.formal}
                    onChange={(event) =>
                      updatePoint(point.name, {
                        type: event.target.value as WaypointPoint["type"],
                      })
                    }
                  >
                    <option value="waypoint">waypoint</option>
                    <option value="goal">goal</option>
                  </select>
                </label>
                <label>
                  <span>X (m)</span>
                  <PointValue
                    value={point.x}
                    onChange={(value) => updatePoint(point.name, { x: value })}
                  />
                </label>
                <label>
                  <span>Y (m)</span>
                  <PointValue
                    value={point.y}
                    onChange={(value) => updatePoint(point.name, { y: value })}
                  />
                </label>
                <label>
                  <span>Z (m)</span>
                  <PointValue
                    value={point.z}
                    onChange={(value) => updatePoint(point.name, { z: value })}
                  />
                </label>
                <label>
                  <span>Yaw (deg)</span>
                  <PointValue
                    value={point.yaw_deg}
                    onChange={(value) => updatePoint(point.name, { yaw_deg: value })}
                  />
                </label>
              </div>
            );
          })()}

          {/* 背景底图管理（仅在 formal 正式航点预设下可用） */}
          {waypointDocument?.formal && (
            <div className="bg-inspector-section">
              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageUpload}
              />
              <div className="bg-title-row">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <ImageIcon style={{ width: 14, height: 14 }} />
                  {locale === "en" ? "Background map" : "背景底图"}
                </span>
                <div className="bg-title-actions">
                  {bgDraft ? (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title={locale === "en" ? "Replace image" : "替换图片"}
                      >
                        {locale === "en" ? "Replace" : "替换"}
                      </button>
                      <button
                        type="button"
                        className="delete"
                        onClick={() => void handleDeleteBackground()}
                        title={locale === "en" ? "Delete background" : "删除背景"}
                      >
                        <Trash2 style={{ width: 12, height: 12 }} />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      <Upload style={{ width: 12, height: 12 }} />
                      {locale === "en" ? "Upload" : "上传"}
                    </button>
                  )}
                </div>
              </div>

              {bgDraft && (
                <>
                  <label className="bg-row">
                    <span>{locale === "en" ? "Visible" : "显示"}</span>
                    <input
                      type="checkbox"
                      checked={bgDraft.visible}
                      onChange={(e) =>
                        setBgDraft((prev) => (prev ? { ...prev, visible: e.target.checked } : prev))
                      }
                    />
                  </label>

                  {/* 旋转缩放中心设置按钮 */}
                  <button
                    type="button"
                    className={`bg-pivot-btn ${isPickingPivot ? "active" : ""}`}
                    onClick={() => setIsPickingPivot(!isPickingPivot)}
                    title={
                      locale === "en"
                        ? "Click to pick rotation & scaling pivot on the image"
                        : "点击后在底图上选点作为旋转与缩放中心"
                    }
                  >
                    <Crosshair />
                    {isPickingPivot
                      ? locale === "en"
                        ? "Click image for pivot..."
                        : "请在底图上点击选点..."
                      : locale === "en"
                        ? "Set transform pivot"
                        : "设置旋转缩放中心"}
                  </button>

                  <div style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "var(--mono)" }}>
                    {locale === "en" ? "Pivot pixel" : "中心像素"}: U {Math.round(bgDraft.pivotU)}, V{" "}
                    {Math.round(bgDraft.pivotV)}
                  </div>

                  {/* 中心 X (m) */}
                  <div className="bg-row">
                    <span>X (m)</span>
                    <NumberInput
                      value={bgDraft.centerX}
                      onValueChange={(val) => updateBgCenter(val ?? 0, bgDraft.centerY)}
                    />
                    <div className="bg-nudge-group">
                      {[-0.1, -0.01, 0.01, 0.1].map((delta) => (
                        <button
                          key={delta}
                          type="button"
                          className="bg-nudge-btn"
                          onClick={() => updateBgCenter(bgDraft.centerX + delta, bgDraft.centerY)}
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 中心 Y (m) */}
                  <div className="bg-row">
                    <span>Y (m)</span>
                    <NumberInput
                      value={bgDraft.centerY}
                      onValueChange={(val) => updateBgCenter(bgDraft.centerX, val ?? 0)}
                    />
                    <div className="bg-nudge-group">
                      {[-0.1, -0.01, 0.01, 0.1].map((delta) => (
                        <button
                          key={delta}
                          type="button"
                          className="bg-nudge-btn"
                          onClick={() => updateBgCenter(bgDraft.centerX, bgDraft.centerY + delta)}
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 缩放 (m/px) */}
                  <div className="bg-row">
                    <span title={locale === "en" ? "Scale: meters per pixel (m/px)" : "缩放单位: 米/像素 (m/px)"}>
                      {locale === "en" ? "Scale (m/px)" : "缩放 (m/px)"}
                    </span>
                    <NumberInput
                      value={bgDraft.metersPerPixel}
                      onValueChange={(val) =>
                        updateBgScaleOrRot(val && val > 0 ? val : 1.0, bgDraft.rotationDeg)
                      }
                    />
                    <div className="bg-nudge-group">
                      {[
                        { label: "-0.1", delta: -0.1 },
                        { label: "-1%", factor: -0.01 },
                        { label: "+1%", factor: 0.01 },
                        { label: "+0.1", delta: 0.1 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          className="bg-nudge-btn"
                          onClick={() => {
                            const next = item.delta !== undefined
                              ? Math.max(0.0001, Math.round((bgDraft.metersPerPixel + item.delta) * 10000) / 10000)
                              : Math.max(0.0001, bgDraft.metersPerPixel * (1 + (item.factor ?? 0)));
                            updateBgScaleOrRot(next, bgDraft.rotationDeg);
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 旋转角度 (deg) */}
                  <div className="bg-row">
                    <span>{locale === "en" ? "Rot (°)" : "旋转 (°)"}</span>
                    <NumberInput
                      value={bgDraft.rotationDeg}
                      onValueChange={(val) =>
                        updateBgScaleOrRot(bgDraft.metersPerPixel, val ?? 0)
                      }
                    />
                    <div className="bg-nudge-group">
                      {[-5, -1, -0.1, 0.1, 1, 5].map((delta) => (
                        <button
                          key={delta}
                          type="button"
                          className="bg-nudge-btn"
                          onClick={() =>
                            updateBgScaleOrRot(
                              bgDraft.metersPerPixel,
                              Math.round((bgDraft.rotationDeg + delta) * 10) / 10,
                            )
                          }
                        >
                          {delta > 0 ? `+${delta}` : delta}°
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 透明度 */}
                  <div className="bg-row">
                    <span>{locale === "en" ? "Opacity" : "透明度"}</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={bgDraft.opacity}
                      onChange={(e) =>
                        setBgDraft((prev) =>
                          prev ? { ...prev, opacity: parseFloat(e.target.value) } : prev,
                        )
                      }
                    />
                  </div>

                  {/* 底图尺寸提示 */}
                  <div style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "var(--mono)" }}>
                    {(bgDraft.width * bgDraft.metersPerPixel).toFixed(2)}m ×{" "}
                    {(bgDraft.height * bgDraft.metersPerPixel).toFixed(2)}m (
                    {bgDraft.width}×{bgDraft.height}px)
                  </div>

                  {/* 操作与保存按钮 */}
                  <div className="bg-action-bar">
                    <button
                      type="button"
                      onClick={() => void handleSaveBackground()}
                      disabled={!bgDirty || bgSaving}
                    >
                      <Save />
                      {bgSaving
                        ? locale === "en"
                          ? "Saving..."
                          : "保存中..."
                        : locale === "en"
                          ? "Save map"
                          : "保存底图"}
                    </button>
                    <button
                      type="button"
                      onClick={handleResetBackground}
                      title={locale === "en" ? "Reset" : "恢复默认"}
                    >
                      <RotateCcw />
                      {locale === "en" ? "Reset" : "恢复默认"}
                    </button>
                  </div>
                  <div className={`bg-status-text ${bgDirty ? "dirty" : ""}`}>
                    {bgDirty
                      ? locale === "en"
                        ? "Unsaved background edits"
                        : "背景底图未保存"
                      : locale === "en"
                        ? "Background saved"
                        : "背景底图已保存"}
                  </div>
                </>
              )}
            </div>
          )}
        </aside>
      </div>
      )}

      {(error || notice) && (
        <div
          className={`waypoints-feedback ${error ? "error-line" : ""}`}
          role={error ? "alert" : "status"}
        >
          {error ?? notice}
        </div>
      )}
    </section>
  );
}

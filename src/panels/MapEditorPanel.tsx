/**
 * 2D 栅格地图编辑器：加载 map_server 的 PGM+YAML（或从 /map 话题抓取），
 * 画笔/矩形修改占用值（清噪点、封门、抹掉动态障碍残影），导出回 PGM+YAML。
 */
import { useCallback, useEffect, useRef, useState } from "react";

import type { WorkerBridge } from "../bridge/WorkerBridge";
import { useI18n } from "../app/i18n";
import type { EditableMap } from "../core/mapio";
import { parseMapYaml, parsePgm, serializeMapYaml, serializePgm } from "../core/mapio";
import type { Quaternion } from "../core/types";

type Tool = "paint" | "rect";
type CellValue = 100 | 0 | -1;

const MAX_UNDO = 10;

// 数据即内容：沿用 ROS 地图惯例配色（白自由/黑占用/灰未知）
const COLORS: Record<string, [number, number, number]> = {
  free: [232, 232, 232],
  occupied: [20, 20, 20],
  unknown: [128, 128, 128],
};

function cellColor(v: number): [number, number, number] {
  return v === 100 ? COLORS.occupied : v === 0 ? COLORS.free : COLORS.unknown;
}

function yawFromQuat(q: Quaternion): number {
  return Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
}

function download(data: ArrayBuffer | string, name: string): void {
  const blob = new Blob([data], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function MapEditorPanel({ bridge, theme }: { bridge: WorkerBridge; theme?: string }) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<EditableMap>(null);
  const offscreenRef = useRef<HTMLCanvasElement>(null);
  const undoRef = useRef<Int8Array[]>([]);
  // 视图变换：屏幕 = 图像坐标 * scale + offset
  const viewRef = useRef({ scale: 4, ox: 0, oy: 0 });
  const dragRef = useRef<
    | { kind: "paint"; lastImg: [number, number] }
    | { kind: "rect"; startImg: [number, number]; curImg: [number, number] }
    | { kind: "pan"; last: [number, number] }
    | null
  >(null);

  const [mapInfo, setMapInfo] = useState<{ width: number; height: number; name: string }>();
  const [tool, setTool] = useState<Tool>("paint");
  const [value, setValue] = useState<CellValue>(0);
  const [brush, setBrush] = useState(3);
  const [undoDepth, setUndoDepth] = useState(0);
  const [hint, setHint] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);
  const baseNameRef = useRef("map");

  // ---- 绘制 ----

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const off = offscreenRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    // 底色/预览框是 chrome，读 CSS 令牌跟随主题（地图像素是数据，不动）
    const tokens = getComputedStyle(canvas);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = tokens.getPropertyValue("--canvas").trim() || "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!off) return;
    const { scale, ox, oy } = viewRef.current;
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0);
    // 矩形工具的拖拽预览
    const drag = dragRef.current;
    if (drag?.kind === "rect") {
      const [x0, y0] = drag.startImg;
      const [x1, y1] = drag.curImg;
      ctx.strokeStyle = tokens.getPropertyValue("--foreground").trim() || "#f5f5f5";
      ctx.lineWidth = 1 / scale;
      ctx.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0) + 1, Math.abs(y1 - y0) + 1);
    }
  }, []);

  // 主题变化重绘（底色/预览框色从 CSS 令牌读取）
  useEffect(() => {
    redraw();
  }, [theme, redraw]);

  /** 把栅格数据的一个区域刷进 offscreen（图像行 = height-1-栅格行） */
  const blit = useCallback((imgX0: number, imgY0: number, imgX1: number, imgY1: number) => {
    const map = mapRef.current;
    const off = offscreenRef.current;
    if (!map || !off) return;
    const x0 = Math.max(0, imgX0);
    const y0 = Math.max(0, imgY0);
    const x1 = Math.min(map.width - 1, imgX1);
    const y1 = Math.min(map.height - 1, imgY1);
    if (x1 < x0 || y1 < y0) return;
    const w = x1 - x0 + 1;
    const h = y1 - y0 + 1;
    const img = off.getContext("2d")!.createImageData(w, h);
    for (let iy = 0; iy < h; iy++) {
      const gridRow = map.height - 1 - (y0 + iy);
      for (let ix = 0; ix < w; ix++) {
        const [r, g, b] = cellColor(map.data[gridRow * map.width + x0 + ix]);
        const d = (iy * w + ix) * 4;
        img.data[d] = r;
        img.data[d + 1] = g;
        img.data[d + 2] = b;
        img.data[d + 3] = 255;
      }
    }
    off.getContext("2d")!.putImageData(img, x0, y0);
  }, []);

  const setMap = useCallback(
    (map: EditableMap, name: string) => {
      mapRef.current = map;
      baseNameRef.current = name;
      undoRef.current = [];
      setUndoDepth(0);
      const off = document.createElement("canvas");
      off.width = map.width;
      off.height = map.height;
      offscreenRef.current = off;
      blit(0, 0, map.width - 1, map.height - 1);
      // 视图适配居中
      const canvas = canvasRef.current;
      if (canvas) {
        const scale = Math.min(canvas.width / map.width, canvas.height / map.height) * 0.92;
        viewRef.current = {
          scale,
          ox: (canvas.width - map.width * scale) / 2,
          oy: (canvas.height - map.height * scale) / 2,
        };
      }
      setMapInfo({ width: map.width, height: map.height, name });
      setHint(undefined);
      redraw();
    },
    [blit, redraw],
  );

  // ---- 编辑操作 ----

  const pushUndo = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    undoRef.current.push(new Int8Array(map.data));
    if (undoRef.current.length > MAX_UNDO) undoRef.current.shift();
    setUndoDepth(undoRef.current.length);
  }, []);

  const undo = useCallback(() => {
    const map = mapRef.current;
    const snapshot = undoRef.current.pop();
    if (!map || !snapshot) return;
    map.data.set(snapshot);
    setUndoDepth(undoRef.current.length);
    blit(0, 0, map.width - 1, map.height - 1);
    redraw();
  }, [blit, redraw]);

  /** 图像坐标处画圆刷 */
  const paintAt = useCallback(
    (imgX: number, imgY: number) => {
      const map = mapRef.current;
      if (!map) return;
      const r = brush;
      const gridRowC = map.height - 1 - imgY;
      for (let dy = -r + 1; dy < r; dy++) {
        for (let dx = -r + 1; dx < r; dx++) {
          if (dx * dx + dy * dy > (r - 0.5) * (r - 0.5)) continue;
          const col = imgX + dx;
          const row = gridRowC - dy;
          if (col < 0 || col >= map.width || row < 0 || row >= map.height) continue;
          map.data[row * map.width + col] = value;
        }
      }
      blit(imgX - r, imgY - r, imgX + r, imgY + r);
    },
    [brush, value, blit],
  );

  const fillRect = useCallback(
    (a: [number, number], b: [number, number]) => {
      const map = mapRef.current;
      if (!map) return;
      const x0 = Math.max(0, Math.min(a[0], b[0]));
      const x1 = Math.min(map.width - 1, Math.max(a[0], b[0]));
      const y0 = Math.max(0, Math.min(a[1], b[1]));
      const y1 = Math.min(map.height - 1, Math.max(a[1], b[1]));
      for (let iy = y0; iy <= y1; iy++) {
        const row = map.height - 1 - iy;
        map.data.fill(value, row * map.width + x0, row * map.width + x1 + 1);
      }
      blit(x0, y0, x1, y1);
    },
    [value, blit],
  );

  // ---- 输入 ----

  const toImg = useCallback((e: { clientX: number; clientY: number }): [number, number] => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const { scale, ox, oy } = viewRef.current;
    return [
      Math.floor((e.clientX - rect.left - ox) / scale),
      Math.floor((e.clientY - rect.top - oy) / scale),
    ];
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      if (e.button === 2 || e.button === 1) {
        dragRef.current = { kind: "pan", last: [e.clientX, e.clientY] };
        return;
      }
      if (!mapRef.current) return;
      const img = toImg(e);
      if (tool === "paint") {
        pushUndo();
        dragRef.current = { kind: "paint", lastImg: img };
        paintAt(img[0], img[1]);
        redraw();
      } else {
        dragRef.current = { kind: "rect", startImg: img, curImg: img };
        redraw();
      }
    },
    [tool, toImg, pushUndo, paintAt, redraw],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (drag.kind === "pan") {
        viewRef.current.ox += e.clientX - drag.last[0];
        viewRef.current.oy += e.clientY - drag.last[1];
        drag.last = [e.clientX, e.clientY];
      } else if (drag.kind === "paint") {
        // 事件点之间线性插值，快速拖动不留断点
        const img = toImg(e);
        const [lx, ly] = drag.lastImg;
        const steps = Math.max(Math.abs(img[0] - lx), Math.abs(img[1] - ly), 1);
        for (let s = 1; s <= steps; s++) {
          paintAt(
            Math.round(lx + ((img[0] - lx) * s) / steps),
            Math.round(ly + ((img[1] - ly) * s) / steps),
          );
        }
        drag.lastImg = img;
      } else {
        drag.curImg = toImg(e);
      }
      redraw();
    },
    [toImg, paintAt, redraw],
  );

  const onPointerUp = useCallback(() => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag?.kind === "rect") {
      pushUndo();
      fillRect(drag.startImg, drag.curImg);
    }
    redraw();
  }, [fillRect, pushUndo, redraw]);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const v = viewRef.current;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const next = Math.min(64, Math.max(0.2, v.scale * factor));
      // 以光标为中心缩放
      v.ox = mx - ((mx - v.ox) / v.scale) * next;
      v.oy = my - ((my - v.oy) / v.scale) * next;
      v.scale = next;
      redraw();
    },
    [redraw],
  );

  // ---- 导入/导出 ----

  const openFiles = useCallback(
    async (files: FileList) => {
      let meta;
      let pgmFile: File | undefined;
      let name = "map";
      for (const f of files) {
        if (f.name.endsWith(".yaml") || f.name.endsWith(".yml")) {
          meta = parseMapYaml(await f.text()).meta;
        } else if (f.name.endsWith(".pgm")) {
          pgmFile = f;
          name = f.name.replace(/\.pgm$/, "");
        }
      }
      if (!pgmFile) {
        setHint(t("choosePgm"));
        return;
      }
      meta ??= {
        resolution: 0.05,
        origin: [0, 0, 0] as [number, number, number],
        negate: 0,
        occupiedThresh: 0.65,
        freeThresh: 0.196,
      };
      try {
        setMap(parsePgm(await pgmFile.arrayBuffer(), meta), name);
      } catch (err) {
        setHint(t("parseFailed", { message: err instanceof Error ? err.message : String(err) }));
      }
    },
    [setMap, t],
  );

  const importFromTopic = useCallback(() => {
    const waiting = t("waitingMap");
    setHint(waiting);
    const unsub = bridge.subscribe("/map", (payload) => {
      if (payload.kind !== "grid") return;
      unsub();
      const { info, data } = payload;
      setMap(
        {
          width: info.width,
          height: info.height,
          data: new Int8Array(data), // 缓冲会被回收，必须拷贝
          meta: {
            resolution: info.resolution,
            origin: [
              info.origin.position.x,
              info.origin.position.y,
              yawFromQuat(info.origin.orientation),
            ],
            negate: 0,
            occupiedThresh: 0.65,
            freeThresh: 0.196,
          },
        },
        "map",
      );
    });
    // 10s 没等到就放弃
    setTimeout(() => {
      unsub();
      setHint((h) => (h === waiting ? t("mapTimeout") : h));
    }, 10_000);
  }, [bridge, setMap, t]);

  const exportMap = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const base = baseNameRef.current;
    download(serializePgm(map), `${base}.pgm`);
    download(serializeMapYaml(`${base}.pgm`, map.meta), `${base}.yaml`);
  }, []);

  // ---- 画布尺寸 ----

  useEffect(() => {
    const canvas = canvasRef.current!;
    const resize = () => {
      const el = canvas.parentElement!;
      if (el.clientWidth === 0) return;
      canvas.width = el.clientWidth;
      canvas.height = el.clientHeight;
      redraw();
    };
    resize();
    const ob = new ResizeObserver(resize);
    ob.observe(canvas.parentElement!);
    return () => ob.disconnect();
  }, [redraw]);

  return (
    <div className="map-editor">
      <div className="map-toolbar">
        <button onClick={() => fileRef.current?.click()}>{t("openMapFiles")}</button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pgm,.yaml,.yml"
          style={{ display: "none" }}
          onChange={(e) => e.target.files && openFiles(e.target.files)}
        />
        <button onClick={importFromTopic}>{t("captureMap")}</button>
        <span className="divider" />
        <span className="group-label">{t("value")}</span>
        {(
          [
            [0, t("free")],
            [100, t("occupied")],
            [-1, t("unknown")],
          ] as [CellValue, string][]
        ).map(([v, label]) => (
          <button key={v} className={value === v ? "active" : ""} onClick={() => setValue(v)}>
            {label}
          </button>
        ))}
        <span className="divider" />
        <span className="group-label">{t("tools")}</span>
        <button className={tool === "paint" ? "active" : ""} onClick={() => setTool("paint")}>
          {t("brush")}
        </button>
        <button className={tool === "rect" ? "active" : ""} onClick={() => setTool("rect")}>
          {t("rectangle")}
        </button>
        <label className="brush-size">
          {t("brushSize", { size: brush })}
          <input
            type="range"
            min={1}
            max={20}
            value={brush}
            onChange={(e) => setBrush(Number(e.target.value))}
          />
        </label>
        <span className="divider" />
        <button onClick={undo} disabled={undoDepth === 0}>
          {t("undoCount", { count: undoDepth })}
        </button>
        <button onClick={exportMap} disabled={!mapInfo}>
          {t("exportMap")}
        </button>
        <span className="spacer" />
        {mapInfo && (
          <span className="map-meta">
            {mapInfo.name} · {mapInfo.width}×{mapInfo.height}
          </span>
        )}
      </div>
      <div className="map-canvas-wrap">
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onWheel={onWheel}
          onContextMenu={(e) => e.preventDefault()}
        />
        {!mapInfo && (
          <div className="map-empty">
            {hint ?? t("mapEmpty")}
          </div>
        )}
        {mapInfo && hint && <div className="map-empty">{hint}</div>}
      </div>
    </div>
  );
}

import { Eye, EyeOff, Pause, Play, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

import type { WorkerBridge } from "../bridge/WorkerBridge";
import type { TopicInfo } from "../core/FoxgloveConnection";
import {
  computeRangeInWindow,
  computeSharedRange,
  panTimeWindow,
  relativeArrivalSec,
  seriesKey,
  zoomTimeWindow,
} from "../core/plot";
import { CollapsiblePanel } from "../app/CollapsiblePanel";
import { useI18n } from "../app/i18n";

const WINDOW_SEC = 60;
const MAX_POINTS = 3000;
const PALETTE = ["#4ea1ff", "#ffb347", "#5ad469", "#ff6b81", "#c792ea", "#6be7dd"];

interface Series {
  id: number;
  topic: string;
  field: string;
  color: string;
  visible: boolean;
  ts: number[];
  vs: number[];
  latest?: number;
  status: "waiting" | "ok" | "invalid";
}

function getPath(obj: unknown, path: string): unknown {
  let current = obj;
  for (const key of path.split(".")) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

const FIELD_HINTS: Record<string, string[]> = {
  "nav_msgs/msg/Odometry": [
    "twist.twist.linear.x",
    "twist.twist.angular.z",
    "pose.pose.position.x",
    "pose.pose.position.y",
  ],
  "std_msgs/msg/Float32": ["data"],
  "sensor_msgs/msg/JointState": ["position.0", "position.1"],
};

export interface PlotSeriesConfig {
  topic: string;
  field: string;
  visible?: boolean;
}

export function PlotPanel({
  embedded = false,
  bridge,
  topics,
  theme = "dark",
  fontScale = 1,
  initialSeries,
  onSeriesChange,
  onClose,
}: {
  embedded?: boolean;
  bridge: WorkerBridge;
  topics: TopicInfo[];
  theme?: "dark" | "light";
  fontScale?: number;
  initialSeries?: PlotSeriesConfig[];
  onSeriesChange?: (series: PlotSeriesConfig[]) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const plotRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot>(null);
  const seriesRef = useRef<Series[]>([]);
  const subscriptionsRef = useRef(new Map<string, () => void>());
  const startedAtRef = useRef(performance.now());
  const pausedRef = useRef(false);
  const themeRef = useRef(theme);
  const onSeriesChangeRef = useRef(onSeriesChange);
  const nextId = useRef(1);
  const manualWindowRef = useRef<[number, number] | null>(null);
  themeRef.current = theme;
  onSeriesChangeRef.current = onSeriesChange;

  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [newField, setNewField] = useState("");
  const [paused, setPaused] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [, setStatusTick] = useState(0);

  const commitSeries = useCallback((next: Series[]) => {
    seriesRef.current = next;
    setSeriesList(next);
  }, []);

  const ensureSubscription = useCallback(
    (topic: string) => {
      if (subscriptionsRef.current.has(topic)) return;
      const unsubscribe = bridge.subscribe(topic, (payload) => {
        if (payload.kind !== "raw") return;
        const now = relativeArrivalSec(performance.now(), startedAtRef.current);
        for (const series of seriesRef.current) {
          if (series.topic !== topic) continue;
          const raw = getPath(payload.message, series.field);
          if (typeof raw !== "number" && typeof raw !== "bigint") {
            series.status = "invalid";
            continue;
          }
          const value = Number(raw);
          if (!Number.isFinite(value)) {
            series.status = "invalid";
            continue;
          }
          series.status = "ok";
          series.latest = value;
          series.ts.push(now);
          series.vs.push(value);
          const cutoff = now - WINDOW_SEC;
          while (series.ts.length > MAX_POINTS || (series.ts[0] ?? now) < cutoff) {
            series.ts.shift();
            series.vs.shift();
          }
        }
      });
      subscriptionsRef.current.set(topic, unsubscribe);
    },
    [bridge],
  );

  const rebuild = useCallback(() => {
    uplotRef.current?.destroy();
    uplotRef.current = null;
    const element = plotRef.current;
    const current = seriesRef.current;
    if (!element || current.length === 0) return;
    const dark = themeRef.current === "dark";
    const axisFont = `${Math.max(9, Math.round(11 * fontScale))}px system-ui, -apple-system, sans-serif`;
    const axis = {
      stroke: dark ? "rgba(245,245,245,0.74)" : "rgba(10,10,10,0.74)",
      grid: { stroke: dark ? "rgba(245,245,245,0.14)" : "rgba(10,10,10,0.14)", width: 1 },
      ticks: { stroke: dark ? "rgba(245,245,245,0.36)" : "rgba(10,10,10,0.36)", width: 1 },
      font: axisFont,
    };
    uplotRef.current = new uPlot(
      {
        width: element.clientWidth,
        height: Math.max(100, element.clientHeight - 4),
        series: [
          {},
          ...current.map((series) => ({
            label: `${series.topic}.${series.field}`,
            stroke: series.color,
            show: series.visible,
            width: 2,
            points: { show: false },
          })),
        ],
        axes: [axis, { ...axis }],
        legend: { show: true },
        cursor: { drag: { x: false, y: false } },
        scales: { x: { time: false, auto: false }, y: { auto: false } },
      },
      [[], ...current.map(() => [])] as uPlot.AlignedData,
      element,
    );
  }, [fontScale]);

  const addEntry = useCallback(
    (config: PlotSeriesConfig) => {
      const topic = config.topic.trim();
      const field = config.field.trim();
      if (!topic || !field) return false;
      if (seriesRef.current.some((item) => seriesKey(item.topic, item.field) === seriesKey(topic, field))) {
        return false;
      }
      const id = nextId.current++;
      const next = [
        ...seriesRef.current,
        {
          id,
          topic,
          field,
          color: PALETTE[(id - 1) % PALETTE.length],
          visible: config.visible ?? true,
          ts: [],
          vs: [],
          status: "waiting" as const,
        },
      ];
      commitSeries(next);
      ensureSubscription(topic);
      queueMicrotask(rebuild);
      return true;
    },
    [commitSeries, ensureSubscription, rebuild],
  );

  useEffect(() => {
    for (const series of initialSeries ?? []) addEntry(series);
    // Initial state is intentionally restored once per panel instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onSeriesChangeRef.current?.(
      seriesList.map(({ topic, field, visible }) => ({ topic, field, ...(visible ? {} : { visible }) })),
    );
  }, [seriesList]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (pausedRef.current) return;
      const plot = uplotRef.current;
      const current = seriesRef.current;
      if (!plot || current.length === 0) return;
      const joined = uPlot.join(current.map((s) => [s.ts, s.vs] as uPlot.AlignedData)) as uPlot.AlignedData;
      plot.setData(joined);

      const latest = current.reduce((max, series) => Math.max(max, series.ts.at(-1) ?? 0), 0);

      if (manualWindowRef.current !== null) {
        // 手动时间轴模式：保持当前手动窗口，数据继续接收
        const [wMin, wMax] = manualWindowRef.current;
        plot.setScale("x", { min: wMin, max: wMax });
        const [min, max] = computeRangeInWindow(current, manualWindowRef.current);
        plot.setScale("y", { min, max });
      } else {
        // 自动实时跟随模式
        plot.setScale("x", { min: Math.max(0, latest - WINDOW_SEC), max: Math.max(WINDOW_SEC, latest) });
        const visibleValues = current
          .filter((series) => series.visible)
          .map((series) => series.vs.filter((_, index) => (series.ts[index] ?? 0) >= latest - WINDOW_SEC));
        const [min, max] = computeSharedRange(visibleValues);
        plot.setScale("y", { min, max });
      }

      setStatusTick((value) => value + 1);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // 恢复自动跟随实时窗口
  const resetToRealtime = useCallback(() => {
    manualWindowRef.current = null;
    setIsManualMode(false);
    const plot = uplotRef.current;
    const current = seriesRef.current;
    if (plot && current.length > 0) {
      const latest = current.reduce((max, series) => Math.max(max, series.ts.at(-1) ?? 0), 0);
      plot.setScale("x", { min: Math.max(0, latest - WINDOW_SEC), max: Math.max(WINDOW_SEC, latest) });
    }
  }, []);

  // 时间轴滚轮/触控板手势缩放和平移（原生监听，基于 CSS 像素）
  const lastGestureTimeRef = useRef(0);

  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;

    const handleNativeWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const plot = uplotRef.current;
      if (!plot) return;

      if (performance.now() - lastGestureTimeRef.current < 120 && event.ctrlKey) {
        return;
      }

      // 使用 plot.over 获取绘图区在视口中的实际 CSS 像素位置
      const overRect = plot.over.getBoundingClientRect();
      const cursorPxX = event.clientX - overRect.left;
      const cursorTimeSec = plot.posToVal(cursorPxX, "x");
      if (!Number.isFinite(cursorTimeSec)) return;

      const currentXScale = plot.scales.x;
      const currentMin = currentXScale.min ?? 0;
      const currentMax = currentXScale.max ?? WINDOW_SEC;
      const currentWindow: [number, number] = manualWindowRef.current ?? [currentMin, currentMax];

      if (event.ctrlKey) {
        // 触控板捏合手势：缩放时间窗
        const factor = Math.exp(-event.deltaY * 0.01);
        const next = zoomTimeWindow(currentWindow, cursorTimeSec, factor);
        manualWindowRef.current = next;
        setIsManualMode(true);
        plot.setScale("x", { min: next[0], max: next[1] });
      } else if (event.deltaMode === 0 && Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        // 触控板两指水平滑动：平移时间窗（使用 overRect.width CSS 像素宽度）
        const span = currentWindow[1] - currentWindow[0];
        const secPerPx = span / Math.max(10, overRect.width);
        const next = panTimeWindow(currentWindow, event.deltaX * secPerPx);
        manualWindowRef.current = next;
        setIsManualMode(true);
        plot.setScale("x", { min: next[0], max: next[1] });
      } else {
        // 传统滚轮：以光标时间为锚点缩放
        const factor = event.deltaY < 0 ? 0.85 : 1 / 0.85;
        const next = zoomTimeWindow(currentWindow, cursorTimeSec, factor);
        manualWindowRef.current = next;
        setIsManualMode(true);
        plot.setScale("x", { min: next[0], max: next[1] });
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
      const plot = uplotRef.current;
      if (!plot) return;
      const ge = e as unknown as { clientX?: number; scale?: number };
      const overRect = plot.over.getBoundingClientRect();
      const cursorPxX = (ge.clientX ?? (overRect.left + overRect.width / 2)) - overRect.left;
      const cursorTimeSec = plot.posToVal(cursorPxX, "x");
      if (!Number.isFinite(cursorTimeSec)) return;

      const currentXScale = plot.scales.x;
      const currentMin = currentXScale.min ?? 0;
      const currentMax = currentXScale.max ?? WINDOW_SEC;
      const currentWindow: [number, number] = manualWindowRef.current ?? [currentMin, currentMax];

      const scale = ge.scale ?? 1;
      const factor = scale / gestureStartScale;
      gestureStartScale = scale;
      if (Math.abs(factor - 1) > 0.001) {
        const zoomFactor = 1 / factor;
        const next = zoomTimeWindow(currentWindow, cursorTimeSec, zoomFactor);
        manualWindowRef.current = next;
        setIsManualMode(true);
        plot.setScale("x", { min: next[0], max: next[1] });
      }
    };
    const handleGestureEnd = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      lastGestureTimeRef.current = performance.now();
    };

    el.addEventListener("wheel", handleNativeWheel, { passive: false });
    el.addEventListener("gesturestart", handleGestureStart, { passive: false });
    el.addEventListener("gesturechange", handleGestureChange, { passive: false });
    el.addEventListener("gestureend", handleGestureEnd, { passive: false });

    return () => {
      el.removeEventListener("wheel", handleNativeWheel);
      el.removeEventListener("gesturestart", handleGestureStart);
      el.removeEventListener("gesturechange", handleGestureChange);
      el.removeEventListener("gestureend", handleGestureEnd);
    };
  }, []);

  useEffect(() => {
    const element = plotRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      uplotRef.current?.setSize({
        width: element.clientWidth,
        height: Math.max(100, element.clientHeight - 4),
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    rebuild();
  }, [theme, fontScale, rebuild]);

  useEffect(() => {
    const subscriptions = subscriptionsRef.current;
    return () => {
      for (const unsubscribe of subscriptions.values()) unsubscribe();
      subscriptions.clear();
      uplotRef.current?.destroy();
    };
  }, []);

  const removeSeries = useCallback(
    (id: number) => {
      const removed = seriesRef.current.find((series) => series.id === id);
      if (!removed) return;
      const next = seriesRef.current.filter((series) => series.id !== id);
      commitSeries(next);
      if (!next.some((series) => series.topic === removed.topic)) {
        subscriptionsRef.current.get(removed.topic)?.();
        subscriptionsRef.current.delete(removed.topic);
      }
      queueMicrotask(rebuild);
    },
    [commitSeries, rebuild],
  );

  const clearSeries = useCallback(() => {
    for (const unsubscribe of subscriptionsRef.current.values()) unsubscribe();
    subscriptionsRef.current.clear();
    commitSeries([]);
    uplotRef.current?.destroy();
    uplotRef.current = null;
  }, [commitSeries]);

  const toggleSeries = useCallback(
    (id: number) => {
      commitSeries(
        seriesRef.current.map((series) =>
          series.id === id ? { ...series, visible: !series.visible } : series,
        ),
      );
      queueMicrotask(rebuild);
    },
    [commitSeries, rebuild],
  );

  const plotTopics = topics.filter(
    (topic) => !["sensor_msgs/msg/Image", "sensor_msgs/msg/CompressedImage"].includes(topic.schemaName),
  );
  const hints = FIELD_HINTS[topics.find((topic) => topic.topic === newTopic)?.schemaName ?? ""] ?? [];
  const duplicate = seriesList.some(
    (series) => seriesKey(series.topic, series.field) === seriesKey(newTopic, newField.trim()),
  );

  return (
    <CollapsiblePanel
      title={t("plotPanel")}
      onClose={onClose}
      embedded={embedded}
      header={
        <>
        <select value={newTopic} onChange={(event) => setNewTopic(event.target.value)}>
          <option value="">{t("chooseTopic")}</option>
          {plotTopics.map((topic) => (
            <option key={topic.topic} value={topic.topic}>{topic.topic}</option>
          ))}
        </select>
        <input
          className="field-input"
          placeholder={t("fieldPath")}
          value={newField}
          onChange={(event) => setNewField(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && addEntry({ topic: newTopic, field: newField })) setNewField("");
          }}
          list="field-hints"
        />
        <datalist id="field-hints">
          {hints.map((hint) => <option key={hint} value={hint} />)}
        </datalist>
        <button
          onClick={() => {
            if (addEntry({ topic: newTopic, field: newField })) setNewField("");
          }}
          disabled={!newTopic || !newField.trim() || duplicate}
        >
          {t("add")}
        </button>
        <button
          className="icon-action"
          onClick={() => {
            pausedRef.current = !pausedRef.current;
            setPaused(pausedRef.current);
          }}
          title={paused ? t("resume") : t("pause")}
          aria-label={paused ? t("resume") : t("pause")}
        >
          {paused ? <Play /> : <Pause />}
        </button>
        {isManualMode && (
          <button
            className="icon-action"
            onClick={resetToRealtime}
            title={t("reset")}
            aria-label={t("reset")}
            style={{ color: "var(--accent, #38bdf8)" }}
          >
            <RotateCcw />
          </button>
        )}
        {seriesList.length > 0 && (
          <button className="icon-action" onClick={clearSeries} title={t("clearAll")} aria-label={t("clearAll")}>
            <Trash2 />
          </button>
        )}
        </>
      }
    >
      {seriesList.length > 0 && (
        <div className="series-list">
          {seriesList.map((series) => (
            <div key={series.id} className={`series-row ${series.visible ? "" : "muted"}`}>
              <i style={{ background: series.color }} />
              <span className="series-name">{series.topic}.{series.field}</span>
              <span className={`series-value ${series.status}`}>
                {series.status === "ok" ? series.latest?.toPrecision(6) : series.status === "invalid" ? t("invalidField") : t("waitingData")}
              </span>
              <button onClick={() => toggleSeries(series.id)} title={series.visible ? t("hide") : t("show")} aria-label={series.visible ? t("hide") : t("show")}>
                {series.visible ? <Eye /> : <EyeOff />}
              </button>
              <button onClick={() => removeSeries(series.id)} title={t("delete")} aria-label={t("delete")}><Trash2 /></button>
            </div>
          ))}
        </div>
      )}
      <div ref={plotRef} className="panel-body plot-body" />
    </CollapsiblePanel>
  );
}

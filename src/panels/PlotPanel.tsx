/**
 * 曲线面板：uPlot + 环形缓冲。多话题字段对比（rqt_plot / Foxglove Plot 的核心用法）。
 * 字段用点路径表示，如 twist.twist.linear.x；时间轴用消息 header 时间戳（无则到达时间）。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

import type { WorkerBridge } from "../bridge/WorkerBridge";
import type { TopicInfo } from "../core/FoxgloveConnection";
import { toSec } from "../core/types";
import type { Time } from "../core/types";

const WINDOW_SEC = 60;
const MAX_POINTS = 3000;
/** 数据是内容：曲线可以有颜色（UI 骨架保持单色） */
const PALETTE = ["#4ea1ff", "#ffb347", "#5ad469", "#ff6b81", "#c792ea", "#6be7dd"];

interface Series {
  id: number;
  topic: string;
  field: string;
  ts: number[];
  vs: number[];
}

function getPath(obj: unknown, path: string): unknown {
  let cur = obj;
  for (const key of path.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

/** 常用消息类型的字段建议 */
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
}

export function PlotPanel({
  bridge,
  topics,
  theme = "dark",
  initialSeries,
  onSeriesChange,
  onClose,
}: {
  bridge: WorkerBridge;
  topics: TopicInfo[];
  theme?: "dark" | "light";
  /** 配置恢复：初始曲线列表 */
  initialSeries?: PlotSeriesConfig[];
  /** 配置保存：曲线列表变化时上报 */
  onSeriesChange?: (series: PlotSeriesConfig[]) => void;
  onClose: () => void;
}) {
  const plotRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot>(null);
  const seriesRef = useRef<Series[]>([]);
  const pausedRef = useRef(false);
  const unsubsRef = useRef(new Map<number, () => void>());
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const [seriesList, setSeriesList] = useState<Array<{ id: number; topic: string; field: string }>>(
    [],
  );
  const [newTopic, setNewTopic] = useState("");
  const [newField, setNewField] = useState("");
  const [paused, setPaused] = useState(false);
  const nextId = useRef(1);

  // 数值话题（有 raw payload 的都行，这里全列）
  const plotTopics = topics.filter(
    (t) => !["sensor_msgs/msg/Image", "sensor_msgs/msg/CompressedImage"].includes(t.schemaName),
  );

  const rebuild = useCallback(() => {
    uplotRef.current?.destroy();
    uplotRef.current = null;
    const el = plotRef.current;
    if (!el || seriesRef.current.length === 0) return;
    // 轴/网格是 chrome，跟随明暗主题（曲线是数据色，不变）
    const dark = themeRef.current === "dark";
    const axis = {
      stroke: dark ? "#888" : "#777",
      grid: { stroke: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" },
      ticks: { stroke: dark ? "#444" : "#bbb" },
    };
    const u = new uPlot(
      {
        width: el.clientWidth,
        height: el.clientHeight - 4,
        series: [
          {},
          ...seriesRef.current.map((s, i) => ({
            label: `${s.topic}.${s.field}`,
            stroke: PALETTE[i % PALETTE.length],
            width: 1.4,
            points: { show: false },
          })),
        ],
        axes: [axis, { ...axis }],
        legend: { show: true },
        cursor: { drag: { x: true, y: false } },
        scales: { x: { time: false } },
      },
      [[], ...seriesRef.current.map(() => [])] as uPlot.AlignedData,
      el,
    );
    uplotRef.current = u;
  }, []);

  // 10Hz 刷新图表（数据在 handler 里进环形缓冲）
  useEffect(() => {
    const timer = setInterval(() => {
      const u = uplotRef.current;
      const series = seriesRef.current;
      if (!u || series.length === 0 || pausedRef.current) return;
      // 合并时间轴：用第一条曲线的时间戳做 x（多曲线各自采样时间不同，
      // uPlot 需要对齐数据 → 每条曲线独立插入 null 会复杂化；
      // KISS：x 取全部时间戳的并集近似 —— 直接用逐条 setData 的多 x 不支持，
      // 用 join 简化：按各自序列绘制时以最长的为 x，短的尾部对齐）
      const joined = uPlot.join(
        series.map((s) => [s.ts, s.vs] as uPlot.AlignedData),
      ) as uPlot.AlignedData;
      u.setData(joined);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const ob = new ResizeObserver(() => {
      uplotRef.current?.setSize({ width: el.clientWidth, height: el.clientHeight - 4 });
    });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  const addEntry = useCallback(
    (topic: string, field: string) => {
      if (!topic || !field) return;
      const id = nextId.current++;
      const s: Series = { id, topic, field, ts: [], vs: [] };
      seriesRef.current = [...seriesRef.current, s];
      const unsub = bridge.subscribe(topic, (payload) => {
        if (payload.kind !== "raw") return;
        const msg = payload.message;
        const v = getPath(msg, s.field);
        if (typeof v !== "number" && typeof v !== "bigint") return;
        const header = getPath(msg, "header.stamp") as Time | undefined;
        const t = header ? toSec(header) : Date.now() / 1000;
        s.ts.push(t);
        s.vs.push(Number(v));
        // 时间窗 + 点数双限
        const cutoff = t - WINDOW_SEC;
        while (s.ts.length > MAX_POINTS || (s.ts.length > 0 && s.ts[0] < cutoff)) {
          s.ts.shift();
          s.vs.shift();
        }
      });
      unsubsRef.current.set(id, unsub);
      setSeriesList((prev) => [...prev, { id, topic, field }]);
      setTimeout(rebuild, 0);
    },
    [bridge, rebuild],
  );

  const addSeries = useCallback(() => {
    addEntry(newTopic, newField);
    setNewField("");
  }, [addEntry, newTopic, newField]);

  // 配置恢复：挂载时补上初始曲线
  useEffect(() => {
    for (const s of initialSeries ?? []) addEntry(s.topic, s.field);
    // 仅恢复一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 配置保存：曲线列表变化时上报
  useEffect(() => {
    onSeriesChange?.(seriesList.map(({ topic, field }) => ({ topic, field })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesList]);

  const removeSeries = useCallback(
    (id: number) => {
      unsubsRef.current.get(id)?.();
      unsubsRef.current.delete(id);
      seriesRef.current = seriesRef.current.filter((s) => s.id !== id);
      setSeriesList((prev) => prev.filter((s) => s.id !== id));
      setTimeout(rebuild, 0);
    },
    [rebuild],
  );

  // 主题变化重建图表（uPlot 轴色是构造参数，无法动态改）
  useEffect(() => {
    rebuild();
  }, [theme, rebuild]);

  useEffect(() => {
    const unsubs = unsubsRef.current;
    return () => {
      for (const unsub of unsubs.values()) unsub();
      unsubs.clear();
      uplotRef.current?.destroy();
    };
  }, []);

  const hints = FIELD_HINTS[topics.find((t) => t.topic === newTopic)?.schemaName ?? ""] ?? [];

  return (
    <div className="panel">
      <div className="panel-header">
        <select value={newTopic} onChange={(e) => setNewTopic(e.target.value)}>
          <option value="">话题…</option>
          {plotTopics.map((t) => (
            <option key={t.topic} value={t.topic}>
              {t.topic}
            </option>
          ))}
        </select>
        <input
          className="field-input"
          placeholder="字段路径，如 twist.twist.linear.x"
          value={newField}
          onChange={(e) => setNewField(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSeries()}
          list="field-hints"
        />
        <datalist id="field-hints">
          {hints.map((h) => (
            <option key={h} value={h} />
          ))}
        </datalist>
        <button onClick={addSeries}>添加</button>
        <button
          onClick={() => {
            pausedRef.current = !paused;
            setPaused(!paused);
          }}
        >
          {paused ? "继续" : "暂停"}
        </button>
        <span className="spacer" />
        <button className="panel-close" onClick={onClose}>
          ×
        </button>
      </div>
      {seriesList.length > 0 && (
        <div className="series-tags">
          {seriesList.map((s, i) => (
            <span key={s.id} className="series-tag" style={{ borderColor: PALETTE[i % PALETTE.length] }}>
              <i style={{ background: PALETTE[i % PALETTE.length] }} />
              {s.topic}.{s.field}
              <button onClick={() => removeSeries(s.id)}>×</button>
            </span>
          ))}
        </div>
      )}
      <div ref={plotRef} className="panel-body plot-body" />
    </div>
  );
}

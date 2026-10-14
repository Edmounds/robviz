import { useCallback, useEffect, useMemo, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

import type { PluginPageProps } from "../types";
import { ImagePanel } from "../../panels/ImagePanel";
import { getCompetitionStatus, type CompetitionStatus, runtimeRequest } from "./api";
import "./fruit-competition.css";

const ID = "fruit-competition";
const DEFAULT_CAMERA = "/fruit_perception/camera/annotated_image";
const CAMERAS = [
  ["annotated", "识别标注", "/fruit_perception/camera/annotated_image"],
  ["rgb", "原始 RGB", "/camera/color/image_raw"],
  ["depth", "深度", "/camera/depth/image_rect_raw"],
] as const;
const GROUPS = [
  ["perception", "感知"],
  ["arm", "机械臂"],
  ["navigation", "定位导航"],
  ["mission", "mission"],
] as const;

function phaseText(phase: string) {
  return (
    ({
      PREPARING: "准备中",
      PREPARED: "等待定位",
      LOCALIZING: "定位初始化",
      RUNNING: "比赛中",
      FINISHED: "已完成",
      ERROR: "异常",
      STOPPED: "已停止",
    } as Record<string, string>)[phase] ?? phase
  );
}

interface CompetitionLayout {
  main: Record<string, number>;
  left: Record<string, number>;
  right: Record<string, number>;
}

const DEFAULT_LAYOUT: CompetitionLayout = {
  main: { left: 42, right: 58 },
  left: { controls: 38, execStats: 62 },
  right: { camera: 68, health: 32 },
};

function layoutValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 100 ? value : fallback;
}

function mapPanelLayout(value: Record<string, number>, keys: string[], fallback: Record<string, number>): Record<string, number> {
  return Object.fromEntries(keys.map((key) => [key, layoutValue(value[key], fallback[key])]));
}

interface StoredCompetitionState {
  camera?: string;
  flow?: string;
  openLoop?: string;
  debug?: boolean;
  layout?: Partial<CompetitionLayout>;
}

export default function CompetitionPage({ ctx, isMobile }: PluginPageProps) {
  const base = ctx.getServiceUrl("runtime");
  const persist = ctx.onPluginStateChange;
  const stored = ctx.pluginStates[ID] as StoredCompetitionState | undefined;

  const [camera, setCamera] = useState(stored?.camera ?? DEFAULT_CAMERA);
  const [flow, setFlow] = useState(
    stored?.flow && ["full", "ac", "acb", "a", "b", "c"].includes(stored.flow) ? stored.flow : "full"
  );
  const [openLoop, setOpenLoop] = useState(stored?.openLoop ?? "A");
  const [debug, setDebug] = useState(stored?.debug ?? false);

  const [layout, setLayout] = useState<CompetitionLayout>(() => ({
    main: stored?.layout?.main ? mapPanelLayout(stored.layout.main, ["left", "right"], DEFAULT_LAYOUT.main) : DEFAULT_LAYOUT.main,
    left: stored?.layout?.left ? mapPanelLayout(stored.layout.left, ["controls", "execStats"], DEFAULT_LAYOUT.left) : DEFAULT_LAYOUT.left,
    right: stored?.layout?.right ? mapPanelLayout(stored.layout.right, ["camera", "health"], DEFAULT_LAYOUT.right) : DEFAULT_LAYOUT.right,
  }));

  const [status, setStatus] = useState<CompetitionStatus>({ phase: "STOPPED" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    persist(ID, { camera, flow, openLoop, debug, layout });
  }, [camera, debug, flow, layout, openLoop, persist]);

  const setLayoutValue = useCallback((groupKey: keyof CompetitionLayout, next: Record<string, number>) => {
    setLayout((prev) => {
      const updated = { ...prev, [groupKey]: next };
      persist(ID, { camera, flow, openLoop, debug, layout: updated });
      return updated;
    });
  }, [camera, debug, flow, openLoop, persist]);

  useEffect(() => {
    if (!ctx.active) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next = await getCompetitionStatus(base, controller.signal);
        if (controller.signal.aborted) return;
        setStatus(next);
        if (["PREPARING", "PREPARED", "LOCALIZING", "RUNNING"].includes(next.phase)) {
          if (typeof next.parameters?.flow === "string") setFlow(next.parameters.flow);
          if (typeof next.parameters?.open_loop === "string") setOpenLoop(next.parameters.open_loop);
          if (typeof next.parameters?.debug === "boolean") setDebug(next.parameters.debug);
        }
        setError("");
      } catch (reason) {
        if (!controller.signal.aborted) setError(String(reason));
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(poll, 1000);
      }
    };
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [base, ctx.active]);

  const call = async (path: string, body: unknown, timeout = 12_000) => {
    if (busy || !ctx.active) return;
    setBusy(true);
    setError("");
    try {
      await runtimeRequest(path, base, body, "POST", undefined, timeout);
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  };

  const running = ["PREPARING", "PREPARED", "LOCALIZING", "RUNNING"].includes(status.phase);
  const acb = flow === "acb";
  const params = useMemo(
    () => (acb ? { phase: "prepare", debug } : { phase: "prepare", flow, open_loop: openLoop, debug }),
    [acb, debug, flow, openLoop]
  );

  const statistics = (status.execution?.statistics ?? {}) as Record<string, unknown>;
  const totals = useMemo(() => {
    const list: Array<{ area: string; type: string; completed?: number; failed?: number; skipped?: number }> = [];
    if (!statistics || typeof statistics !== "object") return list;
    for (const [area, types] of Object.entries(statistics)) {
      if (!types || typeof types !== "object") continue;
      for (const [type, counts] of Object.entries(types as Record<string, unknown>)) {
        if (!counts || typeof counts !== "object") continue;
        const c = counts as { completed?: number; failed?: number; skipped?: number };
        list.push({ area, type, completed: c.completed, failed: c.failed, skipped: c.skipped });
      }
    }
    return list;
  }, [statistics]);

  const totalCompleted = totals.reduce((sum, item) => sum + (item.completed ?? 0), 0);
  const totalFailed = totals.reduce((sum, item) => sum + (item.failed ?? 0), 0);
  const totalSkipped = totals.reduce((sum, item) => sum + (item.skipped ?? 0), 0);

  const execution = status.execution ?? {};
  const events = useMemo(() => {
    const raw = execution.events;
    if (!Array.isArray(raw)) return [];
    return raw as Array<Record<string, unknown>>;
  }, [execution.events]);

  return (
    <div className="fruit-competition">
      <header className="fruit-competition-toolbar">
        <div className="toolbar-left">
          <strong className="competition-title">正式比赛</strong>
          <span className={`competition-phase phase-${status.phase.toLowerCase()}`}>
            {phaseText(status.phase)}
          </span>
          <span className="competition-live">
            {status.updated_at ? `更新 ${new Date(status.updated_at * 1000).toLocaleTimeString()}` : "等待状态"}
          </span>
        </div>
        <div className="toolbar-right">
          <button
            className="competition-kill"
            disabled={!ctx.active || busy}
            onClick={() => void call("scripts/kill", {}, 35_000)}
          >
            Kill
          </button>
        </div>
      </header>

      {error && <div className="competition-error" role="alert">{error}</div>}
      {status.error && <div className="competition-error" role="alert">{status.error}</div>}

      <div className="fruit-competition-main">
        <Group
          id="fruit-competition-root"
          className="fruit-competition-panels"
          orientation={isMobile ? "vertical" : "horizontal"}
          disabled={isMobile}
          defaultLayout={layout.main}
          resizeTargetMinimumSize={{ fine: 8, coarse: 20 }}
          onLayoutChanged={(value, meta) => {
            if (!meta.isUserInteraction) return;
            setLayoutValue("main", mapPanelLayout(value, ["left", "right"], layout.main));
          }}
        >
          {/* 左侧控制台：启动参数 + 执行状态与统计 */}
          <Panel id="left" minSize={25}>
            <Group
              id="fruit-competition-left"
              className="fruit-competition-column-group"
              orientation="vertical"
              disabled={isMobile}
              defaultLayout={layout.left}
              resizeTargetMinimumSize={{ fine: 8, coarse: 20 }}
              onLayoutChanged={(value, meta) => {
                if (!meta.isUserInteraction) return;
                setLayoutValue("left", mapPanelLayout(value, ["controls", "execStats"], layout.left));
              }}
            >
              {/* 启动参数 */}
              <Panel id="controls" minSize={22}>
                <section className="competition-card competition-controls">
                  <div className="competition-card-header">
                    <strong>启动参数</strong>
                    <span className="competition-badge muted">准备阶段锁定</span>
                  </div>
                  <div className="competition-controls-body">
                    <div className="competition-form-row">
                      <label>流程</label>
                      <select value={flow} disabled={running || busy} onChange={(e) => setFlow(e.target.value)}>
                        <option value="full">ABC</option>
                        <option value="acb">ACB</option>
                        {["ac", "a", "b", "c"].map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="competition-form-row">
                      <label>开环</label>
                      <select
                        value={acb ? "none" : openLoop}
                        disabled={acb || running || busy}
                        onChange={(e) => setOpenLoop(e.target.value)}
                      >
                        {["A", "C", "AC", "none"].map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="competition-check-row">
                      <label className="competition-check">
                        <input
                          type="checkbox"
                          checked={debug}
                          disabled={running || busy}
                          onChange={(e) => setDebug(e.target.checked)}
                        />
                        <span>debug 记录</span>
                      </label>
                    </div>
                    {acb && <div className="competition-flow-note">ACB 固定：A 去程开环，A 回程及 C 闭环。</div>}
                    <div className="competition-btn-group">
                      <button
                        className="btn-action btn-prepare"
                        disabled={!ctx.active || running || busy}
                        onClick={() =>
                          void call(`scripts/${acb ? "mission_acb" : "mission"}/start`, { parameters: params })
                        }
                      >
                        启动其他部分
                      </button>
                      <button
                        className="btn-action btn-localize"
                        disabled={!ctx.active || status.phase !== "PREPARED" || busy}
                        onClick={() => void call("competition/localize", {}, 5000)}
                      >
                        启动定位并进入比赛
                      </button>
                    </div>
                  </div>
                </section>
              </Panel>

              <Separator className="fruit-competition-separator horizontal" />

              {/* 当前执行状态 + 收获统计 */}
              <Panel id="execStats" minSize={30}>
                <section className="competition-card competition-exec-stats">
                  <div className="competition-card-header">
                    <strong>执行状态与统计</strong>
                    <span className="competition-badge highlight">
                      {String(execution.step ?? "等待就绪")}
                    </span>
                  </div>
                  <div className="competition-exec-body">
                    {/* 当前执行动作 */}
                    <div className="competition-current-banner">
                      <div className="current-item">
                        <span className="label">当前区域</span>
                        <span className="value">{String(execution.area ?? "-")}</span>
                      </div>
                      <div className="current-divider" />
                      <div className="current-item">
                        <span className="label">当前目标</span>
                        <span className="value">{String(execution.target ?? "-")}</span>
                      </div>
                    </div>

                    {/* 近期动作记录 */}
                    <div className="competition-sub-header">
                      <span>近期动作记录</span>
                    </div>
                    <div className="competition-event-list">
                      {events.length === 0 ? (
                        <div className="empty-events-hint">暂无执行事件</div>
                      ) : (
                        events
                          .slice(-10)
                          .reverse()
                          .map((event, index) => {
                            const outcome = String(event.outcome ?? "");
                            const isOk = outcome === "OK" || outcome === "COMPLETED";
                            const isFail = outcome === "FAILED" || outcome === "ERROR";
                            const outcomeClass = isOk ? "outcome-ok" : isFail ? "outcome-fail" : "outcome-skip";
                            return (
                              <div className="competition-event-row" key={`${String(event.at)}-${index}`}>
                                <span className={`event-badge ${outcomeClass}`}>{outcome || "-"}</span>
                                <span className="event-target">
                                  {String(event.area ?? "")} {String(event.target ?? "")}
                                </span>
                                {Boolean(event.reason) && <span className="event-reason">{String(event.reason)}</span>}
                              </div>
                            );
                          })
                      )}
                    </div>

                    {/* 收获统计数据 */}
                    <div className="competition-sub-header">
                      <span>收获统计</span>
                      <div className="stat-summary-pills">
                        <span className="stat-pill ok">{totalCompleted} 完成</span>
                        {totalFailed > 0 && <span className="stat-pill fail">{totalFailed} 失败</span>}
                        {totalSkipped > 0 && <span className="stat-pill skip">{totalSkipped} 跳过</span>}
                      </div>
                    </div>

                    <div className="competition-table-wrap">
                      <table className="competition-stat-table">
                        <thead>
                          <tr>
                            <th>区域</th>
                            <th>类别</th>
                            <th>完成</th>
                            <th>失败</th>
                            <th>跳过</th>
                          </tr>
                        </thead>
                        <tbody>
                          {totals.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="table-empty">
                                暂无工序统计
                              </td>
                            </tr>
                          ) : (
                            totals.map((item) => (
                              <tr key={`${item.area}-${item.type}`}>
                                <td>{item.area}</td>
                                <td>{item.type === "unknown" ? "未知" : item.type}</td>
                                <td className="num-ok">{item.completed ?? 0}</td>
                                <td className={item.failed ? "num-fail" : ""}>{item.failed ?? 0}</td>
                                <td className={item.skipped ? "num-skip" : ""}>{item.skipped ?? 0}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </Panel>
            </Group>
          </Panel>

          <Separator className="fruit-competition-separator vertical" />

          {/* 右侧大屏：摄像头监测 + 模块状态 */}
          <Panel id="right" minSize={30}>
            <Group
              id="fruit-competition-right"
              className="fruit-competition-column-group"
              orientation="vertical"
              disabled={isMobile}
              defaultLayout={layout.right}
              resizeTargetMinimumSize={{ fine: 8, coarse: 20 }}
              onLayoutChanged={(value, meta) => {
                if (!meta.isUserInteraction) return;
                setLayoutValue("right", mapPanelLayout(value, ["camera", "health"], layout.right));
              }}
            >
              {/* 摄像头监测 */}
              <Panel id="camera" minSize={30}>
                <section className="competition-card competition-camera-card">
                  <div className="competition-card-header">
                    <strong>摄像头监测</strong>
                    <div className="camera-header-actions">
                      <select
                        aria-label="摄像头画面"
                        className="camera-topic-select"
                        value={camera}
                        onChange={(e) => setCamera(e.target.value)}
                      >
                        {CAMERAS.map(([id, label, topic]) => (
                          <option value={topic} key={id}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="competition-camera-viewport">
                    <ImagePanel
                      bridge={ctx.bridge}
                      topics={ctx.topics}
                      fixedTopic={camera}
                      active={ctx.active}
                      mediaUrl={ctx.getServiceUrl("video")}
                      embedded
                      onClose={() => {}}
                    />
                  </div>
                </section>
              </Panel>

              <Separator className="fruit-competition-separator horizontal" />

              {/* 模块状态 */}
              <Panel id="health" minSize={18}>
                <section className="competition-card competition-health-card">
                  <div className="competition-card-header">
                    <strong>模块状态</strong>
                    <span className="competition-badge muted">仅监测，不阻塞流程</span>
                  </div>
                  <div className="competition-health-body">
                    <div className="competition-health-groups">
                      {GROUPS.map(([group, label]) => (
                        <div className="competition-health-group" key={group}>
                          <div className="health-group-title">{label}</div>
                          <div className="health-modules-list">
                            {(status.modules?.[group] ?? []).length === 0 ? (
                              <span className="health-empty">未启动或离线</span>
                            ) : (
                              (status.modules?.[group] ?? []).map((module) => (
                                <div className="competition-module-item" key={module.id} title={module.detail}>
                                  <span className={`health-dot health-${module.state.toLowerCase()}`} />
                                  <span className="module-label">{module.label}</span>
                                  <span className="module-detail">{module.detail}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {status.home && (
                      <div className={`competition-home-banner ${status.home.success ? "ok" : "bad"}`}>
                        <span className="home-title">Home 复位：</span>
                        <span>{status.home.success ? "成功就绪" : `异常 (${status.home.reason})`}</span>
                      </div>
                    )}
                  </div>
                </section>
              </Panel>
            </Group>
          </Panel>
        </Group>
      </div>
    </div>
  );
}

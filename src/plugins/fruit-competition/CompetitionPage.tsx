import { useEffect, useMemo, useState } from "react";

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
  ["perception", "感知"], ["arm", "机械臂"], ["navigation", "定位导航"], ["mission", "mission"],
] as const;

function phaseText(phase: string) {
  return ({ PREPARING: "准备中", PREPARED: "等待定位", LOCALIZING: "定位初始化", RUNNING: "比赛中",
    FINISHED: "已完成", ERROR: "异常", STOPPED: "已停止" } as Record<string, string>)[phase] ?? phase;
}

export default function CompetitionPage({ ctx, isMobile }: PluginPageProps) {
  const base = ctx.getServiceUrl("runtime");
  const persist = ctx.onPluginStateChange;
  const stored = ctx.pluginStates[ID] as { camera?: string; flow?: string } | undefined;
  const [camera, setCamera] = useState(stored?.camera ?? DEFAULT_CAMERA);
  const [flow, setFlow] = useState(stored?.flow && ["full", "ac", "acb", "a", "b", "c"].includes(stored.flow) ? stored.flow : "full");
  const [status, setStatus] = useState<CompetitionStatus>({ phase: "STOPPED" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    persist(ID, { camera, flow });
  }, [camera, flow, persist]);

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
    return () => { controller.abort(); clearTimeout(timer); };
  }, [base, ctx.active]);

  const call = async (path: string, body: unknown, timeout = 12_000) => {
    if (busy || !ctx.active) return;
    setBusy(true); setError("");
    try {
      await runtimeRequest(path, base, body, "POST", undefined, timeout);
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  };

  const [openLoop, setOpenLoop] = useState("A");
  const [debug, setDebug] = useState(false);
  const running = ["PREPARING", "PREPARED", "LOCALIZING", "RUNNING"].includes(status.phase);
  const acb = flow === "acb";
  const params = useMemo(() => acb ? { phase: "prepare", debug }
    : { phase: "prepare", flow, open_loop: openLoop, debug }, [acb, debug, flow, openLoop]);
  const statistics = (status.execution?.statistics ?? {}) as Record<string, Record<string, Record<string, number>>>;
  const totals = Object.entries(statistics).flatMap(([area, types]) =>
    Object.entries(types).map(([type, counts]) => ({ area, type, ...(counts as { completed?: number; failed?: number; skipped?: number }) })));
  const execution = status.execution ?? {};

  return <div className="fruit-competition">
    <header className="fruit-competition-toolbar">
      <strong>正式比赛</strong>
      <span className={`competition-phase phase-${status.phase.toLowerCase()}`}>{phaseText(status.phase)}</span>
      <span className="competition-live">{status.updated_at ? `更新 ${new Date(status.updated_at * 1000).toLocaleTimeString()}` : "等待状态"}</span>
      <button className="competition-kill" disabled={!ctx.active || busy} onClick={() => void call("scripts/kill", {}, 35_000)}>Kill</button>
    </header>
    {error && <div className="competition-error" role="alert">{error}</div>}
    {status.error && <div className="competition-error" role="alert">{status.error}</div>}
    <div className={`competition-grid ${isMobile ? "mobile" : ""}`}>
      <section className="competition-camera">
        <div className="competition-section-head"><strong>摄像头监测</strong><select aria-label="摄像头画面" value={camera} onChange={(e) => setCamera(e.target.value)}>
          {CAMERAS.map(([id, label, topic]) => <option value={topic} key={id}>{label}</option>)}
        </select></div>
        <ImagePanel bridge={ctx.bridge} topics={ctx.topics} fixedTopic={camera} active={ctx.active}
          mediaUrl={ctx.getServiceUrl("video")} embedded onClose={() => {}} />
      </section>
      <section className="competition-controls">
        <div className="competition-section-head"><strong>启动参数</strong><span>准备阶段锁定</span></div>
        <label>流程<select value={flow} disabled={running || busy} onChange={(e) => setFlow(e.target.value)}>
          <option value="full">ABC</option><option value="acb">ACB</option>
          {['ac', 'a', 'b', 'c'].map((item) => <option key={item} value={item}>{item}</option>)}
        </select></label>
        <label>开环<select value={acb ? "none" : openLoop} disabled={acb || running || busy} onChange={(e) => setOpenLoop(e.target.value)}>
          {['A', 'C', 'AC', 'none'].map((item) => <option key={item}>{item}</option>)}
        </select></label>
        <label className="competition-check"><input type="checkbox" checked={debug} disabled={running || busy} onChange={(e) => setDebug(e.target.checked)} /> debug 记录</label>
        {acb && <small>ACB 固定：A 去程开环，A 回程及 C 闭环。</small>}
        <button disabled={!ctx.active || running || busy} onClick={() => void call(`scripts/${acb ? "mission_acb" : "mission"}/start`, { parameters: params })}>启动其他部分</button>
        <button disabled={!ctx.active || status.phase !== "PREPARED" || busy} onClick={() => void call("competition/localize", {}, 5000)}>启动定位并进入比赛</button>
        <small>定位阶段等待 Point-LIO 初始化，每次最多 10 秒，失败后自动重启一次。</small>
      </section>
      <section className="competition-health">
        <div className="competition-section-head"><strong>模块状态</strong><span>仅监测，不阻塞流程</span></div>
        {GROUPS.map(([group, label]) => <details open key={group}><summary>{label}</summary>
          {(status.modules?.[group] ?? []).map((module) => <div className="competition-module" key={module.id}>
            <span className={`health-dot health-${module.state.toLowerCase()}`} />
            <span>{module.label}</span><small>{module.detail}</small>
          </div>)}
        </details>)}
        {status.home && <div className={`competition-home ${status.home.success ? "ok" : "bad"}`}>Home：{status.home.success ? "成功" : `异常：${status.home.reason}`}</div>}
      </section>
      <section className="competition-execution">
        <div className="competition-section-head"><strong>当前执行状态</strong><span>{String(execution.step ?? "-")}</span></div>
        <div className="competition-current"><b>{String(execution.area ?? "-")}</b><span>{String(execution.target ?? "-")}</span></div>
        <div className="competition-event-list">{((execution.events ?? []) as Array<Record<string, unknown>>).slice(-8).reverse().map((event, index) =>
          <div key={`${String(event.at)}-${index}`}><b>{String(event.outcome)}</b><span>{String(event.area)} {String(event.target)}</span><small>{String(event.reason)}</small></div>)}</div>
      </section>
      <section className="competition-statistics">
        <div className="competition-section-head"><strong>收获统计</strong><span>按 type 分类</span></div>
        <div className="competition-stat-total">{totals.reduce((sum, item) => sum + (item.completed ?? 0), 0)} <small>个工序完成</small></div>
        <table><thead><tr><th>区域</th><th>type</th><th>完成</th><th>失败</th><th>跳过</th></tr></thead><tbody>
          {totals.map((item) => <tr key={`${item.area}-${item.type}`}><td>{item.area}</td><td>{item.type === "unknown" ? "未知" : item.type}</td><td>{item.completed ?? 0}</td><td>{item.failed ?? 0}</td><td>{item.skipped ?? 0}</td></tr>)}
        </tbody></table>
      </section>
    </div>
  </div>;
}

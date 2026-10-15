import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

import type { PluginPageProps } from "../types";
import { ImagePanel } from "../../panels/ImagePanel";
import { getCompetitionStatus, type CompetitionStatus, runtimeRequest } from "./api";
import { logSchema } from "../fruit-scripts/api";
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
  main: { left: 40, right: 60 },
  left: { controls: 45, health: 55 },
  right: { camera: 58, logs: 42 },
};

function layoutValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 100 ? value : fallback;
}

function mapPanelLayout(
  value: Record<string, number> | undefined,
  keys: string[],
  fallback: Record<string, number>
): Record<string, number> {
  if (!value) return fallback;
  const hasAllKeys = keys.every(
    (key) => typeof value[key] === "number" && Number.isFinite(value[key]) && value[key] > 0
  );
  if (!hasAllKeys) return fallback;
  return Object.fromEntries(keys.map((key) => [key, layoutValue(value[key], fallback[key])]));
}

interface StoredCompetitionState {
  camera?: string;
  flow?: string;
  openLoop?: string;
  debug?: boolean;
  layout?: Partial<CompetitionLayout>;
}

export default function CompetitionPage({ ctx, isMobile, fontScale }: PluginPageProps) {
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
    left: stored?.layout?.left ? mapPanelLayout(stored.layout.left, ["controls", "health"], DEFAULT_LAYOUT.left) : DEFAULT_LAYOUT.left,
    right: stored?.layout?.right ? mapPanelLayout(stored.layout.right, ["camera", "logs"], DEFAULT_LAYOUT.right) : DEFAULT_LAYOUT.right,
  }));

  const [status, setStatus] = useState<CompetitionStatus>({ phase: "STOPPED" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const logElement = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fit = useRef<FitAddon | null>(null);
  const cursor = useRef({ script_id: "", run_id: "", cursor: 0 });
  const initial = useRef({ theme: ctx.theme, fontScale });

  const targetScript = flow === "acb" ? "mission_acb" : "mission";

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

  // Terminal lifecycle
  useEffect(() => {
    const term = new Terminal({
      disableStdin: true,
      convertEol: true,
      scrollback: 5000,
      cursorBlink: false,
      fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
      fontSize: Math.max(9, Math.round(12 * initial.current.fontScale)),
      theme:
        initial.current.theme === "dark"
          ? { background: "#000000", foreground: "#f5f5f5" }
          : { background: "#ffffff", foreground: "#0a0a0a" },
    });
    const addon = new FitAddon();
    term.loadAddon(addon);
    if (logElement.current) term.open(logElement.current);
    terminal.current = term;
    fit.current = addon;
    const observer = new ResizeObserver(() => {
      if (logElement.current && logElement.current.clientWidth > 0 && logElement.current.clientHeight > 0) {
        addon.fit();
      }
    });
    if (logElement.current) observer.observe(logElement.current);
    return () => {
      observer.disconnect();
      term.dispose();
      terminal.current = null;
      fit.current = null;
    };
  }, []);

  // Sync theme & font scale
  useEffect(() => {
    if (!terminal.current) return;
    terminal.current.options.theme =
      ctx.theme === "dark"
        ? { background: "#000000", foreground: "#f5f5f5" }
        : { background: "#ffffff", foreground: "#0a0a0a" };
    terminal.current.options.fontSize = Math.max(9, Math.round(12 * fontScale));
    if (ctx.active) fit.current?.fit();
  }, [ctx.theme, ctx.active, fontScale]);

  // Reset cursor & terminal when bound script target changes
  useEffect(() => {
    cursor.current = { script_id: targetScript, run_id: "", cursor: 0 };
    terminal.current?.reset();
  }, [targetScript]);

  // Poll competition status & script logs
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
      }

      try {
        const requested = cursor.current;
        if (requested.script_id) {
          const query = new URLSearchParams({
            script_id: requested.script_id,
            cursor: String(requested.cursor),
            run_id: requested.run_id,
          });
          const reply = logSchema.parse(
            await runtimeRequest(`scripts/log?${query}`, base, undefined, "GET", controller.signal)
          );
          if (!controller.signal.aborted && cursor.current === requested) {
            if (reply.reset) terminal.current?.reset();
            if (reply.data) terminal.current?.write(reply.data);
            cursor.current = {
              script_id: requested.script_id,
              run_id: reply.run_id,
              cursor: reply.cursor,
            };
          }
        }
      } catch {
        // Ignore log fetch error silently during polling
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(poll, 600);
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

  const handleKill = async () => {
    terminal.current?.write("\r\n\x1b[33m[Kill] 发起进程清理...\x1b[0m\r\n");
    await call("scripts/kill", {}, 35_000);
  };

  const running = ["PREPARING", "PREPARED", "LOCALIZING", "RUNNING"].includes(status.phase);
  const acb = flow === "acb";
  const params = useMemo(
    () => (acb ? { phase: "prepare", debug } : { phase: "prepare", flow, open_loop: openLoop, debug }),
    [acb, debug, flow, openLoop]
  );

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
            onClick={() => void handleKill()}
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
          {/* 左侧控制台：启动参数 + 模块状态 */}
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
                setLayoutValue("left", mapPanelLayout(value, ["controls", "health"], layout.left));
              }}
            >
              {/* 启动参数 */}
              <Panel id="controls" minSize={25}>
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

              {/* 模块状态 */}
              <Panel id="health" minSize={25}>
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

          <Separator className="fruit-competition-separator vertical" />

          {/* 右侧大屏：摄像头监测 + 比赛日志 */}
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
                setLayoutValue("right", mapPanelLayout(value, ["camera", "logs"], layout.right));
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

              {/* 比赛日志 */}
              <Panel id="logs" minSize={20}>
                <section className="competition-card competition-log-card">
                  <div className="competition-card-header">
                    <strong>比赛日志</strong>
                    <button
                      className="competition-log-clear-btn"
                      onClick={() => terminal.current?.clear()}
                    >
                      清屏
                    </button>
                  </div>
                  <div className="competition-terminal-wrap" ref={logElement} />
                </section>
              </Panel>
            </Group>
          </Panel>
        </Group>
      </div>
    </div>
  );
}

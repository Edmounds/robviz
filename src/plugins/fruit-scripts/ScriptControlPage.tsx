import { useCallback, useEffect, useRef, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

import type { PluginPageProps } from "../types";
import { actionSchema, logSchema, runtimeRequest, scriptArguments, scriptsSchema, storedSchema } from "./api";
import type { RunStatus, Script, Values } from "./api";
import { getCompetitionStatus } from "../fruit-competition/api";
import "./fruit-scripts.css";

const ID = "fruit-scripts";
const ORDER = ["mission", "mission_acb", "teleop", "waypoint_recording", "camera_arm_target", "perception", "voice_test", "qr_test"];
const DEFAULT_LAYOUT = { controls: 38, logs: 62 };

export default function ScriptControlPage({ ctx, isMobile, fontScale }: PluginPageProps) {
  const en = ctx.locale === "en";
  const tr = (cn: string, english: string) => en ? english : cn;
  const base = ctx.getServiceUrl("runtime");
  const [scripts, setScripts] = useState<Script[]>([]);
  const [runs, setRuns] = useState<Record<string, RunStatus>>({});
  const [stopping, setStopping] = useState<Record<string, boolean>>({});
  const [operation, setOperation] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, Values>>({});
  const [layout, setLayout] = useState<Record<string, number>>(DEFAULT_LAYOUT);
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [competitionPhase, setCompetitionPhase] = useState("");

  const logElement = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fit = useRef<FitAddon | null>(null);
  const cursor = useRef({ script_id: "", run_id: "", cursor: 0 });
  const tabsInitialized = useRef(false);
  const action = useRef<AbortController | null>(null);
  const identity = useRef(0);
  const initial = useRef({ theme: ctx.theme, fontScale });

  const cancelAction = useCallback(() => {
    identity.current++;
    action.current?.abort();
    action.current = null;
  }, []);

  useEffect(() => {
    const term = new Terminal({
      disableStdin: true, convertEol: true, scrollback: 5000, cursorBlink: false,
      fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
      fontSize: Math.max(9, Math.round(12 * initial.current.fontScale)),
      theme: initial.current.theme === "dark"
        ? { background: "#000000", foreground: "#f5f5f5" }
        : { background: "#ffffff", foreground: "#0a0a0a" },
    });
    const addon = new FitAddon();
    term.loadAddon(addon);
    term.open(logElement.current!);
    terminal.current = term;
    fit.current = addon;
    const observer = new ResizeObserver(() => {
      if (logElement.current && logElement.current.clientWidth > 0 && logElement.current.clientHeight > 0) addon.fit();
    });
    observer.observe(logElement.current!);
    return () => { observer.disconnect(); term.dispose(); terminal.current = null; fit.current = null; };
  }, []);

  useEffect(() => {
    if (!terminal.current) return;
    terminal.current.options.theme = ctx.theme === "dark"
      ? { background: "#000000", foreground: "#f5f5f5" }
      : { background: "#ffffff", foreground: "#0a0a0a" };
    terminal.current.options.fontSize = Math.max(9, Math.round(12 * fontScale));
    if (ctx.active) fit.current?.fit();
  }, [ctx.theme, ctx.active, fontScale]);

  useEffect(() => {
    const stored = storedSchema.safeParse(ctx.pluginStates[ID]);
    setValues(stored.success ? stored.data.values : {});
    setLayout(stored.success && stored.data.layout.controls && stored.data.layout.logs ? stored.data.layout : DEFAULT_LAYOUT);
    setRuns({}); setScripts([]); setBusy(false); setAvailable(false); setError(""); setConnectionError("");
    setStopping({});
    setCompetitionPhase("");
    setActiveTab(null); setOpenTabs([]);
    tabsInitialized.current = false;
    cursor.current = { script_id: "", run_id: "", cursor: 0 };
    terminal.current?.reset();
    identity.current++;
    return cancelAction;
    // Reset only when the runtime session changes, not when persisted plugin state updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.bridge, base, cancelAction]);

  const switchTab = useCallback((tabId: string) => {
    setActiveTab(tabId);
    cursor.current = { script_id: tabId, run_id: "", cursor: 0 };
    terminal.current?.reset();
  }, []);

  useEffect(() => {
    if (!ctx.active) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const status = scriptsSchema.parse(await runtimeRequest("scripts", base, undefined, "GET", controller.signal));
        if (controller.signal.aborted) return;
        setScripts(status.scripts.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id)));
        setRuns(status.runs);
        setOperation(status.operation);
        setAvailable(true);
        setConnectionError("");
        if (!tabsInitialized.current) {
          tabsInitialized.current = true;
          const activeRuns = Object.keys(status.runs);
          if (activeRuns.length > 0) {
            setOpenTabs(activeRuns);
            switchTab(status.current?.id ?? activeRuns[0]);
          }
        } else {
          setOpenTabs((prev) => {
            const added = Object.keys(status.runs).filter((id) => status.runs[id].state === "RUNNING" && !prev.includes(id));
            return added.length ? [...prev, ...added] : prev;
          });
        }
        try {
          const competition = await getCompetitionStatus(base, controller.signal);
          if (controller.signal.aborted) return;
          setCompetitionPhase(competition.phase ?? "");
          if (["PREPARING", "PREPARED", "LOCALIZING", "RUNNING"].includes(competition.phase ?? "") && competition.parameters) {
            const scriptId = competition.parameters.flow === "acb" ? "mission_acb" : "mission";
            setValues((previous) => ({ ...previous, [scriptId]: {
              ...previous[scriptId], ...competition.parameters,
            }}));
          }
        } catch {
          setCompetitionPhase("");
        }

        const requested = cursor.current;
        if (requested.script_id) {
          const query = new URLSearchParams({
            script_id: requested.script_id,
            cursor: String(requested.cursor),
            run_id: requested.run_id,
          });
          const reply = logSchema.parse(await runtimeRequest(`scripts/log?${query}`, base, undefined, "GET", controller.signal));
          // Switching tabs replaces the cursor, including A -> B -> A switches.
          if (controller.signal.aborted || cursor.current !== requested) return;
          setOperation(reply.operation);
          if (reply.reset) terminal.current?.reset();
          if (reply.data) terminal.current?.write(reply.data);
          cursor.current = {
            script_id: requested.script_id,
            run_id: reply.run_id,
            cursor: reply.cursor,
          };
        }
      } catch (reason) {
        if (!controller.signal.aborted) { setAvailable(false); setConnectionError(String(reason)); }
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(poll, 500);
      }
    };
    void poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [base, ctx.bridge, ctx.active, switchTab]);

  const persist = (nextValues: Record<string, Values>, nextLayout = layout) => {
    ctx.onPluginStateChange(ID, { values: nextValues, layout: nextLayout });
  };
  const changeValue = (script: Script, name: string, value: string | boolean) => {
    const next = { ...values, [script.id]: { ...values[script.id], [name]: value } };
    if (value === "") delete next[script.id][name];
    setValues(next); persist(next);
  };

  const selectScriptCard = (scriptId: string) => {
    setOpenTabs((prev) => prev.includes(scriptId) ? prev : [...prev, scriptId]);
    switchTab(scriptId);
  };

  const closeTab = (tabId: string) => {
    const nextTabs = openTabs.filter((id) => id !== tabId);
    setOpenTabs(nextTabs);
    if (activeTab === tabId) {
      if (nextTabs.length > 0) {
        switchTab(nextTabs[nextTabs.length - 1]);
      } else {
        setActiveTab(null);
        cursor.current = { script_id: "", run_id: "", cursor: 0 };
        terminal.current?.reset();
      }
    }
  };

  const startScript = async (script: Script) => {
    if (action.current || !ctx.active) return;
    const controller = new AbortController();
    action.current = controller;
    const generation = identity.current;
    setBusy(true); setError("");
    try {
      const selected: Values = {};
      scriptArguments(script, values[script.id] ?? {});
      for (const [name, definition] of Object.entries(script.parameters)) {
        const value = values[script.id]?.[name];
        if (definition.choices ? typeof value === "string" && definition.choices.includes(value) : typeof value === "boolean") {
          selected[name] = value;
        }
      }
      const localize = (script.id === "mission" || script.id === "mission_acb") && selected.phase === "localize";
      const path = localize ? "competition/localize" : `scripts/${encodeURIComponent(script.id)}/start`;
      if (localize) {
        await runtimeRequest(path, base, {}, "POST", controller.signal, 5_000);
      } else {
        const reply = actionSchema.parse(await runtimeRequest(path, base, { parameters: selected }, "POST", controller.signal, 10_000));
        if (identity.current === generation && reply.run) {
          setRuns((prev) => ({ ...prev, [script.id]: reply.run! }));
          selectScriptCard(script.id);
        }
      }
    } catch (reason) {
      if (identity.current === generation && !controller.signal.aborted) setError(String(reason));
    } finally {
      if (action.current === controller) action.current = null;
      if (identity.current === generation) setBusy(false);
    }
  };

  const stopScript = async (script: Script) => {
    if (action.current || !ctx.active) return;
    const controller = new AbortController();
    action.current = controller;
    const generation = identity.current;
    setStopping((prev) => ({ ...prev, [script.id]: true }));
    setError("");
    try {
      const path = `scripts/${encodeURIComponent(script.id)}/stop`;
      const reply = actionSchema.parse(await runtimeRequest(path, base, {}, "POST", controller.signal, 12_000));
      if (identity.current === generation && reply.run) {
        setRuns((prev) => ({ ...prev, [script.id]: reply.run! }));
      }
    } catch (reason) {
      if (identity.current === generation && !controller.signal.aborted) setError(String(reason));
    } finally {
      if (action.current === controller) action.current = null;
      if (identity.current === generation) {
        setStopping((prev) => ({ ...prev, [script.id]: false }));
      }
    }
  };

  const killAll = async () => {
    if (action.current || !ctx.active) return;
    const controller = new AbortController();
    action.current = controller;
    const generation = identity.current;
    setBusy(true); setError("");
    try {
      const reply = actionSchema.parse(await runtimeRequest("scripts/kill", base, {}, "POST", controller.signal, 35_000));
      if (identity.current === generation) {
        selectScriptCard("kill");
        if (reply.current) {
          setRuns((prev) => ({ ...prev, kill: reply.current! }));
        }
      }
    } catch (reason) {
      if (identity.current === generation && !controller.signal.aborted) setError(String(reason));
    } finally {
      if (action.current === controller) action.current = null;
      if (identity.current === generation) setBusy(false);
    }
  };

  const getScriptName = (tabId: string) => {
    if (tabId === "kill") return "kill_fruit_processes.sh";
    return scripts.find((s) => s.id === tabId)?.script ?? tabId;
  };

  const activeRun = activeTab ? runs[activeTab] : null;
  const activeRunning = activeRun?.state === "RUNNING";
  const disabled = busy || !!operation || !available || !ctx.active;

  return <div className="fruit-scripts">
    <header className="fruit-scripts-toolbar">
      <button className="fruit-scripts-kill" disabled={disabled} onClick={() => void killAll()}>Kill</button>
      <strong>{tr("脚本控制", "Script control")}</strong>
      <span>{tr("停止进程，非硬件急停。", "Process cleanup, not hardware ESTOP.")}</span>
      <span role="status">{operation === "KILLING" ? tr("正在清理…", "Cleaning up…") : busy || operation === "STARTING" ? tr("正在启动…", "Starting…") : available ? tr("运行服务在线", "Runtime online") : tr("运行服务离线", "Runtime offline")}</span>
      {competitionPhase && <span>{tr(`比赛：${competitionPhase}`, `Competition: ${competitionPhase}`)}</span>}
    </header>
    {(error || connectionError) && <div className="fruit-scripts-error" role="alert">{error || connectionError}</div>}
    <Group id="fruit-scripts-main" className="fruit-scripts-main" orientation={isMobile ? "vertical" : "horizontal"}
      defaultLayout={layout} resizeTargetMinimumSize={{ fine: 8, coarse: 20 }} onLayoutChanged={(next, meta) => {
        if (!meta.isUserInteraction) return;
        setLayout(next); persist(values, next);
      }}>
      <Panel id="controls" minSize={isMobile ? "160px" : "280px"}>
        <section className="fruit-scripts-controls" aria-label={tr("启动脚本", "Start scripts")}>
          {scripts.map((script) => {
            let args: string[] = [];
            let valid = true;
            try { args = scriptArguments(script, values[script.id] ?? {}); } catch { valid = false; }
            const run = runs[script.id];
            const isRunning = run?.state === "RUNNING";
            const isStopping = !!stopping[script.id];
            const isSelected = activeTab === script.id;

            let badgeText = tr("未运行", "Idle");
            if (isStopping) badgeText = tr("正在停止…", "Stopping…");
            else if (isRunning) badgeText = `${tr("运行中", "Running")} (PID ${run.pid ?? "?"})`;
            else if (run?.state === "EXITED") badgeText = `${tr("已退出", "Exited")} (${run.exit_code ?? "?"})`;

            return <article
              className={`fruit-scripts-card ${isRunning ? "running" : ""} ${isSelected ? "selected" : ""}`}
              key={script.id}
              onClick={() => selectScriptCard(script.id)}>
              <header>
                <strong>{script.script}</strong>
                <span className={`fruit-scripts-badge ${isStopping ? "stopping" : ""}`}>
                  {badgeText}
                </span>
              </header>
              <div className="fruit-scripts-parameters" onClick={(e) => e.stopPropagation()}>
                {Object.entries(script.parameters).map(([name, definition]) => {
                  const value = values[script.id]?.[name];
                  return <label key={name}>
                    <span>{definition.flag || name}{definition.required ? " *" : ""}</span>
                    {definition.choices ? <select disabled={busy || isRunning || isStopping} required={definition.required} value={typeof value === "string" && definition.choices.includes(value) ? value : ""}
                      onChange={(event) => changeValue(script, name, event.target.value)}>
                      <option value="">{definition.required ? tr("请选择", "Select") : `${tr("默认", "Default")}: ${definition.default}`}</option>
                      {definition.choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
                    </select> : <span className="fruit-scripts-boolean"><input type="checkbox" disabled={busy || isRunning || isStopping} checked={value === true}
                      onChange={(event) => changeValue(script, name, event.target.checked)} />{tr("启用（默认关闭）", "Enable (default off)")}</span>}
                  </label>;
                })}
              </div>
              {!Object.keys(script.parameters).length && <small>{tr("无参数", "No parameters")}</small>}
              {script.note && <small>{script.note}</small>}
              <code className="fruit-scripts-preview">./{script.script}{valid ? ` ${args.join(" ")}` : tr(" [先选择必填参数]", " [select required parameters]")}</code>
              <div className="fruit-scripts-card-actions">
                <button
                  className="fruit-scripts-btn-start"
                  disabled={disabled || !valid || isRunning || isStopping}
                  onClick={(e) => { e.stopPropagation(); void startScript(script); }}>
                  {tr("启动", "Start")}
                </button>
                <button
                  className="fruit-scripts-btn-stop"
                  disabled={disabled || !isRunning || isStopping}
                  onClick={(e) => { e.stopPropagation(); void stopScript(script); }}>
                  {isStopping ? tr("停止中…", "Stopping…") : tr("停止", "Stop")}
                </button>
              </div>
            </article>;
          })}
        </section>
      </Panel>
      <Separator className={`fruit-scripts-separator ${isMobile ? "horizontal" : "vertical"}`} />
      <Panel id="logs" minSize={isMobile ? "160px" : "240px"}>
        <section className="fruit-scripts-log" aria-label={tr("当前脚本日志", "Current script log")}>
          <div className="fruit-scripts-tabs">
            {openTabs.length === 0 ? (
              <span className="fruit-scripts-tabs-empty">{tr("点击左侧卡片或启动脚本以查看日志", "Select card or start script to view log")}</span>
            ) : (
              openTabs.map((tabId) => {
                const tabRun = runs[tabId];
                const isTabRunning = tabRun?.state === "RUNNING";
                const isTabActive = activeTab === tabId;
                return <button
                  key={tabId}
                  className={`fruit-scripts-tab ${isTabActive ? "active" : ""} ${isTabRunning ? "running" : ""}`}
                  onClick={() => switchTab(tabId)}>
                  {isTabRunning && <span className="fruit-scripts-tab-dot" />}
                  <span>{getScriptName(tabId)}</span>
                  {!isTabRunning && (
                    <span
                      className="fruit-scripts-tab-close"
                      title={tr("关闭标签", "Close tab")}
                      onClick={(e) => { e.stopPropagation(); closeTab(tabId); }}>
                      ×
                    </span>
                  )}
                </button>;
              })
            )}
          </div>
          <header>
            <strong>{tr("当前日志", "Current log")}</strong>
            <code>{activeTab ? getScriptName(activeTab) : tr("尚未选择", "None selected")}</code>
            <span>{activeRun ? activeRunning ? `PID ${activeRun.pid}` : `${tr("退出码", "Exit code")} ${activeRun.exit_code ?? "?"}` : ""}</span>
            <button onClick={() => terminal.current?.clear()}>{tr("清屏", "Clear screen")}</button>
          </header>
          <div className="fruit-scripts-terminal" ref={logElement} />
        </section>
      </Panel>
    </Group>
  </div>;
}

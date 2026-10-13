import { useCallback, useEffect, useRef, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

import type { PluginPageProps } from "../types";
import { actionSchema, logSchema, runtimeRequest, scriptArguments, scriptsSchema, storedSchema } from "./api";
import type { Current, Script, Values } from "./api";
import "./fruit-scripts.css";

const ID = "fruit-scripts";
const ORDER = ["mission", "teleop", "waypoint_recording", "camera_arm_target", "perception", "voice_test", "qr_test"];
const DEFAULT_LAYOUT = { controls: 38, logs: 62 };

export default function ScriptControlPage({ ctx, isMobile, fontScale }: PluginPageProps) {
  const en = ctx.locale === "en";
  const tr = (cn: string, english: string) => en ? english : cn;
  const base = ctx.getServiceUrl("runtime");
  const [scripts, setScripts] = useState<Script[]>([]);
  const [current, setCurrent] = useState<Current>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, Values>>({});
  const [layout, setLayout] = useState<Record<string, number>>(DEFAULT_LAYOUT);
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const logElement = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fit = useRef<FitAddon | null>(null);
  const cursor = useRef({ run_id: "", cursor: 0 });
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
    setCurrent(null); setScripts([]); setBusy(false); setAvailable(false); setError(""); setConnectionError("");
    cursor.current = { run_id: "", cursor: 0 };
    terminal.current?.reset();
    identity.current++;
    return cancelAction;
    // Restore only on machine changes, not each plugin-state update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.bridge, base, cancelAction]);

  useEffect(() => {
    if (!ctx.active) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let loaded = false;
    const poll = async () => {
      try {
        if (!loaded) {
          const reply = scriptsSchema.parse(await runtimeRequest("scripts", base, undefined, "GET", controller.signal));
          if (controller.signal.aborted) return;
          setScripts(reply.scripts.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id)));
          loaded = true;
        }
        const query = new URLSearchParams({ cursor: String(cursor.current.cursor), run_id: cursor.current.run_id });
        const reply = logSchema.parse(await runtimeRequest(`scripts/log?${query}`, base, undefined, "GET", controller.signal));
        if (controller.signal.aborted) return;
        setCurrent(reply.current); setOperation(reply.operation); setAvailable(true); setConnectionError("");
        if (reply.reset) terminal.current?.reset();
        if (reply.data) terminal.current?.write(reply.data);
        cursor.current = { run_id: reply.run_id, cursor: reply.cursor };
      } catch (reason) {
        if (!controller.signal.aborted) { setAvailable(false); setConnectionError(String(reason)); }
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(poll, 500);
      }
    };
    void poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [base, ctx.active]);

  const persist = (nextValues: Record<string, Values>, nextLayout = layout) => {
    ctx.onPluginStateChange(ID, { values: nextValues, layout: nextLayout });
  };
  const changeValue = (script: Script, name: string, value: string | boolean) => {
    const next = { ...values, [script.id]: { ...values[script.id], [name]: value } };
    if (value === "") delete next[script.id][name];
    setValues(next); persist(next);
  };

  const perform = async (script?: Script) => {
    if (action.current || !ctx.active) return;
    const controller = new AbortController();
    action.current = controller;
    const generation = identity.current;
    setBusy(true); setError("");
    try {
      const selected: Values = {};
      if (script) {
        scriptArguments(script, values[script.id] ?? {});
        // Persisted values must still match the current server allowlist.
        for (const [name, definition] of Object.entries(script.parameters)) {
          const value = values[script.id]?.[name];
          if (definition.choices ? typeof value === "string" && definition.choices.includes(value) : typeof value === "boolean") selected[name] = value;
        }
      }
      const path = script ? `scripts/${encodeURIComponent(script.id)}/start` : "scripts/kill";
      const reply = actionSchema.parse(await runtimeRequest(path, base, script ? { parameters: selected } : {}, "POST", controller.signal));
      if (identity.current === generation) setCurrent(reply.current);
    } catch (reason) {
      if (identity.current === generation && !controller.signal.aborted) setError(String(reason));
    } finally {
      if (action.current === controller) action.current = null;
      if (identity.current === generation) setBusy(false);
    }
  };

  const currentName = current?.id === "kill" ? "kill_fruit_processes.sh" : scripts.find((script) => script.id === current?.id)?.script;
  const running = current?.state === "RUNNING";
  const disabled = busy || !!operation || !available || !ctx.active;

  return <div className="fruit-scripts">
    <header className="fruit-scripts-toolbar">
      <button className="fruit-scripts-kill" disabled={disabled} onClick={() => void perform()}>Kill</button>
      <strong>{tr("脚本控制", "Script control")}</strong>
      <span>{tr("停止进程，非硬件急停。", "Process cleanup, not hardware ESTOP.")}</span>
      <span role="status">{operation === "KILLING" ? tr("正在清理…", "Cleaning up…") : busy || operation === "STARTING" ? tr("正在启动…", "Starting…") : available ? tr("运行服务在线", "Runtime online") : tr("运行服务离线", "Runtime offline")}</span>
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
            const isCurrent = current?.id === script.id;
            return <article className={`fruit-scripts-card ${isCurrent && running ? "running" : ""}`} key={script.id}>
              <header><strong>{script.script}</strong><span className="fruit-scripts-badge">{isCurrent
                ? running ? tr("运行中", "Running") : `${tr("已退出", "Exited")} (${current.exit_code ?? "?"})`
                : tr("未运行", "Idle")}</span></header>
              <div className="fruit-scripts-parameters">{Object.entries(script.parameters).map(([name, definition]) => {
                const value = values[script.id]?.[name];
                return <label key={name}>
                  <span>{definition.flag || name}{definition.required ? " *" : ""}</span>
                  {definition.choices ? <select disabled={busy} required={definition.required} value={typeof value === "string" && definition.choices.includes(value) ? value : ""}
                    onChange={(event) => changeValue(script, name, event.target.value)}>
                    <option value="">{definition.required ? tr("请选择", "Select") : `${tr("默认", "Default")}: ${definition.default}`}</option>
                    {definition.choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
                  </select> : <span className="fruit-scripts-boolean"><input type="checkbox" disabled={busy} checked={value === true}
                    onChange={(event) => changeValue(script, name, event.target.checked)} />{tr("启用（默认关闭）", "Enable (default off)")}</span>}
                </label>;
              })}</div>
              {!Object.keys(script.parameters).length && <small>{tr("无参数", "No parameters")}</small>}
              {script.note && <small>{script.note}</small>}
              <code className="fruit-scripts-preview">./{script.script}{valid ? ` ${args.join(" ")}` : tr(" [先选择必填参数]", " [select required parameters]")}</code>
              <button disabled={disabled || !valid} onClick={() => void perform(script)}>{tr("启动", "Start")}</button>
            </article>;
          })}
        </section>
      </Panel>
      <Separator className={`fruit-scripts-separator ${isMobile ? "horizontal" : "vertical"}`} />
      <Panel id="logs" minSize={isMobile ? "160px" : "240px"}>
        <section className="fruit-scripts-log" aria-label={tr("当前脚本日志", "Current script log")}>
          <header><strong>{tr("当前日志", "Current log")}</strong><code>{currentName ?? tr("尚未启动", "Not started")}</code>
            <span>{current ? running ? `PID ${current.pid}` : `${tr("退出码", "Exit code")} ${current.exit_code ?? "?"}` : ""}</span>
            <button onClick={() => terminal.current?.clear()}>{tr("清屏", "Clear screen")}</button>
          </header>
          <div className="fruit-scripts-terminal" ref={logElement} />
        </section>
      </Panel>
    </Group>
  </div>;
}

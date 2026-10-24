import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export type LogTerminalHandle = Pick<Terminal, "write" | "reset" | "clear">;

/** Read-only ANSI log display. Network requests and cursors belong to callers. */
export default function LogTerminal({ ref, theme, active = true, fontScale = 1, label, initialText = "" }: {
  ref?: Ref<LogTerminalHandle>;
  theme: "dark" | "light";
  active?: boolean;
  fontScale?: number;
  label: string;
  initialText?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fit = useRef<FitAddon | null>(null);
  const initial = useRef(initialText);

  useImperativeHandle(ref, () => ({
    write: (...args) => terminal.current?.write(...args),
    reset: () => terminal.current?.reset(),
    clear: () => terminal.current?.clear(),
  }), []);

  useEffect(() => {
    const term = new Terminal({ disableStdin: true, convertEol: true, scrollback: 5000, cursorBlink: false });
    const addon = new FitAddon();
    term.loadAddon(addon);
    term.open(container.current!);
    terminal.current = term;
    fit.current = addon;
    if (initial.current) term.write(initial.current);
    const observer = new ResizeObserver(() => {
      if (container.current?.clientWidth && container.current.clientHeight) addon.fit();
    });
    observer.observe(container.current!);
    return () => { observer.disconnect(); term.dispose(); terminal.current = null; fit.current = null; };
  }, []);

  useEffect(() => {
    const term = terminal.current;
    if (!term) return;
    const styles = getComputedStyle(container.current!);
    term.options.theme = {
      background: styles.getPropertyValue("--canvas").trim(),
      foreground: styles.getPropertyValue("--foreground").trim(),
      overviewRulerBorder: styles.getPropertyValue("--canvas").trim(),
    };
    term.options.fontFamily = styles.getPropertyValue("--mono").trim();
    term.options.fontSize = Math.max(9, Math.round(12 * fontScale));
    if (active && container.current?.clientWidth && container.current.clientHeight) fit.current?.fit();
  }, [theme, active, fontScale]);

  return <div className="rv-log-terminal" ref={container} role="region" aria-label={label} />;
}

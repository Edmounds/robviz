import { ChevronDown, RotateCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

import {
  parseTerminalTarget,
  terminalServerMessageSchema,
  validateTerminalPassword,
  validateTerminalUsername,
} from "../core/terminalProtocol";
import { useI18n } from "../app/i18n";

const GATEWAY_URL = "ws://127.0.0.1:8767";
const USERNAME_KEY = "robviz.terminal.username";
const PASSWORD_KEY = "robviz.terminal.password";

type TerminalStatus = "idle" | "connecting" | "open" | "exited" | "error";

export default function TerminalPanel({
  bridgeUrl,
  gatewayUrl,
  theme,
  visible,
  height,
  fontScale = 1,
  onHeightChange,
  onHide,
}: {
  bridgeUrl: string;
  gatewayUrl?: string;
  theme: "dark" | "light";
  visible: boolean;
  height: number;
  fontScale?: number;
  onHeightChange: (height: number) => void;
  onHide: () => void;
}) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<Terminal | undefined>(undefined);
  const fitRef = useRef<FitAddon | undefined>(undefined);
  const socketRef = useRef<WebSocket | undefined>(undefined);
  const sessionOpenRef = useRef(false);
  const sessionHostRef = useRef<string | undefined>(undefined);
  const initialThemeRef = useRef(theme);
  const initialFontScaleRef = useRef(fontScale);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  const [username, setUsername] = useState(() => localStorage.getItem(USERNAME_KEY) ?? "");
  const [password, setPassword] = useState(() => localStorage.getItem(PASSWORD_KEY) ?? "");
  const [status, setStatus] = useState<TerminalStatus>("idle");
  const [error, setError] = useState<string>();
  const [exitCode, setExitCode] = useState<number>();

  const targetHost = useMemo(() => {
    try {
      return parseTerminalTarget(bridgeUrl);
    } catch {
      return "?";
    }
  }, [bridgeUrl]);

  const statusLabel =
    status === "open"
      ? t("terminalConnected")
      : status === "connecting"
        ? t("terminalConnecting")
        : status === "exited"
          ? t("terminalExited", { code: exitCode ?? 0 })
          : status === "error"
            ? t("terminalError")
            : t("terminalIdle");

  const closeSocket = useCallback(() => {
    const socket = socketRef.current;
    socketRef.current = undefined;
    sessionOpenRef.current = false;
    sessionHostRef.current = undefined;
    socket?.close();
  }, []);

  const openSession = useCallback(() => {
    let cleanUsername: string;
    try {
      cleanUsername = validateTerminalUsername(username);
      validateTerminalPassword(password);
      if (targetHost === "?") throw new Error(t("terminalInvalidBridge"));
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message === "Invalid SSH password" ? t("terminalPasswordInvalid") : message);
      setStatus("error");
      return;
    }

    localStorage.setItem(USERNAME_KEY, cleanUsername);
    localStorage.setItem(PASSWORD_KEY, password);
    closeSocket();
    terminalRef.current?.reset();
    setError(undefined);
    setExitCode(undefined);
    setStatus("connecting");
    sessionHostRef.current = targetHost;

    const socket = new WebSocket(gatewayUrl ?? GATEWAY_URL);
    socketRef.current = socket;
    socket.onopen = () => {
      if (socketRef.current !== socket) return;
      fitRef.current?.fit();
      const terminal = terminalRef.current;
      socket.send(
        JSON.stringify({
          type: "open",
          bridgeUrl,
          username: cleanUsername,
          password,
          cols: terminal?.cols ?? 80,
          rows: terminal?.rows ?? 24,
        }),
      );
    };
    socket.onmessage = (event) => {
      if (socketRef.current !== socket) return;
      let raw: unknown;
      try {
        raw = JSON.parse(String(event.data));
      } catch {
        setError(t("terminalInvalidResponse"));
        setStatus("error");
        return;
      }
      const parsed = terminalServerMessageSchema.safeParse(raw);
      if (!parsed.success) {
        setError(t("terminalInvalidResponse"));
        setStatus("error");
        return;
      }

      const message = parsed.data;
      if (message.type === "ready") {
        sessionOpenRef.current = true;
        sessionHostRef.current = message.host;
        setStatus("open");
        terminalRef.current?.focus();
      } else if (message.type === "output") {
        terminalRef.current?.write(message.data);
      } else if (message.type === "exit") {
        sessionOpenRef.current = false;
        sessionHostRef.current = undefined;
        setExitCode(message.exitCode);
        setStatus("exited");
      } else {
        sessionOpenRef.current = false;
        setError(message.message);
        setStatus("error");
      }
    };
    socket.onerror = () => {
      if (socketRef.current !== socket) return;
      sessionOpenRef.current = false;
      setError(t("terminalGatewayUnavailable"));
      setStatus("error");
    };
    socket.onclose = () => {
      if (socketRef.current !== socket) return;
      socketRef.current = undefined;
      const wasOpen = sessionOpenRef.current;
      sessionOpenRef.current = false;
      sessionHostRef.current = undefined;
      if (wasOpen) {
        setError(t("terminalGatewayDisconnected"));
        setStatus("error");
      }
    };
  }, [bridgeUrl, closeSocket, gatewayUrl, password, t, targetHost, username]);

  const endSession = useCallback(() => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN && sessionOpenRef.current) {
      socket.send(JSON.stringify({ type: "close" }));
    } else {
      closeSocket();
      setStatus("exited");
      setExitCode(0);
    }
  }, [closeSocket]);

  useEffect(() => {
    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily: 'ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace',
      fontSize: Math.max(9, Math.round(12 * initialFontScaleRef.current)),
      lineHeight: 1.2,
      scrollback: 5_000,
      theme:
        initialThemeRef.current === "dark"
          ? { background: "#000000", foreground: "#f5f5f5", cursor: "#f5f5f5" }
          : { background: "#ffffff", foreground: "#0a0a0a", cursor: "#0a0a0a" },
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(containerRef.current!);
    terminalRef.current = terminal;
    fitRef.current = fit;

    const inputSubscription = terminal.onData((data) => {
      const socket = socketRef.current;
      if (socket?.readyState === WebSocket.OPEN && sessionOpenRef.current) {
        socket.send(JSON.stringify({ type: "input", data }));
      }
    });
    const observer = new ResizeObserver(() => {
      if (!visibleRef.current) return;
      fit.fit();
      const socket = socketRef.current;
      if (socket?.readyState === WebSocket.OPEN && sessionOpenRef.current) {
        socket.send(JSON.stringify({ type: "resize", cols: terminal.cols, rows: terminal.rows }));
      }
    });
    observer.observe(containerRef.current!);

    return () => {
      observer.disconnect();
      inputSubscription.dispose();
      closeSocket();
      terminal.dispose();
      terminalRef.current = undefined;
      fitRef.current = undefined;
    };
  }, [closeSocket]);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) return;
    const targetSize = Math.max(9, Math.round(12 * fontScale));
    if (terminal.options.fontSize !== targetSize) {
      terminal.options.fontSize = targetSize;
      if (visibleRef.current) {
        fitRef.current?.fit();
        const socket = socketRef.current;
        if (socket?.readyState === WebSocket.OPEN && sessionOpenRef.current) {
          socket.send(JSON.stringify({ type: "resize", cols: terminal.cols, rows: terminal.rows }));
        }
      }
    }
  }, [fontScale]);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) return;
    terminal.options.theme =
      theme === "dark"
        ? { background: "#000000", foreground: "#f5f5f5", cursor: "#f5f5f5" }
        : { background: "#ffffff", foreground: "#0a0a0a", cursor: "#0a0a0a" };
  }, [theme]);

  useEffect(() => {
    if (!visible) return;
    const frame = requestAnimationFrame(() => {
      fitRef.current?.fit();
      if (status === "open") terminalRef.current?.focus();
      else usernameRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [status, visible]);

  useEffect(() => {
    const sessionHost = sessionHostRef.current;
    if (!sessionHost || sessionHost === targetHost) return;
    closeSocket();
    terminalRef.current?.reset();
    setError(undefined);
    setExitCode(undefined);
    setStatus("idle");
  }, [closeSocket, targetHost]);

  const startResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = height;
      const move = (moveEvent: PointerEvent) => {
        const maximum = Math.max(160, Math.floor(window.innerHeight * 0.6));
        onHeightChange(Math.min(maximum, Math.max(160, startHeight + startY - moveEvent.clientY)));
      };
      const finish = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", finish);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", finish, { once: true });
    },
    [height, onHeightChange],
  );

  const resizeWithKeyboard = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const maximum = Math.max(160, Math.floor(window.innerHeight * 0.6));
      let next = height;
      if (event.key === "ArrowUp") next += 16;
      else if (event.key === "ArrowDown") next -= 16;
      else if (event.key === "Home") next = 160;
      else if (event.key === "End") next = maximum;
      else return;
      event.preventDefault();
      onHeightChange(Math.min(maximum, Math.max(160, next)));
    },
    [height, onHeightChange],
  );

  const showConnectForm = status !== "open" && status !== "connecting";

  return (
    <section
      className={`terminal-drawer ${visible ? "visible" : "hidden"}`}
      style={visible ? { height } : undefined}
      aria-label={t("terminal")}
    >
      <div
        className="terminal-resize-handle"
        role="separator"
        aria-label={t("terminalResize")}
        aria-orientation="horizontal"
        aria-valuemin={160}
        aria-valuemax={Math.max(160, Math.floor(window.innerHeight * 0.6))}
        aria-valuenow={Math.min(height, Math.max(160, Math.floor(window.innerHeight * 0.6)))}
        tabIndex={0}
        onKeyDown={resizeWithKeyboard}
        onPointerDown={startResize}
      />
      <div className="terminal-header">
        <span className="terminal-title">{t("terminal")}</span>
        <span className={`terminal-status ${status}`} aria-live="polite">
          {statusLabel}
        </span>
        <span className="terminal-target">{username ? `${username}@` : ""}{targetHost}</span>
        <span className="spacer" />
        <button className="terminal-icon-btn" onClick={openSession} title={t("terminalReconnect")} aria-label={t("terminalReconnect")}>
          <RotateCw />
        </button>
        <button className="terminal-icon-btn" onClick={endSession} disabled={!sessionOpenRef.current} title={t("terminalEnd")} aria-label={t("terminalEnd")}>
          <Trash2 />
        </button>
        <button className="terminal-icon-btn" onClick={onHide} title={t("terminalHide")} aria-label={t("terminalHide")}>
          <ChevronDown />
        </button>
      </div>
      {showConnectForm && (
        <form
          className="terminal-connect-bar"
          onSubmit={(event) => {
            event.preventDefault();
            openSession();
          }}
        >
          <span className="terminal-readonly-target">{targetHost}</span>
          <input
            ref={usernameRef}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder={t("terminalUsername")}
            aria-label={t("terminalUsername")}
            spellCheck={false}
            autoComplete="username"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("terminalPassword")}
            aria-label={t("terminalPassword")}
            autoComplete="current-password"
            maxLength={1024}
          />
          <button type="submit">{t("terminalConnect")}</button>
          {error && <span className="terminal-error" title={error}>{error}</span>}
        </form>
      )}
      <div className="terminal-xterm" ref={containerRef} />
    </section>
  );
}

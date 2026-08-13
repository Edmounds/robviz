/**
 * Agent 命令通道：UI 作为客户端连到 CLI（robviz screenshot）临时开的
 * WebSocket（默认 8766），响应截图等指令。通道不在时静默重试，不影响 UI。
 */

export interface AgentCommand {
  id: number;
  op: string;
}

export function startAgentChannel(
  handlers: { screenshot: () => string },
  url = "ws://localhost:8766",
): () => void {
  let ws: WebSocket | undefined;
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const connect = () => {
    if (closed) return;
    try {
      ws = new WebSocket(url);
    } catch {
      timer = setTimeout(connect, 5000);
      return;
    }
    ws.onmessage = (ev) => {
      let cmd: AgentCommand;
      try {
        cmd = JSON.parse(ev.data as string) as AgentCommand;
      } catch {
        return;
      }
      if (cmd.op === "screenshot") {
        try {
          ws?.send(JSON.stringify({ id: cmd.id, ok: true, dataUrl: handlers.screenshot() }));
        } catch (err) {
          ws?.send(JSON.stringify({ id: cmd.id, ok: false, error: String(err) }));
        }
      }
    };
    ws.onclose = () => {
      if (!closed) timer = setTimeout(connect, 5000);
    };
    ws.onerror = () => ws?.close();
  };
  connect();

  return () => {
    closed = true;
    if (timer) clearTimeout(timer);
    ws?.close();
  };
}

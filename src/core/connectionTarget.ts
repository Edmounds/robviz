export function connectionTargetLabel(url: string): string {
  try {
    return new URL(url).hostname || url;
  } catch {
    return url;
  }
}

export function validateWebSocketUrl(url: string): { ok: true; url: string } | { ok: false; error: string } {
  const trimmed = url.trim();
  if (!trimmed) {
    return { ok: false, error: "WebSocket URL cannot be empty" };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
      return { ok: false, error: `Invalid WebSocket protocol "${parsed.protocol}" (expected ws: or wss:)` };
    }
    if (!parsed.hostname) {
      return { ok: false, error: "WebSocket URL must include a hostname" };
    }
    if (parsed.username || parsed.password || parsed.hash) {
      return { ok: false, error: "WebSocket URL cannot include credentials or a fragment" };
    }
    return { ok: true, url: trimmed };
  } catch {
    return { ok: false, error: `Invalid WebSocket URL: "${url}"` };
  }
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { webRtcManager } from "../../src/media/WebRtcStreamClient";

class MockWebSocket {
  static OPEN = 1;
  static instances: MockWebSocket[] = [];
  readyState = 0;
  messages: Array<Record<string, unknown>> = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => Promise<void> | void) | null = null;

  constructor(readonly url: string) {
    MockWebSocket.instances.push(this);
    queueMicrotask(() => {
      if (this.readyState !== 0) return;
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    });
  }

  send(data: string) {
    this.messages.push(JSON.parse(data) as Record<string, unknown>);
  }

  close() {
    this.readyState = 3;
    this.onclose?.();
  }
}

class MockPeer {
  static instances: MockPeer[] = [];
  static nextRemoteWait: Promise<void> | undefined;
  remoteDescription: unknown = null;
  connectionState = "new";
  closed = false;
  ontrack: ((event: { streams: unknown[] }) => void) | null = null;
  onicecandidate: ((event: { candidate: unknown }) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  private remoteWait = MockPeer.nextRemoteWait;
  constructor() {
    MockPeer.instances.push(this);
    MockPeer.nextRemoteWait = undefined;
  }
  setRemoteDescription = vi.fn(async (description: unknown) => {
    await this.remoteWait;
    this.remoteDescription = description;
  });
  createAnswer = vi.fn(async () => ({ type: "answer", sdp: "answer-sdp" }));
  setLocalDescription = vi.fn(async () => {});
  addIceCandidate = vi.fn(async () => {});
  getStats = vi.fn(async () => new Map<string, Record<string, unknown>>());
  close() { this.closed = true; this.connectionState = "closed"; this.onconnectionstatechange?.(); }
}

const cleanups: Array<() => void> = [];
const wsUrl = "ws://fake-gateway:8787/ws";
function watch(topic: string, viewer = "panel", fps = 10, onStream = vi.fn(), onStats = vi.fn()) {
  const stop = webRtcManager.watch(topic, wsUrl, viewer, fps, onStream, onStats);
  cleanups.push(stop);
  return stop;
}
async function offer(socket: MockWebSocket, topic: string) {
  await socket.onmessage?.({ data: JSON.stringify({ type: "offer", topic, sdp: "offer-sdp" }) });
}

beforeEach(() => {
  vi.stubGlobal("WebSocket", MockWebSocket);
  vi.stubGlobal("RTCPeerConnection", MockPeer);
  vi.stubGlobal("window", globalThis);
});

afterEach(() => {
  for (const stop of cleanups.splice(0)) stop();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  MockWebSocket.instances = [];
  MockPeer.instances = [];
  MockPeer.nextRemoteWait = undefined;
});

describe("WebRtcStreamClient", () => {
  it("derives media WebSocket URL from Foxglove URL", () => {
    expect(webRtcManager.deriveMediaUrl("ws://192.168.147.144:8765")).toBe("ws://192.168.147.144:8787/ws");
    expect(webRtcManager.deriveMediaUrl("wss://robot.example.com:8765")).toBe("wss://robot.example.com:8787/ws");
    expect(webRtcManager.deriveMediaUrl("ws://localhost:8765")).toBe("ws://localhost:8787/ws");
  });

  it("prioritizes explicit mediaUrl when provided", () => {
    expect(webRtcManager.deriveMediaUrl("ws://localhost:8765", "ws://10.0.0.1:9999/ws")).toBe(
      "ws://10.0.0.1:9999/ws",
    );
  });

  it("shares one signaling connection and applies the maximum active viewer FPS", async () => {
    vi.stubGlobal("WebSocket", MockWebSocket);
    const topic = "/camera/front/image_raw";
    const wsUrl = "ws://fake-gateway:8787/ws";
    let latestStats: { targetFps: number } | undefined;
    const unsubLow = webRtcManager.watch(topic, wsUrl, "panel-low", 5, () => {}, (stats) => {
      latestStats = stats;
    });
    const unsubHigh = webRtcManager.watch(topic, wsUrl, "panel-high", 20, () => {}, (stats) => {
      latestStats = stats;
    });
    cleanups.push(unsubLow, unsubHigh);

    await Promise.resolve();
    await Promise.resolve();
    expect(MockWebSocket.instances).toHaveLength(1);
    const socket = MockWebSocket.instances[0];
    expect(socket.messages).toContainEqual({ type: "watch", topic, targetFps: 20 });
    expect(latestStats?.targetFps).toBe(20);

    webRtcManager.setFps(topic, wsUrl, "panel-high", 10);
    expect(socket.messages.at(-1)).toEqual({ type: "setFps", topic, targetFps: 10 });
    unsubHigh();
    expect(socket.messages.at(-1)).toEqual({ type: "setFps", topic, targetFps: 5 });
    expect(latestStats?.targetFps).toBe(5);

    unsubLow();
    expect(socket.messages.at(-1)).toEqual({ type: "unwatch", topic });
    expect(socket.readyState).toBe(3);
  });

  it("reconnects a closed socket with the latest viewer FPS, without duplicate retries", async () => {
    vi.useFakeTimers();
    const topic = "/camera/reconnect";
    watch(topic, "a", 5);
    await Promise.resolve();
    const first = MockWebSocket.instances[0];
    const staleClose = first.onclose;
    first.close();
    watch(topic, "b", 20);
    expect(MockWebSocket.instances).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(MockWebSocket.instances).toHaveLength(2);
    expect(MockWebSocket.instances[1].messages).toContainEqual({ type: "watch", topic, targetFps: 20 });
    staleClose?.();
    await vi.advanceTimersByTimeAsync(1000);
    expect(MockWebSocket.instances).toHaveLength(2);
  });

  it("cancels pending recovery after the last viewer leaves", async () => {
    vi.useFakeTimers();
    const stop = watch("/camera/cancel");
    await Promise.resolve();
    MockWebSocket.instances[0].onerror?.();
    stop();
    await vi.advanceTimersByTimeAsync(5000);
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("closes failed peers, clears video/polling, and negotiates a new peer", async () => {
    vi.useFakeTimers();
    const stream = vi.fn();
    const topic = "/camera/peer-failure";
    watch(topic, "a", 10, stream);
    await Promise.resolve();
    const firstSocket = MockWebSocket.instances[0];
    await offer(firstSocket, topic);
    const firstPeer = MockPeer.instances[0];
    firstPeer.ontrack?.({ streams: [{}] });
    expect(vi.getTimerCount()).toBe(1);
    firstPeer.connectionState = "failed";
    firstPeer.onconnectionstatechange?.();
    expect(firstPeer.closed).toBe(true);
    expect(stream).toHaveBeenLastCalledWith(null);
    await vi.advanceTimersByTimeAsync(1000);
    expect(firstPeer.getStats).not.toHaveBeenCalled();
    await offer(MockWebSocket.instances[1], topic);
    expect(MockPeer.instances).toHaveLength(2);
    expect(MockWebSocket.instances[1].messages).toContainEqual({ type: "answer", topic, sdp: "answer-sdp" });
  });

  it("does not complete stale SDP negotiation after closing the stream", async () => {
    let finishRemote!: () => void;
    MockPeer.nextRemoteWait = new Promise<void>((resolve) => { finishRemote = resolve; });
    const topic = "/camera/stale-offer";
    const stop = watch(topic);
    await Promise.resolve();
    const socket = MockWebSocket.instances[0];
    const negotiation = offer(socket, topic);
    stop();
    finishRemote();
    await negotiation;
    expect(MockPeer.instances[0].closed).toBe(true);
    expect(MockPeer.instances[0].createAnswer).not.toHaveBeenCalled();
    expect(socket.messages.some((msg) => msg.type === "answer")).toBe(false);
  });

  it("ignores late getStats results after disconnect instead of restoring streaming status", async () => {
    vi.useFakeTimers();
    const stats = vi.fn();
    const topic = "/camera/stale-stats";
    watch(topic, "a", 10, vi.fn(), stats);
    await Promise.resolve();
    const socket = MockWebSocket.instances[0];
    await offer(socket, topic);
    const pc = MockPeer.instances[0];
    let finish!: (value: Map<string, Record<string, unknown>>) => void;
    pc.getStats.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    pc.ontrack?.({ streams: [{}] });
    vi.advanceTimersByTime(1000);
    socket.close();
    finish(new Map([["video", { type: "inbound-rtp", kind: "video", framesDecoded: 1 }]]));
    await Promise.resolve();
    await Promise.resolve();
    expect(stats.mock.calls.at(-1)?.[0].status).toBe("error");
  });

  it("buffers early ICE and propagates explicit unsupported source encodings", async () => {
    const stats = vi.fn();
    const topic = "/camera/depth";
    watch(topic, "a", 10, vi.fn(), stats);
    await Promise.resolve();
    const socket = MockWebSocket.instances[0];
    await socket.onmessage?.({ data: JSON.stringify({ type: "ice", topic, candidate: "early", sdpMLineIndex: 0 }) });
    await offer(socket, topic);
    expect(MockPeer.instances[0].addIceCandidate).toHaveBeenCalledWith({ candidate: "early", sdpMLineIndex: 0 });
    await socket.onmessage?.({ data: JSON.stringify({ type: "error", topic, code: "unsupported_encoding", encoding: "16UC1", message: "not color" }) });
    expect(stats.mock.calls.at(-1)?.[0]).toMatchObject({ status: "error", sourceEncoding: "16UC1" });
  });

  it.each([
    null,
    [],
    "not an object",
    {},
    { type: 1 },
    { type: "offer", sdp: "offer-sdp" },
    { type: "ice", topic: 1, candidate: "early", sdpMLineIndex: 0 },
    { type: "offer", topic: "/camera/invalid", sdp: 123 },
    { type: "offer", topic: "/camera/invalid", sdp: " " },
    { type: "ice", topic: "/camera/invalid", candidate: 123, sdpMLineIndex: 0 },
    { type: "ice", topic: "/camera/invalid", candidate: "early" },
    { type: "ice", topic: "/camera/invalid", candidate: "early", sdpMLineIndex: -1 },
    { type: "ice", topic: "/camera/invalid", candidate: "early", sdpMLineIndex: 16 },
    { type: "ice", topic: "/camera/invalid", candidate: "early", sdpMLineIndex: 0.5 },
  ])("rejects malformed signaling without automatic recovery: %j", async (message) => {
    vi.useFakeTimers();
    const stats = vi.fn();
    watch("/camera/invalid", "a", 10, vi.fn(), stats);
    await Promise.resolve();
    const socket = MockWebSocket.instances[0];
    await socket.onmessage?.({ data: JSON.stringify(message) });
    expect(stats.mock.calls.at(-1)?.[0]).toMatchObject({ status: "error" });
    expect(stats.mock.calls.at(-1)?.[0].statusText).toContain("Invalid video");
    expect(socket.readyState).toBe(3);
    await vi.advanceTimersByTimeAsync(5000);
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockPeer.instances).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("preserves other-topic isolation, global metadata, and signaling extensions", async () => {
    const topic = "/camera/isolation";
    const stats = vi.fn();
    watch(topic, "a", 10, vi.fn(), stats);
    await Promise.resolve();
    const socket = MockWebSocket.instances[0];
    for (const message of [
      { type: "offer", topic: "/camera/other", sdp: 123 },
      { type: "ice", topic: "/camera/other", candidate: 123 },
      { type: "future-extension", topic },
      { type: "meta", streams: { [topic]: { transport: "webrtc" } } },
    ]) {
      await socket.onmessage?.({ data: JSON.stringify(message) });
    }
    expect(socket.readyState).toBe(MockWebSocket.OPEN);
    expect(stats.mock.calls.at(-1)?.[0]).toMatchObject({ status: "connecting", transport: "webrtc" });
    await socket.onmessage?.({ data: JSON.stringify({ type: "ice", topic, candidate: "", sdpMLineIndex: 0 }) });
    await offer(socket, topic);
    expect(MockPeer.instances[0].addIceCandidate).toHaveBeenCalledWith({ candidate: "", sdpMLineIndex: 0 });
    expect(socket.messages).toContainEqual({ type: "answer", topic, sdp: "answer-sdp" });
  });

});

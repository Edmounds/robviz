/**
 * WebRTC Video Stream Client & Multi-Panel Manager for RobViz
 * Handles on-demand WebRTC peer connections, dynamic bitrate telemetry,
 * and shared media streams for identical ROS image topics across multiple panels.
 */

export interface WebRtcStreamStats {
  topic: string;
  targetFps: number;
  actualFps: number;
  bitrateKbps: number;
  width: number;
  height: number;
  packetLoss: number;
  encoderBitrateKbps?: number;
  /** 网关明确报告的源编码；不能从 Image schema 或话题名猜测颜色/深度。 */
  sourceEncoding?: string;
  rtt: number;
  encoder: string;
  status: "idle" | "connecting" | "streaming" | "congested" | "error" | "stopped";
  statusText?: string;
  transport?: "webrtc" | "jpeg";
  compressedTopic?: string;
}

export type WebRtcStatsCallback = (stats: WebRtcStreamStats) => void;
export type WebRtcStreamCallback = (stream: MediaStream | null) => void;

interface ViewerHandle {
  id: string;
  targetFps: number;
  onStream: WebRtcStreamCallback;
  onStats: WebRtcStatsCallback;
}

class TopicPeer {
  readonly topic: string;
  private wsUrl: string;
  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private stream: MediaStream | null = null;

  private viewers = new Map<string, ViewerHandle>();
  private targetFps = 10;
  private statsTimer: number | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private lastBytes = 0;
  private lastFrames = 0;
  private lastPacketsLost = 0;
  private lastPacketsReceived = 0;
  private lastTimestamp = 0;
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private currentStats: WebRtcStreamStats;

  constructor(topic: string, wsUrl: string) {
    this.topic = topic;
    this.wsUrl = wsUrl;
    this.currentStats = {
      topic,
      targetFps: 10,
      actualFps: 0,
      bitrateKbps: 0,
      width: 0,
      height: 0,
      packetLoss: 0,
      rtt: 0,
      encoder: "h264",
      status: "idle",
    };
  }

  addViewer(viewer: ViewerHandle) {
    this.viewers.set(viewer.id, viewer);
    if (this.stream) {
      viewer.onStream(this.stream);
    }
    viewer.onStats(this.currentStats);

    this.updateMaxFps();
    if (!this.ws) {
      this.connect();
    }
  }

  get hasViewers() {
    return this.viewers.size > 0;
  }

  removeViewer(viewerId: string) {
    this.viewers.delete(viewerId);
    if (this.viewers.size === 0) {
      this.disconnect();
    } else {
      this.updateMaxFps();
    }
  }

  setViewerFps(viewerId: string, fps: number) {
    const viewer = this.viewers.get(viewerId);
    if (viewer) {
      viewer.targetFps = fps;
      this.updateMaxFps();
    }
  }

  private updateMaxFps() {
    const maxFps = this.viewers.size
      ? Math.max(...Array.from(this.viewers.values(), (viewer) => viewer.targetFps))
      : 10;
    if (maxFps !== this.targetFps) {
      this.targetFps = maxFps;
      this.currentStats = { ...this.currentStats, targetFps: maxFps };
      this.notifyStats();
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "setFps", topic: this.topic, targetFps: maxFps }));
      }
    }
  }

  private connect() {
    this.updateStatus("connecting", "Connecting to video gateway...");
    let ws: WebSocket;
    try {
      ws = new WebSocket(this.wsUrl);
      this.ws = ws;
    } catch (err) {
      this.retryGateway(`Failed to open ${this.wsUrl}: ${String(err)}`);
      return;
    }

    ws.onopen = () => {
      if (this.ws !== ws) return;
      this.updateStatus("connecting", `Watching ${this.topic} (${this.targetFps} FPS)...`);
      ws.send(
        JSON.stringify({
          type: "watch",
          topic: this.topic,
          targetFps: this.targetFps,
        }),
      );
    };

    ws.onmessage = async (event) => {
      if (this.ws !== ws) return;
      try {
        const msg = JSON.parse(event.data as string);
        if (!msg || typeof msg !== "object") return;
        if (msg.type === "offer" && msg.topic === this.topic && typeof msg.sdp === "string") {
          await this.handleOffer(msg.sdp, msg.encoder, ws);
        } else if (msg.type === "ice" && msg.topic === this.topic &&
                   typeof msg.candidate === "string" && Number.isInteger(msg.sdpMLineIndex) &&
                   msg.sdpMLineIndex >= 0 && msg.sdpMLineIndex < 16) {
          await this.handleIce(msg.candidate, msg.sdpMLineIndex);
        } else if (msg.type === "meta") {
          const streamMeta = msg.topic === this.topic ? msg : msg.streams?.[this.topic];
          if (streamMeta) {
            this.currentStats = {
              ...this.currentStats,
              transport: streamMeta.transport,
              compressedTopic: streamMeta.compressedTopic,
            };
            this.notifyStats();
          }
        } else if (msg.type === "stats" && msg.topic === this.topic) {
          if (Number.isFinite(msg.encoderBitrateKbps)) {
            this.currentStats = {
              ...this.currentStats,
              encoderBitrateKbps: msg.encoderBitrateKbps,
            };
            this.notifyStats();
          }
        } else if (msg.type === "error" && (!msg.topic || msg.topic === this.topic)) {
          if (msg.code === "unsupported_encoding" && typeof msg.encoding === "string") {
            this.currentStats = { ...this.currentStats, sourceEncoding: msg.encoding };
          }
          this.fail(String(msg.message || "Video stream unavailable"));
        }
      } catch (err) {
        console.warn("[WebRtc] Message error:", err);
        if (this.ws === ws) this.fail(String(err));
      }
    };

    ws.onerror = () => {
      if (this.ws === ws) this.retryGateway("Signaling WebSocket error");
    };

    ws.onclose = () => {
      if (this.ws === ws) this.retryGateway("Gateway connection closed");
    };
  }

  private async handleOffer(sdp: string, encoder: unknown, ws: WebSocket) {
    this.closePeer();
    const pc = new RTCPeerConnection({
      iceServers: [],
      bundlePolicy: "max-bundle",
    });
    this.pc = pc;
    const isCurrent = () => this.pc === pc && this.ws === ws;

    if (typeof encoder === "string") {
      this.currentStats = { ...this.currentStats, encoder };
    }
    this.updateStatus("connecting");

    pc.ontrack = (event) => {
      if (!isCurrent()) return;
      this.stream = event.streams[0] || new MediaStream([event.track]);
      for (const v of this.viewers.values()) {
        v.onStream(this.stream);
      }
      this.updateStatus("streaming");
      this.startStatsPoll();
    };

    pc.onicecandidate = (event) => {
      if (isCurrent() && event.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "ice",
          topic: this.topic,
          candidate: event.candidate.candidate,
          sdpMLineIndex: event.candidate.sdpMLineIndex ?? 0,
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      if (!isCurrent()) return;
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        this.fail(`Video peer ${pc.connectionState}`);
      }
    };

    try {
      await pc.setRemoteDescription({ type: "offer", sdp });
      if (!isCurrent()) return;
      for (const candidate of this.pendingIceCandidates.splice(0)) {
        await pc.addIceCandidate(candidate);
        if (!isCurrent()) return;
      }
      const answer = await pc.createAnswer();
      if (!isCurrent()) return;
      await pc.setLocalDescription(answer);
      if (isCurrent() && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "answer", topic: this.topic, sdp: answer.sdp }));
      }
    } catch (err) {
      if (isCurrent()) this.fail(`Video negotiation failed: ${String(err)}`);
    }
  }

  private async handleIce(candidateStr: string, sdpMLineIndex: number) {
    const candidate: RTCIceCandidateInit = {
      candidate: candidateStr,
      sdpMLineIndex,
    };
    if (!this.pc?.remoteDescription) {
      if (this.pendingIceCandidates.length < 256) {
        this.pendingIceCandidates.push(candidate);
      }
      return;
    }
    try {
      await this.pc.addIceCandidate(candidate);
    } catch (err) {
      console.warn("[WebRtc] Failed to add ICE candidate:", err);
    }
  }

  private startStatsPoll() {
    if (this.statsTimer !== null) return;
    this.lastTimestamp = performance.now();
    this.lastBytes = 0;
    this.lastFrames = 0;
    this.lastPacketsLost = 0;
    this.lastPacketsReceived = 0;

    this.statsTimer = window.setInterval(async () => {
      const pc = this.pc;
      if (!pc) return;
      try {
        const stats = await pc.getStats();
        if (this.pc !== pc) return;
        const inbound = [...stats.values()].find(
          (report) => report.type === "inbound-rtp" && report.kind === "video",
        );
        if (!inbound) return;

        const now = performance.now();
        const elapsed = Math.max(0.001, (now - this.lastTimestamp) / 1000);
        const bytes = Number(inbound.bytesReceived || 0);
        const frames = Number(inbound.framesDecoded || 0);
        const packetsLost = Number(inbound.packetsLost || 0);
        const packetsReceived = Number(inbound.packetsReceived || 0);
        const lostDelta = Math.max(0, packetsLost - this.lastPacketsLost);
        const receivedDelta = Math.max(0, packetsReceived - this.lastPacketsReceived);
        const lossRate = lostDelta / Math.max(1, lostDelta + receivedDelta);
        const kbps = Math.max(0, Math.round(((bytes - this.lastBytes) * 8) / (elapsed * 1000)));
        const fps = Math.max(0, Math.round((frames - this.lastFrames) / elapsed));
        this.lastBytes = bytes;
        this.lastFrames = frames;
        this.lastPacketsLost = packetsLost;
        this.lastPacketsReceived = packetsReceived;
        this.lastTimestamp = now;

        const selectedTransport = [...stats.values()].find((report) => report.type === "transport");
        const selectedPair = selectedTransport?.selectedCandidatePairId
          ? stats.get(selectedTransport.selectedCandidatePairId)
          : [...stats.values()].find(
              (report) => report.type === "candidate-pair" && report.selected === true,
            );
        const rtt = Number(selectedPair?.currentRoundTripTime || 0);
        const isCongested = lossRate > 0.02 || rtt > 0.25;
        this.currentStats = {
          ...this.currentStats,
          actualFps: fps,
          bitrateKbps: kbps,
          width: Number(inbound.frameWidth || 0),
          height: Number(inbound.frameHeight || 0),
          packetLoss: lossRate,
          rtt,
          status: isCongested ? "congested" : "streaming",
        };
        this.notifyStats();

        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: "telemetry",
            topic: this.topic,
            rtt,
            packetLoss: lossRate,
            inboundKbps: kbps,
            actualFps: fps,
          }));
        }
      } catch (err) {
        console.warn("[WebRtc] getStats error:", err);
      }
    }, 1000);
  }

  private stopStatsPoll() {
    if (this.statsTimer !== null) {
      clearInterval(this.statsTimer);
      this.statsTimer = null;
    }
  }

  private updateStatus(status: WebRtcStreamStats["status"], text?: string) {
    this.currentStats = { ...this.currentStats, status, statusText: text };
    this.notifyStats();
  }

  private notifyStats() {
    for (const v of this.viewers.values()) {
      v.onStats(this.currentStats);
    }
  }

  private closePeer() {
    this.stopStatsPoll();
    const pc = this.pc;
    this.pc = null;
    pc?.close();
    this.stream = null;
    this.currentStats = {
      ...this.currentStats, actualFps: 0, bitrateKbps: 0, width: 0, height: 0,
      packetLoss: 0, rtt: 0, encoderBitrateKbps: undefined,
    };
    for (const v of this.viewers.values()) {
      v.onStream(null);
    }
  }

  private closeTransport() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    const ws = this.ws;
    this.ws = null; // 先失效，忽略旧 socket/异步 SDP 的迟到回调
    this.closePeer();
    this.pendingIceCandidates.length = 0;
    ws?.close();
  }

  private retryGateway(message: string) {
    this.closeTransport();
    if (!this.hasViewers) return;
    this.updateStatus("connecting", `${message}. Waiting for video gateway...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.hasViewers) this.connect();
    }, 1000);
  }

  private fail(message: string) {
    this.closeTransport();
    this.updateStatus("error", message);
  }

  reconnect() {
    this.closeTransport();
    this.connect();
  }

  disconnect() {
    try {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "unwatch", topic: this.topic }));
      }
    } finally {
      this.closeTransport();
    }
    this.updateStatus("stopped", "Stopped");
  }
}

/**
 * Singleton manager to share WebRTC stream connections across multiple panels for the same topic.
 */
class WebRtcStreamManager {
  private peers = new Map<string, TopicPeer>();

  /**
   * Helper to derive the gateway WebSocket URL from Foxglove bridge URL
   */
  deriveMediaUrl(foxgloveUrl: string, explicitMediaUrl?: string): string {
    if (explicitMediaUrl && explicitMediaUrl.trim()) {
      return explicitMediaUrl.trim();
    }
    try {
      const parsed = new URL(foxgloveUrl);
      const pageHost = typeof window !== "undefined" && window.location
        ? window.location.hostname
        : "";
      const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
      const host = localHosts.has(parsed.hostname) && pageHost && !localHosts.has(pageHost)
        ? pageHost
        : parsed.hostname;
      const proto = parsed.protocol === "wss:" ? "wss:" : "ws:";
      const port = 8787;
      return `${proto}//${host}:${port}/ws`;
    } catch {
      const pageHost = typeof window !== "undefined" && window.location
        ? window.location.hostname
        : "localhost";
      return `ws://${pageHost || "localhost"}:8787/ws`;
    }
  }

  watch(
    topic: string,
    wsUrl: string,
    viewerId: string,
    targetFps: number,
    onStream: WebRtcStreamCallback,
    onStats: WebRtcStatsCallback,
  ): () => void {
    const key = `${wsUrl}::${topic}`;
    let peer = this.peers.get(key);
    if (!peer) {
      peer = new TopicPeer(topic, wsUrl);
      this.peers.set(key, peer);
    }

    peer.addViewer({
      id: viewerId,
      targetFps,
      onStream,
      onStats,
    });

    let watching = true;
    return () => {
      if (!watching) return;
      watching = false;
      peer.removeViewer(viewerId);
      if (!peer.hasViewers && this.peers.get(key) === peer) {
        this.peers.delete(key);
      }
    };
  }

  setFps(topic: string, wsUrl: string, viewerId: string, fps: number) {
    const key = `${wsUrl}::${topic}`;
    const peer = this.peers.get(key);
    peer?.setViewerFps(viewerId, fps);
  }

  reconnect(topic: string, wsUrl: string) {
    const key = `${wsUrl}::${topic}`;
    const peer = this.peers.get(key);
    peer?.reconnect();
  }
}

export const webRtcManager = new WebRtcStreamManager();

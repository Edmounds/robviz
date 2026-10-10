/**
 * RobViz Image Capture Client.
 * Communicates with the video gateway WebSocket server for NUC raw image capture.
 */

export interface CaptureInfo {
  topic: string;
  availableTopics: string[];
  outputDir: string;
  totalCount: number;
  lastFileName: string | null;
  hasFrame: boolean;
  frameAgeSec: number | null;
  width: number;
  height: number;
}

export interface CaptureResult {
  requestId: string;
  success: boolean;
  filePath?: string;
  fileName?: string;
  totalCount?: number;
  width?: number;
  height?: number;
  stampSec?: number;
  stampNsec?: number;
  error?: string;
}

export class CaptureUnconfirmedError extends Error {
  readonly unconfirmed = true;
  constructor(message: string) {
    super(message);
    this.name = "CaptureUnconfirmedError";
  }
}

export interface ImageCaptureCallbacks {
  onInfo?: (info: CaptureInfo) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
}

export class ImageCaptureClient {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private callbacks: ImageCaptureCallbacks;
  private pendingRequests = new Map<
    string,
    {
      resolve: (result: CaptureResult) => void;
      reject: (err: Error) => void;
      timer: ReturnType<typeof setTimeout>;
      sent: boolean;
    }
  >();
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isDisposed = false;
  private requestCounter = 0;
  private pendingTopicRequests = new Map<
    string,
    { resolve: () => void; reject: (err: Error) => void; timer: ReturnType<typeof setTimeout> }
  >();

  constructor(wsUrl: string, callbacks: ImageCaptureCallbacks = {}) {
    this.wsUrl = wsUrl;
    this.callbacks = callbacks;
  }

  public connect(): void {
    if (this.isDisposed || this.ws) return;

    try {
      this.ws = new WebSocket(this.wsUrl);
    } catch (err) {
      this.callbacks.onError?.(err instanceof Error ? err.message : String(err));
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      if (this.isDisposed) {
        this.close();
        return;
      }
      this.callbacks.onConnectionChange?.(true);
      // Immediately request capture info upon connecting
      this.fetchInfo();
      // Periodically refresh capture status every 2 seconds
      this.pollTimer = setInterval(() => {
        if (!this.isDisposed && this.ws?.readyState === WebSocket.OPEN) {
          this.fetchInfo();
        }
      }, 2000);
    };

    this.ws.onmessage = (event) => {
      if (this.isDisposed) return;
      try {
        const data = JSON.parse(event.data as string);
        if (typeof data !== "object" || data === null) return;

        const mtype = data.type;
        if (mtype === "captureInfo") {
          const info: CaptureInfo = {
            topic: String(data.topic ?? ""),
            availableTopics: Array.isArray(data.availableTopics)
              ? data.availableTopics.filter(
                  (topic: unknown): topic is string => typeof topic === "string",
                )
              : [],
            outputDir: String(data.outputDir ?? ""),
            totalCount: Number(data.totalCount ?? 0),
            lastFileName: data.lastFileName ? String(data.lastFileName) : null,
            hasFrame: Boolean(data.hasFrame),
            frameAgeSec: data.frameAgeSec != null ? Number(data.frameAgeSec) : null,
            width: Number(data.width ?? 0),
            height: Number(data.height ?? 0),
          };
          this.callbacks.onInfo?.(info);
        } else if (mtype === "captureTopicResult") {
          const reqId = String(data.requestId ?? "");
          const pending = this.pendingTopicRequests.get(reqId);
          if (!pending) return;
          clearTimeout(pending.timer);
          this.pendingTopicRequests.delete(reqId);
          if (data.success === true) {
            pending.resolve();
          } else {
            pending.reject(
              new Error(String(data.error ?? "Capture topic rejected")),
            );
          }
        } else if (mtype === "captureResult") {
          const reqId = String(data.requestId ?? "");
          const pending = this.pendingRequests.get(reqId);
          if (pending) {
            clearTimeout(pending.timer);
            this.pendingRequests.delete(reqId);
            const result: CaptureResult = {
              requestId: reqId,
              success: Boolean(data.success),
              filePath: data.filePath ? String(data.filePath) : undefined,
              fileName: data.fileName ? String(data.fileName) : undefined,
              totalCount: data.totalCount != null ? Number(data.totalCount) : undefined,
              width: data.width != null ? Number(data.width) : undefined,
              height: data.height != null ? Number(data.height) : undefined,
              stampSec: data.stampSec != null ? Number(data.stampSec) : undefined,
              stampNsec: data.stampNsec != null ? Number(data.stampNsec) : undefined,
              error: data.error ? String(data.error) : undefined,
            };
            pending.resolve(result);
          }
        }
      } catch {
        // Ignore unparseable frames
      }
    };

    this.ws.onerror = () => {
      this.callbacks.onError?.("WebSocket connection error");
    };

    this.ws.onclose = () => {
      this.cleanupWs();
      this.callbacks.onConnectionChange?.(false);
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.isDisposed || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 1000);
  }

  public fetchInfo(): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    const reqId = `info_${Date.now()}_${++this.requestCounter}`;
    this.ws.send(JSON.stringify({ type: "getCaptureInfo", requestId: reqId }));
  }

  public setCaptureTopic(topic: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("Video gateway not connected"));
    }

    const reqId = `topic_${Date.now()}_${++this.requestCounter}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingTopicRequests.delete(reqId);
        reject(new Error("Capture topic request timed out"));
      }, 5000);
      this.pendingTopicRequests.set(reqId, { resolve, reject, timer });
      try {
        this.ws!.send(
          JSON.stringify({
            type: "setCaptureTopic",
            requestId: reqId,
            topic,
          }),
        );
      } catch (err) {
        clearTimeout(timer);
        this.pendingTopicRequests.delete(reqId);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  public captureFrame(): Promise<CaptureResult> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("Video gateway not connected"));
    }

    const reqId = `cap_${Date.now()}_${++this.requestCounter}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(reqId);
        reject(new CaptureUnconfirmedError("Capture request timed out (10s)"));
      }, 10000);

      this.pendingRequests.set(reqId, { resolve, reject, timer, sent: false });

      try {
        this.ws!.send(JSON.stringify({ type: "captureFrame", requestId: reqId }));
        const pending = this.pendingRequests.get(reqId);
        if (pending) {
          pending.sent = true;
        }
      } catch (err) {
        clearTimeout(timer);
        this.pendingRequests.delete(reqId);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  private cleanupWs(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    // Reject any unresolved requests
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      if (pending.sent) {
        pending.reject(
          new CaptureUnconfirmedError("Connection closed before response"),
        );
      } else {
        pending.reject(new Error("Connection closed before request sent"));
      }
    }
    this.pendingRequests.clear();
    for (const [, pending] of this.pendingTopicRequests) {
      clearTimeout(pending.timer);
      pending.reject(
        new Error("Connection closed before capture topic response"),
      );
    }
    this.pendingTopicRequests.clear();
    this.ws = null;
  }

  public close(): void {
    this.isDisposed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: "unwatchCapture" }));
        } catch {
          // Ignore
        }
      }
      this.ws.close();
    }
    this.cleanupWs();
  }
}

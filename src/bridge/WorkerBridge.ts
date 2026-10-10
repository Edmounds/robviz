/**
 * 主线程侧的连接代理：面板只跟它打交道，不感知 Worker 存在。
 *
 * 分发策略：
 * - raw 消息（TF 等小消息）到达即分发（TF 缓冲需要全量样本）；
 * - cloud/grid 大负载挂到 per-topic 最新槽，由渲染循环开头统一消费
 *   （flushFrame），两帧之间到达多帧只留最新，被覆盖的立即归还缓冲池。
 */
import type {
  ConnectionState,
  ServiceInfo,
  ServiceCallOptions,
  SubscribeOptions,
  TopicInfo,
} from "../core/FoxgloveConnection";
import type {
  MainToWorker,
  MessagePayload,
  StreamStats,
  WorkerToMain,
} from "../worker/protocol";

export type PayloadHandler = (payload: MessagePayload, schemaName: string) => void;

function payloadBuffers(payload: MessagePayload): ArrayBuffer[] {
  if (payload.kind === "cloud") {
    const buffers = [payload.cloud.positions.buffer as ArrayBuffer];
    if (payload.cloud.colorValues) buffers.push(payload.cloud.colorValues.buffer as ArrayBuffer);
    return buffers;
  }
  if (payload.kind === "grid") {
    return [payload.data.buffer as ArrayBuffer];
  }
  return [];
}

export class WorkerBridge {
  #worker!: Worker;
  #handlers = new Map<string, Set<PayloadHandler>>();
  #subscriptionOptions = new Map<string, SubscribeOptions>();
  /** 大负载的帧间最新槽 */
  #frameLatest = new Map<string, { payload: MessagePayload; schemaName: string }>();
  #url: string | undefined;
  #disposed = false;
  #streamingActive: boolean;
  #lastWorkerRestartAt = 0;
  /** 每 topic 的 handler 错误限流（避免 30Hz 消息把错误刷屏） */
  #handlerErrorAt = new Map<string, number>();

  state: ConnectionState = "closed";
  topics: TopicInfo[] = [];
  services: ServiceInfo[] = [];
  stats: StreamStats | undefined;

  onStateChange?: (state: ConnectionState) => void;
  onTopicsChange?: (topics: TopicInfo[]) => void;
  onServicesChange?: (services: ServiceInfo[]) => void;
  onError?: (message: string) => void;
  onStats?: (stats: StreamStats) => void;
  /** raw 消息即时分发后调用（供渲染循环标脏） */
  onImmediateData?: () => void;

  #callId = 0;
  #connectionGeneration = 0;
  #pendingCalls = new Map<
    number,
    {
      generation: number;
      timer: ReturnType<typeof setTimeout> | undefined;
      resolve: (v: unknown) => void;
      reject: (e: Error) => void;
    }
  >();

  constructor(streamingActive = true) {
    this.#streamingActive = streamingActive;
    this.#spawnWorker();
  }

  #rejectPendingCalls(reason: Error): void {
    for (const pending of this.#pendingCalls.values()) {
      clearTimeout(pending.timer);
      pending.reject(reason);
    }
    this.#pendingCalls.clear();
  }

  /**
   * 隔离分发：单个 handler（面板/渲染器）抛错不影响其他 handler 与数据流，
   * 错误按 topic 限流上报（1 次/5s）。
   */
  #dispatch(handlers: Set<PayloadHandler>, payload: MessagePayload, schemaName: string, topic: string): void {
    for (const h of handlers) {
      try {
        h(payload, schemaName);
      } catch (err) {
        const now = Date.now();
        if (now - (this.#handlerErrorAt.get(topic) ?? 0) > 5000) {
          this.#handlerErrorAt.set(topic, now);
          console.error(`[bridge] handler error on ${topic}:`, err);
          this.onError?.(`${topic} 显示器/面板处理出错（已隔离）: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  /** Worker 崩溃自愈：重建 Worker、重连、订阅由 state=open 回调恢复 */
  #spawnWorker(): void {
    this.#worker = new Worker(new URL("../worker/connection.worker.ts", import.meta.url), {
      type: "module",
    });
    this.#worker.onerror = (ev: ErrorEvent) => {
      console.error("[bridge] connection worker crashed:", ev.message);
      this.onError?.(`连接 Worker 崩溃，正在重启: ${ev.message}`);
      this.#rejectPendingCalls(new Error("connection worker crashed"));
      this.state = "closed";
      this.topics = [];
      this.services = [];
      this.onStateChange?.("closed");
      this.onTopicsChange?.([]);
      this.onServicesChange?.([]);
      if (this.#disposed) return;
      const delay = Math.max(0, 1000 - (Date.now() - this.#lastWorkerRestartAt));
      this.#lastWorkerRestartAt = Date.now() + delay;
      setTimeout(() => {
        if (this.#disposed) return;
        this.#worker.terminate();
        this.#frameLatest.clear();
        this.#spawnWorker();
        if (this.#url) this.connect(this.#url);
      }, delay);
    };
    this.#worker.onmessage = (ev: MessageEvent<WorkerToMain>) => {
      const msg = ev.data;
      switch (msg.type) {
        case "state":
          this.state = msg.state;
          if (msg.state === "closed") {
            this.#rejectPendingCalls(new Error("connection closed"));
            this.topics = [];
            this.services = [];
            this.onTopicsChange?.([]);
            this.onServicesChange?.([]);
          } else if (msg.state === "open" && this.#streamingActive) {
            // 重连后恢复全部订阅
            for (const topic of this.#handlers.keys()) {
              this.#post({ type: "subscribe", topic, ...this.#subscriptionOptions.get(topic) });
            }
          }
          this.onStateChange?.(msg.state);
          break;
        case "channels":
          this.topics = msg.topics;
          this.onTopicsChange?.(msg.topics);
          break;
        case "services":
          this.services = msg.services;
          this.onServicesChange?.(msg.services);
          break;
        case "serviceResult": {
          const pending = this.#pendingCalls.get(msg.id);
          if (pending) {
            this.#pendingCalls.delete(msg.id);
            clearTimeout(pending.timer);
            if (pending.generation !== this.#connectionGeneration) {
              pending.reject(new Error("service result ignored from previous connection"));
            } else if (msg.ok) {
              pending.resolve(msg.response);
            } else {
              pending.reject(new Error(msg.error ?? "service call failed"));
            }
          }
          break;
        }
        case "error":
          this.onError?.(msg.message);
          break;
        case "stats":
          this.stats = msg.stats;
          this.onStats?.(msg.stats);
          break;
        case "batch": {
          if (!this.#streamingActive) {
            for (const item of msg.items) this.#recycle(payloadBuffers(item.payload));
            break;
          }
          let hadRaw = false;
          for (const item of msg.items) {
            if (item.payload.kind === "raw") {
              const set = this.#handlers.get(item.topic);
              if (set) this.#dispatch(set, item.payload, item.schemaName, item.topic);
              hadRaw = true;
            } else {
              const old = this.#frameLatest.get(item.topic);
              if (old) this.#recycle(payloadBuffers(old.payload)); // 被覆盖的过期帧
              this.#frameLatest.set(item.topic, {
                payload: item.payload,
                schemaName: item.schemaName,
              });
            }
          }
          if (hadRaw) this.onImmediateData?.();
          break;
        }
      }
    };
  }

  /**
   * 渲染循环每帧开头调用：消费大负载最新槽。
   * 返回是否有数据被分发（用于按需渲染的脏标记）。
   */
  flushFrame(): boolean {
    if (this.#frameLatest.size === 0) return false;
    let dispatched = false;
    for (const [topic, { payload, schemaName }] of this.#frameLatest) {
      const set = this.#handlers.get(topic);
      if (set) {
        this.#dispatch(set, payload, schemaName, topic);
        dispatched = true;
      }
      // 渲染器已将数据拷入 GPU 缓冲，原始缓冲立即归还池
      this.#recycle(payloadBuffers(payload));
    }
    this.#frameLatest.clear();
    return dispatched;
  }

  get url(): string | undefined {
    return this.#url;
  }

  connect(url: string): void {
    this.#url = url;
    this.#connectionGeneration++;
    this.state = "connecting";
    this.onStateChange?.("connecting");
    this.#rejectPendingCalls(new Error("connection changed"));
    this.topics = [];
    this.services = [];
    this.stats = undefined;
    for (const { payload } of this.#frameLatest.values()) {
      this.#recycle(payloadBuffers(payload));
    }
    this.#frameLatest.clear();
    this.onTopicsChange?.([]);
    this.onServicesChange?.([]);
    this.#post({ type: "connect", url });
  }

  /** 发布消息到机器人（schemaName 须在 PUB_SCHEMAS 内） */
  publish(topic: string, schemaName: string, message: unknown): void {
    if (this.state !== "open") {
      throw new Error(`Cannot publish to ${topic}: connection is not open (current state: ${this.state})`);
    }
    this.#post({ type: "publish", topic, schemaName, message });
  }

  /** Default 10s. null timeout waits without cancelling the remote operation. */
  callService(name: string, request: unknown, options: ServiceCallOptions = {}): Promise<unknown> {
    const timeout = options.timeoutMs === undefined ? 10_000 : options.timeoutMs;
    if (timeout !== null && (!Number.isFinite(timeout) || timeout <= 0 || timeout > 2_147_483_647)) {
      return Promise.reject(new Error("timeoutMs must be null or a positive timer-range number"));
    }
    if (this.state !== "open") {
      return Promise.reject(
        new Error(`Cannot call service ${name}: connection is not open (current state: ${this.state})`),
      );
    }
    const id = ++this.#callId;
    const generation = this.#connectionGeneration;
    return new Promise((resolve, reject) => {
      const timer = timeout === null ? undefined : setTimeout(() => {
        const item = this.#pendingCalls.get(id);
        if (item) {
          this.#pendingCalls.delete(id);
          item.reject(new Error(`Service call ${name} timed out after ${timeout / 1000}s`));
        }
      }, timeout);
      this.#pendingCalls.set(id, {
        generation,
        timer,
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
      this.#post({ type: "callService", id, name, request, timeoutMs: timeout });
    });
  }

  subscribe(topic: string, handler: PayloadHandler, options: SubscribeOptions = {}): () => void {
    let set = this.#handlers.get(topic);
    if (!set) {
      set = new Set();
      this.#handlers.set(topic, set);
      this.#subscriptionOptions.set(topic, options);
      if (this.#streamingActive) this.#post({ type: "subscribe", topic, ...options });
    }
    set.add(handler);
    return () => {
      const s = this.#handlers.get(topic);
      if (!s) return;
      s.delete(handler);
      if (s.size === 0) {
        this.#handlers.delete(topic);
        this.#subscriptionOptions.delete(topic);
        if (this.#streamingActive) this.#post({ type: "unsubscribe", topic });
      }
    };
  }

  /** 保持 WebSocket 在线，仅暂停非活动机器的业务订阅和帧传输。 */
  setStreamingActive(active: boolean): void {
    if (this.#streamingActive === active) return;
    this.#streamingActive = active;
    for (const topic of this.#handlers.keys()) {
      this.#post(
        active
          ? { type: "subscribe", topic, ...this.#subscriptionOptions.get(topic) }
          : { type: "unsubscribe", topic },
      );
    }
    if (!active) {
      for (const { payload } of this.#frameLatest.values()) {
        this.#recycle(payloadBuffers(payload));
      }
      this.#frameLatest.clear();
    }
  }

  dispose(): void {
    this.#disposed = true;
    this.#rejectPendingCalls(new Error("bridge disposed"));
    for (const { payload } of this.#frameLatest.values()) {
      this.#recycle(payloadBuffers(payload));
    }
    this.#frameLatest.clear();
    this.#worker.terminate();
  }

  #recycle(buffers: ArrayBuffer[]): void {
    if (buffers.length === 0) return;
    this.#worker.postMessage({ type: "recycle", buffers } satisfies MainToWorker, buffers);
  }

  #post(msg: MainToWorker): void {
    this.#worker.postMessage(msg);
  }
}

import { parse } from "@foxglove/rosmsg";
import { MessageReader, MessageWriter } from "@foxglove/rosmsg2-serialization";
import { FoxgloveClient, ServerCapability } from "@foxglove/ws-protocol";
import type { Channel, IWebSocket, Service } from "@foxglove/ws-protocol";

import { isFrameDue } from "./frameThrottle";
import { PUB_SCHEMAS } from "./rosSchemas";
import { validateWebSocketUrl } from "./connectionTarget";

export type ConnectionState = "connecting" | "open" | "closed";

export interface TopicInfo {
  topic: string;
  schemaName: string;
}

export interface ServiceInfo {
  name: string;
  type: string;
  /** 请求 schema 文本（供 UI 生成默认请求体） */
  requestSchema: string;
  /** 响应 schema 文本（供 UI 结构化展示） */
  responseSchema: string;
}

export type MessageHandler = (message: unknown, channel: Channel) => void;

export interface SubscribeOptions {
  /** 最大交付频率；只影响本地解码/分发，不改变 WebSocket 线上字节数。 */
  maxFrequency?: number;
}

export interface MessageMeta {
  topic: string;
  /** 入站 CDR 负载字节数（无论本地是否丢弃） */
  bytes: number;
  /** 解码耗时（ms）；未解码的丢弃帧为 0 */
  decodeMs: number;
  /** 是否完成 CDR 解码并交付给至少一个 handler */
  decoded: boolean;
  /** 服务端发送时间戳（ns），用于滞后估计 */
  serverTimeNs: bigint;
}

export interface FoxgloveConnectionOptions {
  /** Node 环境注入 `ws` 包的 WebSocket；浏览器默认用原生 WebSocket */
  createWebSocket?: (url: string, protocols: string[]) => IWebSocket;
  /** 重连退避基数（ms），0 表示不重连。实际间隔按 1.7 倍指数增长至 10s，带 ±30% 抖动 */
  reconnectMs?: number;
  /**
   * 协议心跳间隔（ms），0 关闭。仅在服务端声明支持 parameters 时启用，
   * 通过只读参数请求验证连接，不依赖业务话题是否有数据。
   */
  heartbeatIntervalMs?: number;
  /** 心跳发出后收不到任何服务端响应的超时（ms）。 */
  heartbeatTimeoutMs?: number;
  onStateChange?: (state: ConnectionState) => void;
  onChannels?: (topics: TopicInfo[]) => void;
  onServices?: (services: ServiceInfo[]) => void;
  onError?: (error: Error) => void;
  /** 每条消息解码后的元信息（统计/滞后估计用） */
  onMessageMeta?: (meta: MessageMeta) => void;
}

const BACKOFF_FACTOR = 1.7;
const BACKOFF_MAX_MS = 10_000;
const BACKOFF_JITTER = 0.3;
const DEFAULT_HEARTBEAT_INTERVAL_MS = 3_000;
const DEFAULT_HEARTBEAT_TIMEOUT_MS = 10_000;
const STABLE_CONNECTION_MS = 15_000;
const HEARTBEAT_PARAMETER = "/__robviz_heartbeat__:probe";

interface HandlerRegistration {
  handler: MessageHandler;
  maxFrequency?: number;
  lastDeliveredAt: number;
}

/**
 * ws-protocol 客户端封装：按 topic 订阅、schema 驱动的 CDR 解码、断线重连。
 * 零 DOM 依赖，浏览器（Worker 内）与 Node（测试 / CLI）通用。
 */
export class FoxgloveConnection {
  #url: string;
  #opts: FoxgloveConnectionOptions;
  #client: FoxgloveClient | undefined;
  #closed = false;
  #reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  #heartbeatTimer: ReturnType<typeof setInterval> | undefined;
  #stableTimer: ReturnType<typeof setTimeout> | undefined;
  #reconnectAttempt = 0;
  #heartbeatSentAt: number | undefined;
  #heartbeatSequence = 0;
  #connectionGeneration = 0;

  #channelsByTopic = new Map<string, Channel>();
  #readers = new Map<number, MessageReader>(); // channelId → reader
  #quarantinedChannels = new Set<number>(); // channelId → bad schema / encoding
  #decodeErrorAt = new Map<number, number>(); // channelId → last malformed-frame report
  /** 期望订阅集合（与服务端实际 advertise 解耦，重连后自动恢复） */
  #handlers = new Map<string, Map<MessageHandler, HandlerRegistration>>();
  #readyRegistrations: HandlerRegistration[] = [];
  #subscriptions = new Map<number, string>(); // subscriptionId → topic
  #subscriptionIdByTopic = new Map<string, number>();

  // 客户端发布通道（topic → 已 advertise 的 channelId + 编码器）
  #pubChannels = new Map<string, { channelId: number; writer: MessageWriter }>();
  // 服务
  #services = new Map<string, Service>();
  #serviceCallId = 0;
  #pendingCalls = new Map<
    number,
    { service: Service; timer: ReturnType<typeof setTimeout>; resolve: (v: unknown) => void; reject: (e: Error) => void }
  >();

  constructor(url: string, opts: FoxgloveConnectionOptions = {}) {
    this.#url = url;
    this.#opts = opts;
    this.#connect();
  }

  get topics(): TopicInfo[] {
    return [...this.#channelsByTopic.values()].map((c) => ({
      topic: c.topic,
      schemaName: c.schemaName,
    }));
  }

  /** 订阅 topic。channel 尚未 advertise 时挂起，advertise 后自动生效。返回退订函数。 */
  subscribe(topic: string, handler: MessageHandler, options: SubscribeOptions = {}): () => void {
    let registrations = this.#handlers.get(topic);
    if (!registrations) {
      registrations = new Map();
      this.#handlers.set(topic, registrations);
    }
    registrations.set(handler, {
      handler,
      maxFrequency: options.maxFrequency,
      lastDeliveredAt: -Infinity,
    });
    this.#ensureSubscribed(topic);

    return () => {
      const current = this.#handlers.get(topic);
      if (!current) return;
      current.delete(handler);
      if (current.size === 0) {
        this.#handlers.delete(topic);
        const subId = this.#subscriptionIdByTopic.get(topic);
        if (subId !== undefined && this.#client) {
          this.#client.unsubscribe(subId);
          this.#subscriptions.delete(subId);
          this.#subscriptionIdByTopic.delete(topic);
        }
      }
    };
  }

  get services(): ServiceInfo[] {
    return [...this.#services.values()].map((s) => ({
      name: s.name,
      type: s.type,
      requestSchema: s.request?.schema ?? s.requestSchema ?? "",
      responseSchema: s.response?.schema ?? s.responseSchema ?? "",
    }));
  }

  /**
   * 客户端发布：schemaName 必须在 PUB_SCHEMAS 中（客户端编码需要 schema）。
   * 首次发布时 advertise 客户端通道，断线后自动重新 advertise。
   */
  publish(topic: string, schemaName: string, message: unknown): void {
    if (!this.#client) throw new Error("not connected");
    const schema = PUB_SCHEMAS[schemaName];
    if (!schema) throw new Error(`no pub schema for ${schemaName}`);
    let ch = this.#pubChannels.get(topic);
    if (!ch) {
      const channelId = this.#client.advertise({
        topic,
        encoding: "cdr",
        schemaName,
        schema,
        schemaEncoding: "ros2msg",
      });
      ch = { channelId, writer: new MessageWriter(parse(schema, { ros2: true })) };
      this.#pubChannels.set(topic, ch);
    }
    this.#client.sendMessage(ch.channelId, ch.writer.writeMessage(message));
  }

  /** 调用服务。请求/响应 schema 来自服务端 advertise，任何类型都可调。 */
  async callService(name: string, request: unknown): Promise<unknown> {
    const client = this.#client;
    const service = this.#services.get(name);
    if (!client || !service) throw new Error(`service ${name} not available`);
    const reqSchema = service.request?.schema ?? service.requestSchema ?? "";
    let data: Uint8Array;
    if (reqSchema.trim().length === 0) {
      // 空请求（如某些 Trigger 广播）：CDR 头 + ROS2 空结构占位字节
      data = new Uint8Array([0, 1, 0, 0, 0]);
    } else {
      const writer = new MessageWriter(parse(reqSchema, { ros2: true }));
      data = writer.writeMessage(request);
    }
    const callId = ++this.#serviceCallId;
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const pending = this.#pendingCalls.get(callId);
        if (!pending) return;
        this.#pendingCalls.delete(callId);
        pending.reject(new Error(`service ${name} timeout`));
      }, 10_000);
      this.#pendingCalls.set(callId, {
        service,
        timer,
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
      try {
        client.sendServiceCallRequest({ serviceId: service.id, callId, encoding: "cdr", data });
      } catch (err) {
        this.#pendingCalls.delete(callId);
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  close(): void {
    this.#closed = true;
    this.#connectionGeneration++;
    if (this.#reconnectTimer) clearTimeout(this.#reconnectTimer);
    this.#reconnectTimer = undefined;
    this.#clearConnectionTimers();
    for (const [id, p] of this.#pendingCalls) {
      p.reject(new Error("connection closed"));
      this.#pendingCalls.delete(id);
    }
    this.#client?.close();
    this.#client = undefined;
    this.#channelsByTopic.clear();
    this.#readers.clear();
    this.#quarantinedChannels.clear();
    this.#decodeErrorAt.clear();
    this.#readyRegistrations.length = 0;
    this.#subscriptions.clear();
    this.#subscriptionIdByTopic.clear();
    this.#pubChannels.clear();
    this.#services.clear();
    this.#opts.onChannels?.([]);
    this.#opts.onServices?.([]);
    this.#opts.onStateChange?.("closed");
  }

  #connect(): void {
    const generation = ++this.#connectionGeneration;
    if (!this.#opts.createWebSocket) {
      const validation = validateWebSocketUrl(this.#url);
      if (!validation.ok) {
        this.#opts.onError?.(new Error(validation.error));
        this.#opts.onStateChange?.("closed");
        return;
      }
    }

    this.#opts.onStateChange?.("connecting");
    const protocols = [FoxgloveClient.SUPPORTED_SUBPROTOCOL, "foxglove.sdk.v1"];
    let ws: IWebSocket;
    try {
      ws = this.#opts.createWebSocket
        ? this.#opts.createWebSocket(this.#url, protocols)
        : (new WebSocket(this.#url, protocols) as unknown as IWebSocket);
    } catch (err) {
      this.#opts.onError?.(err instanceof Error ? err : new Error(String(err)));
      this.#opts.onStateChange?.("closed");
      return;
    }

    const client = new FoxgloveClient({ ws });
    this.#client = client;
    const isCurrent = () => this.#connectionGeneration === generation && this.#client === client;

    client.on("open", () => {
      if (!isCurrent()) return;
      this.#markInboundTraffic();
      this.#stableTimer = setTimeout(() => {
        this.#reconnectAttempt = 0;
      }, STABLE_CONNECTION_MS);
      this.#opts.onStateChange?.("open");
    });

    client.on("serverInfo", (info) => {
      if (!isCurrent()) return;
      this.#markInboundTraffic();
      if (info.capabilities.includes(ServerCapability.parameters)) {
        this.#startHeartbeat();
      }
    });

    client.on("time", () => {
      if (!isCurrent()) return;
      this.#markInboundTraffic();
    });

    client.on("advertise", (channels) => {
      if (!isCurrent()) return;
      this.#markInboundTraffic();
      for (const ch of channels) {
        this.#quarantinedChannels.delete(ch.id);
        this.#decodeErrorAt.delete(ch.id);
        this.#readers.delete(ch.id);
        this.#channelsByTopic.set(ch.topic, ch);
        if (this.#handlers.has(ch.topic)) this.#ensureSubscribed(ch.topic);
      }
      this.#opts.onChannels?.(this.topics);
    });

    client.on("advertiseServices", (services) => {
      if (!isCurrent()) return;
      this.#markInboundTraffic();
      for (const s of services) this.#services.set(s.name, s);
      this.#opts.onServices?.(this.services);
    });

    client.on("unadvertiseServices", (serviceIds) => {
      if (!isCurrent()) return;
      this.#markInboundTraffic();
      for (const [name, s] of this.#services) {
        if (serviceIds.includes(s.id)) this.#services.delete(name);
      }
      this.#opts.onServices?.(this.services);
    });

    client.on("serviceCallResponse", (res) => {
      if (!isCurrent()) return;
      this.#markInboundTraffic();
      const pending = this.#pendingCalls.get(res.callId);
      if (!pending) return;
      this.#pendingCalls.delete(res.callId);
      const schema =
        pending.service.response?.schema ?? pending.service.responseSchema ?? "";
      try {
        if (schema.trim().length === 0) {
          pending.resolve({});
        } else {
          const reader = new MessageReader(parse(schema, { ros2: true }));
          pending.resolve(
            reader.readMessage(new Uint8Array(res.data.buffer, res.data.byteOffset, res.data.byteLength)),
          );
        }
      } catch (err) {
        pending.reject(new Error(`decode service response failed: ${String(err)}`));
      }
    });

    client.on("serviceCallFailure", (res) => {
      if (!isCurrent()) return;
      this.#markInboundTraffic();
      const pending = this.#pendingCalls.get(res.callId);
      if (!pending) return;
      this.#pendingCalls.delete(res.callId);
      pending.reject(new Error(res.message));
    });

    client.on("unadvertise", (channelIds) => {
      if (!isCurrent()) return;
      this.#markInboundTraffic();
      for (const [topic, ch] of this.#channelsByTopic) {
        if (channelIds.includes(ch.id)) {
          this.#channelsByTopic.delete(topic);
          this.#readers.delete(ch.id);
          this.#quarantinedChannels.delete(ch.id);
          this.#decodeErrorAt.delete(ch.id);
          const subId = this.#subscriptionIdByTopic.get(topic);
          if (subId !== undefined) {
            this.#subscriptions.delete(subId);
            this.#subscriptionIdByTopic.delete(topic);
          }
        }
      }
      this.#opts.onChannels?.(this.topics);
    });

    client.on("message", ({ subscriptionId, timestamp, data }) => {
      if (!isCurrent()) return;
      this.#markInboundTraffic();
      const topic = this.#subscriptions.get(subscriptionId);
      if (topic === undefined) return;
      const channel = this.#channelsByTopic.get(topic);
      const registrations = this.#handlers.get(topic);
      if (!channel || !registrations) return;
      const now = performance.now();
      const ready = this.#readyRegistrations;
      ready.length = 0;
      for (const registration of registrations.values()) {
        if (isFrameDue(registration.lastDeliveredAt, now, registration.maxFrequency)) {
          ready.push(registration);
        }
      }
      if (ready.length === 0) {
        this.#opts.onMessageMeta?.({
          topic,
          bytes: data.byteLength,
          decodeMs: 0,
          decoded: false,
          serverTimeNs: timestamp,
        });
        return;
      }
      const reader = this.#getOrBuildReader(channel);
      if (!reader) return;
      const t0 = performance.now();
      let message: unknown;
      try {
        message = reader.readMessage(data);
      } catch (err) {
        this.#opts.onMessageMeta?.({
          topic,
          bytes: data.byteLength,
          decodeMs: performance.now() - t0,
          decoded: false,
          serverTimeNs: timestamp,
        });
        const nowError = performance.now();
        const lastError = this.#decodeErrorAt.get(channel.id) ?? -Infinity;
        if (nowError - lastError >= 5_000) {
          this.#decodeErrorAt.set(channel.id, nowError);
          this.#opts.onError?.(
            new Error(`decode failed on ${topic} (${channel.schemaName}): ${String(err)}`),
          );
        }
        ready.length = 0;
        return;
      }
      this.#opts.onMessageMeta?.({
        topic,
        bytes: data.byteLength,
        decodeMs: performance.now() - t0,
        decoded: true,
        serverTimeNs: timestamp,
      });
      // 单个 handler 抛错不影响其他 handler 与后续消息
      for (const registration of ready) {
        registration.lastDeliveredAt = now;
        try {
          registration.handler(message, channel);
        } catch (err) {
          this.#opts.onError?.(
            err instanceof Error ? err : new Error(`handler error on ${topic}: ${String(err)}`),
          );
        }
      }
      ready.length = 0;
    });

    client.on("error", (err) => {
      if (!isCurrent()) return;
      this.#opts.onError?.(err);
    });

    client.on("status", () => {
      if (!isCurrent()) return;
      this.#markInboundTraffic();
    });
    client.on("removeStatus", () => {
      if (!isCurrent()) return;
      this.#markInboundTraffic();
    });
    client.on("parameterValues", () => {
      if (!isCurrent()) return;
      this.#markInboundTraffic();
    });
    client.on("connectionGraphUpdate", () => {
      if (!isCurrent()) return;
      this.#markInboundTraffic();
    });
    client.on("fetchAssetResponse", () => {
      if (!isCurrent()) return;
      this.#markInboundTraffic();
    });
    client.on("close", () => {
      if (!isCurrent()) return;
      this.#clearConnectionTimers();
      if (this.#client === client) this.#client = undefined;
      this.#channelsByTopic.clear();
      this.#readers.clear();
      this.#quarantinedChannels.clear();
      this.#decodeErrorAt.clear();
      this.#readyRegistrations.length = 0;
      this.#subscriptions.clear();
      this.#subscriptionIdByTopic.clear();
      this.#pubChannels.clear(); // 重连后首次发布时重新 advertise
      this.#services.clear();
      for (const [id, p] of this.#pendingCalls) {
        p.reject(new Error("connection closed"));
        this.#pendingCalls.delete(id);
      }
      this.#opts.onChannels?.([]);
      this.#opts.onServices?.([]);
      this.#opts.onStateChange?.("closed");
      const base = this.#opts.reconnectMs ?? 500;
      if (!this.#closed && base > 0) {
        // 指数退避 + 抖动：避免服务重启瞬间被同时重连的客户端打爆
        const backoff = Math.min(
          base * BACKOFF_FACTOR ** this.#reconnectAttempt,
          BACKOFF_MAX_MS,
        );
        const jitter = 1 + (Math.random() * 2 - 1) * BACKOFF_JITTER;
        this.#reconnectAttempt++;
        this.#reconnectTimer = setTimeout(() => this.#connect(), backoff * jitter);
      }
    });
  }

  #markInboundTraffic(): void {
    this.#heartbeatSentAt = undefined;
  }

  #startHeartbeat(): void {
    const interval = this.#opts.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS;
    if (interval <= 0 || this.#heartbeatTimer) return;
    const timeout = this.#opts.heartbeatTimeoutMs ?? DEFAULT_HEARTBEAT_TIMEOUT_MS;
    this.#heartbeatTimer = setInterval(() => {
      const now = Date.now();
      if (this.#heartbeatSentAt !== undefined) {
        if (now - this.#heartbeatSentAt >= timeout) {
          this.#opts.onError?.(
            new Error(`connection heartbeat timed out (>${timeout}ms), reconnecting`),
          );
          if (this.#heartbeatTimer) clearInterval(this.#heartbeatTimer);
          this.#heartbeatTimer = undefined;
          this.#client?.close();
        }
        return;
      }
      this.#heartbeatSentAt = now;
      try {
        this.#client?.getParameters(
          [HEARTBEAT_PARAMETER],
          `robviz-heartbeat-${++this.#heartbeatSequence}`,
        );
      } catch (err) {
        this.#opts.onError?.(
          err instanceof Error ? err : new Error(`heartbeat send failed: ${String(err)}`),
        );
        this.#client?.close();
      }
    }, interval);
  }

  #clearConnectionTimers(): void {
    if (this.#heartbeatTimer) clearInterval(this.#heartbeatTimer);
    if (this.#stableTimer) clearTimeout(this.#stableTimer);
    this.#heartbeatTimer = undefined;
    this.#stableTimer = undefined;
    this.#heartbeatSentAt = undefined;
  }

  #ensureSubscribed(topic: string): void {
    if (!this.#client) return;
    if (this.#subscriptionIdByTopic.has(topic)) return;
    const channel = this.#channelsByTopic.get(topic);
    if (!channel) return; // 等 advertise
    try {
      const subId = this.#client.subscribe(channel.id);
      this.#subscriptions.set(subId, topic);
      this.#subscriptionIdByTopic.set(topic, subId);
    } catch (err) {
      this.#opts.onError?.(
        new Error(`subscribe failed on ${topic} (channel ${channel.id}): ${String(err)}`),
      );
    }
  }

  #getOrBuildReader(channel: Channel): MessageReader | undefined {
    if (this.#quarantinedChannels.has(channel.id)) return undefined;
    let reader = this.#readers.get(channel.id);
    if (!reader) {
      try {
        if (channel.encoding !== "cdr") {
          throw new Error(`unsupported encoding "${channel.encoding}" on ${channel.topic}`);
        }
        const definitions = parse(channel.schema, { ros2: true });
        reader = new MessageReader(definitions);
        this.#readers.set(channel.id, reader);
      } catch (err) {
        this.#quarantinedChannels.add(channel.id);
        this.#opts.onError?.(
          new Error(`bad schema/encoding for ${channel.topic} (${channel.schemaName}): ${String(err)}`),
        );
        return undefined;
      }
    }
    return reader;
  }
}

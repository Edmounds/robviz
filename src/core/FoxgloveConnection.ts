import { parse } from "@foxglove/rosmsg";
import { MessageReader, MessageWriter } from "@foxglove/rosmsg2-serialization";
import { FoxgloveClient } from "@foxglove/ws-protocol";
import type { Channel, IWebSocket, Service } from "@foxglove/ws-protocol";

import { PUB_SCHEMAS } from "./rosSchemas";

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

export interface MessageMeta {
  topic: string;
  /** CDR 负载字节数 */
  bytes: number;
  /** 解码耗时（ms） */
  decodeMs: number;
  /** 服务端发送时间戳（ns），用于滞后估计 */
  serverTimeNs: bigint;
}

export interface FoxgloveConnectionOptions {
  /** Node 环境注入 `ws` 包的 WebSocket；浏览器默认用原生 WebSocket */
  createWebSocket?: (url: string, protocols: string[]) => IWebSocket;
  /** 重连退避基数（ms），0 表示不重连。实际间隔按 1.7 倍指数增长至 10s，带 ±30% 抖动 */
  reconnectMs?: number;
  /**
   * 看门狗：连接打开且有订阅时，超过该时长收不到任何服务端消息则判定
   * 半开/卡死连接，强制断开重连。0 关闭。
   */
  staleTimeoutMs?: number;
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
  #watchdogTimer: ReturnType<typeof setInterval> | undefined;
  #reconnectAttempt = 0;
  #lastTrafficAt = 0;

  #channelsByTopic = new Map<string, Channel>();
  #readers = new Map<number, MessageReader>(); // channelId → reader
  /** 期望订阅集合（与服务端实际 advertise 解耦，重连后自动恢复） */
  #handlers = new Map<string, Set<MessageHandler>>();
  #subscriptions = new Map<number, string>(); // subscriptionId → topic
  #subscriptionIdByTopic = new Map<string, number>();

  // 客户端发布通道（topic → 已 advertise 的 channelId + 编码器）
  #pubChannels = new Map<string, { channelId: number; writer: MessageWriter }>();
  // 服务
  #services = new Map<string, Service>();
  #serviceCallId = 0;
  #pendingCalls = new Map<
    number,
    { service: Service; resolve: (v: unknown) => void; reject: (e: Error) => void }
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
  subscribe(topic: string, handler: MessageHandler): () => void {
    let set = this.#handlers.get(topic);
    if (!set) {
      set = new Set();
      this.#handlers.set(topic, set);
    }
    set.add(handler);
    this.#ensureSubscribed(topic);

    return () => {
      const s = this.#handlers.get(topic);
      if (!s) return;
      s.delete(handler);
      if (s.size === 0) {
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
      this.#pendingCalls.set(callId, { service, resolve, reject });
      setTimeout(() => {
        if (this.#pendingCalls.delete(callId)) reject(new Error(`service ${name} timeout`));
      }, 10_000);
      client.sendServiceCallRequest({ serviceId: service.id, callId, encoding: "cdr", data });
    });
  }

  close(): void {
    this.#closed = true;
    if (this.#reconnectTimer) clearTimeout(this.#reconnectTimer);
    if (this.#watchdogTimer) clearInterval(this.#watchdogTimer);
    this.#client?.close();
  }

  #connect(): void {
    this.#opts.onStateChange?.("connecting");
    const protocols = [FoxgloveClient.SUPPORTED_SUBPROTOCOL];
    const ws = this.#opts.createWebSocket
      ? this.#opts.createWebSocket(this.#url, protocols)
      : (new WebSocket(this.#url, protocols) as unknown as IWebSocket);

    const client = new FoxgloveClient({ ws });
    this.#client = client;

    client.on("open", () => {
      this.#reconnectAttempt = 0;
      this.#lastTrafficAt = Date.now();
      this.#startWatchdog();
      this.#opts.onStateChange?.("open");
    });

    client.on("serverInfo", () => {
      this.#lastTrafficAt = Date.now();
    });

    client.on("time", () => {
      this.#lastTrafficAt = Date.now();
    });

    client.on("advertise", (channels) => {
      this.#lastTrafficAt = Date.now();
      for (const ch of channels) {
        this.#channelsByTopic.set(ch.topic, ch);
        if (this.#handlers.has(ch.topic)) this.#ensureSubscribed(ch.topic);
      }
      this.#opts.onChannels?.(this.topics);
    });

    client.on("advertiseServices", (services) => {
      for (const s of services) this.#services.set(s.name, s);
      this.#opts.onServices?.(this.services);
    });

    client.on("unadvertiseServices", (serviceIds) => {
      for (const [name, s] of this.#services) {
        if (serviceIds.includes(s.id)) this.#services.delete(name);
      }
      this.#opts.onServices?.(this.services);
    });

    client.on("serviceCallResponse", (res) => {
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
      const pending = this.#pendingCalls.get(res.callId);
      if (!pending) return;
      this.#pendingCalls.delete(res.callId);
      pending.reject(new Error(res.message));
    });

    client.on("unadvertise", (channelIds) => {
      for (const [topic, ch] of this.#channelsByTopic) {
        if (channelIds.includes(ch.id)) {
          this.#channelsByTopic.delete(topic);
          this.#readers.delete(ch.id);
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
      this.#lastTrafficAt = Date.now();
      const topic = this.#subscriptions.get(subscriptionId);
      if (topic === undefined) return;
      const channel = this.#channelsByTopic.get(topic);
      const handlers = this.#handlers.get(topic);
      if (!channel || !handlers) return;
      const reader = this.#readerFor(channel);
      const t0 = performance.now();
      let message: unknown;
      try {
        message = reader.readMessage(data);
      } catch (err) {
        this.#opts.onError?.(
          new Error(`decode failed on ${topic} (${channel.schemaName}): ${String(err)}`),
        );
        return;
      }
      this.#opts.onMessageMeta?.({
        topic,
        bytes: data.byteLength,
        decodeMs: performance.now() - t0,
        serverTimeNs: timestamp,
      });
      // 单个 handler 抛错不影响其他 handler 与后续消息
      for (const h of handlers) {
        try {
          h(message, channel);
        } catch (err) {
          this.#opts.onError?.(
            err instanceof Error ? err : new Error(`handler error on ${topic}: ${String(err)}`),
          );
        }
      }
    });

    client.on("error", (err) => {
      this.#opts.onError?.(err);
    });

    client.on("close", () => {
      if (this.#watchdogTimer) clearInterval(this.#watchdogTimer);
      this.#watchdogTimer = undefined;
      this.#channelsByTopic.clear();
      this.#readers.clear();
      this.#subscriptions.clear();
      this.#subscriptionIdByTopic.clear();
      this.#pubChannels.clear(); // 重连后首次发布时重新 advertise
      this.#services.clear();
      for (const [id, p] of this.#pendingCalls) {
        p.reject(new Error("connection closed"));
        this.#pendingCalls.delete(id);
      }
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

  /**
   * 半开连接看门狗：TCP 断链（如 Wi-Fi 掉线、网线拔出）时本端可能长时间
   * 收不到 close 事件。有订阅却长期无任何服务端消息时主动断开触发重连。
   */
  #startWatchdog(): void {
    const timeout = this.#opts.staleTimeoutMs ?? 5000;
    if (timeout <= 0) return;
    if (this.#watchdogTimer) clearInterval(this.#watchdogTimer);
    this.#watchdogTimer = setInterval(() => {
      if (this.#subscriptionIdByTopic.size === 0) {
        this.#lastTrafficAt = Date.now(); // 无订阅时无预期流量，不判卡死
        return;
      }
      if (Date.now() - this.#lastTrafficAt > timeout) {
        this.#opts.onError?.(new Error(`connection stale (>${timeout}ms silent), reconnecting`));
        this.#client?.close();
      }
    }, 1000);
  }

  #ensureSubscribed(topic: string): void {
    if (!this.#client) return;
    if (this.#subscriptionIdByTopic.has(topic)) return;
    const channel = this.#channelsByTopic.get(topic);
    if (!channel) return; // 等 advertise
    const subId = this.#client.subscribe(channel.id);
    this.#subscriptions.set(subId, topic);
    this.#subscriptionIdByTopic.set(topic, subId);
  }

  #readerFor(channel: Channel): MessageReader {
    let reader = this.#readers.get(channel.id);
    if (!reader) {
      if (channel.encoding !== "cdr") {
        throw new Error(`unsupported encoding "${channel.encoding}" on ${channel.topic}`);
      }
      const definitions = parse(channel.schema, { ros2: true });
      reader = new MessageReader(definitions);
      this.#readers.set(channel.id, reader);
    }
    return reader;
  }
}

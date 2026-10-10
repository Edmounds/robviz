/**
 * 连接 Worker：持有 WebSocket 与 CDR 解码，大负载在此完成解析，
 * 主线程只收渲染就绪的 TypedArray（Transferable 零拷贝）。
 *
 * 性能策略（见 docs/02-technical-design.md §8）：
 * 1. latest-wins 合并：传感器流只保留合并窗口内最新一帧，
 *    消费速度跟不上时丢过期帧而不是排队（延迟有界）。
 * 2. 4ms 合帧窗口：突发消息合并为一次 postMessage。
 * 3. 缓冲池：点云/栅格输出缓冲由主线程用完归还，稳态零大分配。
 * 4. 滞后估计：服务端时间戳 vs 本地时钟的最小偏移基线，
 *    偏移增量即网络/排队滞后（bufferbloat 指示器）。
 */
import { FoxgloveConnection } from "../core/FoxgloveConnection";
import { normalizeImage, type RosImage } from "../core/image";
import { parsePointCloud2 } from "../core/pointcloud";
import type { OccupancyGrid, PointCloud2 } from "../core/types";
import type {
  BatchItem,
  MainToWorker,
  MessagePayload,
  StreamStats,
  WorkerToMain,
} from "./protocol";

const FLUSH_WINDOW_MS = 4;
const STATS_INTERVAL_MS = 1000;
const POOL_MAX_BUFFERS = 24;
const POOL_MAX_BYTES = 128 * 1024 * 1024;

/** 只有"最新一帧有意义"的类型可以丢过期帧；TF 等必须全量保序送达 */
const LATEST_WINS = new Set([
  "sensor_msgs/msg/PointCloud2",
  "sensor_msgs/msg/LaserScan",
  "sensor_msgs/msg/Image",
  "sensor_msgs/msg/CompressedImage",
  "nav_msgs/msg/OccupancyGrid",
  "nav_msgs/msg/Path",
  "nav_msgs/msg/Odometry",
]);

let conn: FoxgloveConnection | undefined;
const unsubs = new Map<string, () => void>();

function post(msg: WorkerToMain, transfer: Transferable[] = []): void {
  (self as unknown as Worker).postMessage(msg, transfer);
}

// ---- 缓冲池 ----

const pool: ArrayBuffer[] = [];
let poolBytes = 0;

function poolAlloc(bytes: number): ArrayBuffer {
  // 取第一个够大的（池很小，线性扫描比排序结构更快）
  for (let i = 0; i < pool.length; i++) {
    if (pool[i].byteLength >= bytes) {
      const buf = pool[i];
      pool.splice(i, 1);
      poolBytes -= buf.byteLength;
      return buf;
    }
  }
  // 超配 25% 减少尺寸波动导致的池失效
  return new ArrayBuffer(Math.ceil(bytes * 1.25));
}

function poolRecycle(buffers: ArrayBuffer[]): void {
  for (const buf of buffers) {
    if (buf.byteLength === 0) continue; // 已被转移的空壳
    if (pool.length >= POOL_MAX_BUFFERS || poolBytes + buf.byteLength > POOL_MAX_BYTES) break;
    pool.push(buf);
    poolBytes += buf.byteLength;
  }
}

// ---- 合帧队列 ----

interface Pending {
  schemaName: string;
  message: unknown;
}

/** latest-wins 话题：每 topic 只留最新 */
const pendingLatest = new Map<string, Pending>();
/** 保序话题（TF）：全量排队 */
const pendingOrdered: Array<Pending & { topic: string }> = [];
let flushTimer: ReturnType<typeof setTimeout> | undefined;

function preparePayload(schemaName: string, message: unknown): {
  payload: MessagePayload;
  transfer: Transferable[];
} {
  if (schemaName === "sensor_msgs/msg/PointCloud2") {
    const msg = message as PointCloud2;
    const cloud = parsePointCloud2(msg, undefined, poolAlloc);
    const transfer: Transferable[] = [cloud.positions.buffer];
    if (cloud.colorValues) transfer.push(cloud.colorValues.buffer);
    return { payload: { kind: "cloud", header: msg.header, cloud }, transfer };
  }
  if (schemaName === "nav_msgs/msg/OccupancyGrid") {
    const msg = message as OccupancyGrid;
    // data 是整条 CDR buffer 上的视图，拷入池缓冲再转移
    const data = new Int8Array(poolAlloc(msg.data.byteLength), 0, msg.data.length);
    data.set(msg.data);
    return {
      payload: { kind: "grid", header: msg.header, info: msg.info, data },
      transfer: [data.buffer],
    };
  }
  if (schemaName === "sensor_msgs/msg/Image") {
    const msg = normalizeImage(message as RosImage);
    const data = msg.data;
    if (!(data.buffer instanceof ArrayBuffer)) {
      throw new Error("image data is not backed by a transferable ArrayBuffer");
    }
    return {
      payload: {
        kind: "image",
        header: msg.header,
        width: msg.width,
        height: msg.height,
        encoding: msg.encoding,
        step: msg.step,
        is_bigendian: msg.is_bigendian,
        data,
      },
      transfer: [data.buffer],
    };
  }
  if (schemaName === "sensor_msgs/msg/CompressedImage") {
    const msg = message as {
      header: import("../core/types").Header;
      format: string;
      data: Uint8Array;
    };
    const data = msg.data;
    if (!(data.buffer instanceof ArrayBuffer)) {
      throw new Error("compressed image data is not backed by a transferable ArrayBuffer");
    }
    return {
      payload: { kind: "compressed_image", header: msg.header, format: msg.format, data },
      transfer: [data.buffer],
    };
  }
  return { payload: { kind: "raw", message }, transfer: [] };
}

function flush(): void {
  flushTimer = undefined;
  if (pendingLatest.size === 0 && pendingOrdered.length === 0) return;

  const items: BatchItem[] = [];
  const transfer: Transferable[] = [];

  for (const p of pendingOrdered) {
    items.push({ topic: p.topic, schemaName: p.schemaName, payload: { kind: "raw", message: p.message } });
  }
  pendingOrdered.length = 0;

  for (const [topic, p] of pendingLatest) {
    // 单条消息解析失败（畸形数据）只丢这一条，不影响同批其他话题
    try {
      const { payload, transfer: t } = preparePayload(p.schemaName, p.message);
      items.push({ topic, schemaName: p.schemaName, payload });
      transfer.push(...t);
    } catch (err) {
      statDrop(topic);
      post({ type: "error", message: `${topic} 负载解析失败（已丢弃该帧）: ${String(err)}` });
    }
  }
  pendingLatest.clear();

  post({ type: "batch", items }, transfer);
}

function enqueue(topic: string, schemaName: string, message: unknown): void {
  if (LATEST_WINS.has(schemaName)) {
    if (pendingLatest.has(topic)) statDrop(topic); // 覆盖即丢过期帧
    pendingLatest.set(topic, { schemaName, message });
  } else {
    pendingOrdered.push({ topic, schemaName, message });
  }
  flushTimer ??= setTimeout(flush, FLUSH_WINDOW_MS);
}

// ---- 统计与滞后估计 ----

interface StatAcc {
  count: number;
  bytes: number;
  decodedCount: number;
  decodeMs: number;
  drops: number;
  /** EWMA 平滑后的速率（低频话题在短统计窗内跳动） */
  hzEwma: number;
  kbpsEwma: number;
}

const statAcc = new Map<string, StatAcc>();
/** 本地时钟 - 服务端时间戳 的最小值 ≈ 时钟偏移 + 最小路径延迟（基线） */
let clockOffsetBaseline = Infinity;
let lagMaxMs = 0;

function stat(topic: string): StatAcc {
  let s = statAcc.get(topic);
  if (!s) {
    s = { count: 0, bytes: 0, decodedCount: 0, decodeMs: 0, drops: 0, hzEwma: 0, kbpsEwma: 0 };
    statAcc.set(topic, s);
  }
  return s;
}

function statDrop(topic: string): void {
  stat(topic).drops++;
}

setInterval(() => {
  if (statAcc.size === 0 && !Number.isFinite(clockOffsetBaseline)) return;
  const factor = 1000 / STATS_INTERVAL_MS;
  const stats: StreamStats = {
    topics: {},
    lagMs: Math.round(lagMaxMs),
    totalKbps: 0,
    totalHz: 0,
    totalDropsPerSec: 0,
  };
  for (const [topic, s] of statAcc) {
    s.hzEwma = s.hzEwma * 0.7 + s.count * factor * 0.3;
    s.kbpsEwma = s.kbpsEwma * 0.7 + (s.bytes * factor * 0.3) / 1024;
    const t = {
      hz: s.hzEwma,
      kbps: s.kbpsEwma,
      dropsPerSec: s.drops * factor,
      decodeMs: s.decodedCount > 0 ? s.decodeMs / s.decodedCount : 0,
    };
    stats.topics[topic] = t;
    stats.totalKbps += t.kbps;
    stats.totalHz += t.hz;
    stats.totalDropsPerSec += t.dropsPerSec;
    s.count = 0;
    s.bytes = 0;
    s.decodedCount = 0;
    s.decodeMs = 0;
    s.drops = 0;
  }
  lagMaxMs = 0;
  // 基线缓慢上浮，适应时钟漂移（约 1ms/s）
  if (Number.isFinite(clockOffsetBaseline)) clockOffsetBaseline += 0.5;
  post({ type: "stats", stats });
}, STATS_INTERVAL_MS);

// ---- 订阅与生命周期 ----

function handleSubscribe(topic: string, maxFrequency?: number): void {
  if (!conn || unsubs.has(topic)) return;
  const unsub = conn.subscribe(topic, (message, channel) => {
    enqueue(topic, channel.schemaName, message);
  }, { maxFrequency });
  unsubs.set(topic, unsub);
}

self.onmessage = (ev: MessageEvent<MainToWorker>) => {
  const msg = ev.data;
  switch (msg.type) {
    case "connect": {
      conn?.close();
      unsubs.clear();
      pendingLatest.clear();
      pendingOrdered.length = 0;
      statAcc.clear();
      clockOffsetBaseline = Infinity;
      try {
        conn = new FoxgloveConnection(msg.url, {
          onStateChange: (state) => post({ type: "state", state }),
          onChannels: (topics) => post({ type: "channels", topics }),
          onServices: (services) => post({ type: "services", services }),
          onError: (err) => post({ type: "error", message: err.message }),
          onMessageMeta: ({ topic, bytes, decodeMs, decoded, serverTimeNs }) => {
            const s = stat(topic);
            s.count++;
            s.bytes += bytes;
            if (decoded) {
              s.decodedCount++;
              s.decodeMs += decodeMs;
            } else {
              s.drops++;
            }
            const deltaMs = Date.now() - Number(serverTimeNs / 1_000_000n);
            if (deltaMs < clockOffsetBaseline) clockOffsetBaseline = deltaMs;
            const lag = deltaMs - clockOffsetBaseline;
            if (lag > lagMaxMs) lagMaxMs = lag;
          },
        });
      } catch (err) {
        post({ type: "error", message: err instanceof Error ? err.message : String(err) });
        post({ type: "state", state: "closed" });
      }
      break;
    }
    case "subscribe":
      handleSubscribe(msg.topic, msg.maxFrequency);
      break;
    case "unsubscribe": {
      unsubs.get(msg.topic)?.();
      unsubs.delete(msg.topic);
      break;
    }
    case "publish":
      try {
        if (!conn) throw new Error("not connected");
        conn.publish(msg.topic, msg.schemaName, msg.message);
      } catch (err) {
        post({ type: "error", message: `publish ${msg.topic}: ${String(err)}` });
      }
      break;
    case "callService": {
      const { id, name, request } = msg;
      if (!conn) {
        post({ type: "serviceResult", id, ok: false, error: "not connected" });
        break;
      }
      conn
        .callService(name, request, { timeoutMs: msg.timeoutMs })
        .then((response) => post({ type: "serviceResult", id, ok: true, response }))
        .catch((err: Error) => post({ type: "serviceResult", id, ok: false, error: err.message }));
      break;
    }
    case "recycle":
      poolRecycle(msg.buffers);
      break;
  }
};

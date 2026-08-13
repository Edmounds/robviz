/** 主线程 ↔ 连接 Worker 的消息协议 */
import type { ConnectionState, ServiceInfo, TopicInfo } from "../core/FoxgloveConnection";
import type { ParsedCloud } from "../core/pointcloud";
import type { Header } from "../core/types";

export type MainToWorker =
  | { type: "connect"; url: string }
  | { type: "subscribe"; topic: string }
  | { type: "unsubscribe"; topic: string }
  /** 客户端发布（schemaName 须在 PUB_SCHEMAS 内） */
  | { type: "publish"; topic: string; schemaName: string; message: unknown }
  /** 服务调用，结果以 serviceResult(id) 返回 */
  | { type: "callService"; id: number; name: string; request: unknown }
  /** 主线程消费完大缓冲后归还 Worker 复用（零分配循环） */
  | { type: "recycle"; buffers: ArrayBuffer[] };

/** PointCloud2 在 Worker 内完成字段解析，主线程零遍历 */
export interface CloudPayload {
  kind: "cloud";
  header: Header;
  cloud: ParsedCloud;
}

/** OccupancyGrid 的 data 拷贝为独立紧凑 buffer 以便 Transferable */
export interface GridPayload {
  kind: "grid";
  header: Header;
  info: import("../core/types").MapMetaData;
  data: Int8Array;
}

/** raw Image：data 拷贝为独立紧凑 buffer 以便 Transferable */
export interface ImagePayload {
  kind: "image";
  header: Header;
  width: number;
  height: number;
  encoding: string;
  step: number;
  data: Uint8Array;
}

/** CompressedImage：jpeg/png 原始字节 */
export interface CompressedImagePayload {
  kind: "compressed_image";
  header: Header;
  format: string;
  data: Uint8Array;
}

export interface RawPayload {
  kind: "raw";
  message: unknown;
}

export type MessagePayload =
  | CloudPayload
  | GridPayload
  | ImagePayload
  | CompressedImagePayload
  | RawPayload;

export interface BatchItem {
  topic: string;
  schemaName: string;
  payload: MessagePayload;
}

export interface TopicStats {
  hz: number;
  kbps: number;
  /** 因合并（latest-wins）被丢弃的过期帧速率 */
  dropsPerSec: number;
  /** 解码平均耗时 ms */
  decodeMs: number;
}

export interface StreamStats {
  topics: Record<string, TopicStats>;
  /** 相对滞后估计（ms）：网络/服务端排队造成的延迟增量，0 = 理想 */
  lagMs: number;
  totalKbps: number;
  totalHz: number;
  totalDropsPerSec: number;
}

export type WorkerToMain =
  | { type: "state"; state: ConnectionState }
  | { type: "channels"; topics: TopicInfo[] }
  | { type: "services"; services: ServiceInfo[] }
  | { type: "serviceResult"; id: number; ok: boolean; response?: unknown; error?: string }
  | { type: "error"; message: string }
  /** 一个合并窗口内的全部消息（高频小消息合帧，大消息 latest-wins） */
  | { type: "batch"; items: BatchItem[] }
  | { type: "stats"; stats: StreamStats };

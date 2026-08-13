/**
 * PCD 文件解析 Worker：大文件（Mid-360/Point-LIO 建图产物，千万点级）
 * 的解析与体素降采样全部离开主线程，结果 Transferable 零拷贝返回。
 */
import { parsePcd, voxelDownsample } from "../core/pcd";

export type PcdWorkerRequest = {
  type: "parse";
  buffer: ArrayBuffer;
  /** 体素边长（米），0 = 不降采样 */
  voxel: number;
};

export type PcdWorkerResponse =
  | { type: "progress"; stage: string }
  | {
      type: "result";
      count: number;
      /** 降采样前原始点数 */
      rawCount: number;
      positions: Float32Array;
      intensity?: Float32Array;
      parseMs: number;
    }
  | { type: "error"; message: string };

const post = (msg: PcdWorkerResponse, transfer?: Transferable[]) =>
  (self as unknown as Worker).postMessage(msg, transfer ?? []);

self.onmessage = (ev: MessageEvent<PcdWorkerRequest>) => {
  const { buffer, voxel } = ev.data;
  try {
    const t0 = performance.now();
    post({ type: "progress", stage: "解析中" });
    const raw = parsePcd(buffer);
    let cloud = raw;
    if (voxel > 0) {
      post({ type: "progress", stage: "降采样中" });
      cloud = voxelDownsample(raw, voxel);
    }
    const transfer: Transferable[] = [cloud.positions.buffer];
    if (cloud.intensity) transfer.push(cloud.intensity.buffer);
    post(
      {
        type: "result",
        count: cloud.count,
        rawCount: raw.count,
        positions: cloud.positions,
        intensity: cloud.intensity,
        parseMs: Math.round(performance.now() - t0),
      },
      transfer,
    );
  } catch (err) {
    post({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};

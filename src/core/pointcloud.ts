import type { PointCloud2 } from "./types";

/** sensor_msgs/PointField datatype 常量 */
const INT8 = 1, UINT8 = 2, INT16 = 3, UINT16 = 4, INT32 = 5, UINT32 = 6, FLOAT32 = 7, FLOAT64 = 8;

export interface ParsedCloud {
  count: number;
  /** xyz 连续排布，长度 count*3 */
  positions: Float32Array;
  /** 着色标量（如 intensity），可能不存在 */
  colorValues?: Float32Array;
  colorField?: string;
  colorMin: number;
  colorMax: number;
  zMin: number;
  zMax: number;
}

function readerFor(datatype: number): (view: DataView, offset: number) => number {
  switch (datatype) {
    case INT8: return (v, o) => v.getInt8(o);
    case UINT8: return (v, o) => v.getUint8(o);
    case INT16: return (v, o) => v.getInt16(o, true);
    case UINT16: return (v, o) => v.getUint16(o, true);
    case INT32: return (v, o) => v.getInt32(o, true);
    case UINT32: return (v, o) => v.getUint32(o, true);
    case FLOAT32: return (v, o) => v.getFloat32(o, true);
    case FLOAT64: return (v, o) => v.getFloat64(o, true);
    default: throw new Error(`unknown PointField datatype ${datatype}`);
  }
}

/** 优先用于着色的字段，按序取第一个存在的 */
const COLOR_FIELD_PRIORITY = ["intensity", "ring", "z"];

/** 输出缓冲分配器：接入缓冲池时由调用方提供（返回的 buffer 可大于请求） */
export type BufferAlloc = (bytes: number) => ArrayBuffer;

const defaultAlloc: BufferAlloc = (bytes) => new ArrayBuffer(bytes);

/**
 * PointCloud2 → 渲染就绪的 TypedArray。设计为在 Worker 内执行，
 * 产物 Transferable 到主线程，主线程零遍历。
 *
 * 快路径：x/y/z 为连续 FLOAT32（绝大多数激光雷达驱动的布局）时按行拷贝。
 */
export function parsePointCloud2(
  msg: PointCloud2,
  colorField?: string,
  alloc: BufferAlloc = defaultAlloc,
): ParsedCloud {
  const { fields, point_step, width, height, data } = msg;
  const count = width * height;
  const positions = new Float32Array(alloc(count * 12), 0, count * 3);

  const fx = fields.find((f) => f.name === "x");
  const fy = fields.find((f) => f.name === "y");
  const fz = fields.find((f) => f.name === "z");
  if (!fx || !fy || !fz) throw new Error("PointCloud2 missing x/y/z fields");
  if (msg.is_bigendian) throw new Error("big-endian PointCloud2 not supported");

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  const fastPath =
    fx.datatype === FLOAT32 && fy.datatype === FLOAT32 && fz.datatype === FLOAT32 &&
    fy.offset === fx.offset + 4 && fz.offset === fx.offset + 8 &&
    // Float32Array 视图要求 4 字节对齐
    (data.byteOffset + fx.offset) % 4 === 0 && point_step % 4 === 0;

  if (fastPath) {
    const f32 = new Float32Array(data.buffer, data.byteOffset, data.byteLength >> 2);
    const stride = point_step >> 2;
    const base = fx.offset >> 2;
    for (let i = 0; i < count; i++) {
      const s = i * stride + base;
      const d = i * 3;
      positions[d] = f32[s];
      positions[d + 1] = f32[s + 1];
      positions[d + 2] = f32[s + 2];
    }
  } else {
    const rx = readerFor(fx.datatype);
    const ry = readerFor(fy.datatype);
    const rz = readerFor(fz.datatype);
    for (let i = 0; i < count; i++) {
      const s = i * point_step;
      const d = i * 3;
      positions[d] = rx(view, s + fx.offset);
      positions[d + 1] = ry(view, s + fy.offset);
      positions[d + 2] = rz(view, s + fz.offset);
    }
  }

  let zMin = Infinity;
  let zMax = -Infinity;
  for (let i = 2; i < positions.length; i += 3) {
    const z = positions[i];
    if (!Number.isFinite(z)) continue;
    zMin = Math.min(zMin, z);
    zMax = Math.max(zMax, z);
  }
  if (!Number.isFinite(zMin) || zMin === zMax) {
    zMin = 0;
    zMax = 1;
  }

  // 着色字段
  const wanted = colorField
    ? [colorField, ...COLOR_FIELD_PRIORITY]
    : COLOR_FIELD_PRIORITY;
  const cf = wanted
    .map((name) => fields.find((f) => f.name === name))
    .find((f) => f !== undefined);

  let colorValues: Float32Array | undefined;
  let colorMin = 0;
  let colorMax = 1;
  if (cf) {
    colorValues = new Float32Array(alloc(count * 4), 0, count);
    if (cf.name === "z") {
      for (let i = 0; i < count; i++) colorValues[i] = positions[i * 3 + 2];
    } else {
      const rc = readerFor(cf.datatype);
      for (let i = 0; i < count; i++) {
        colorValues[i] = rc(view, i * point_step + cf.offset);
      }
    }
    colorMin = Infinity;
    colorMax = -Infinity;
    for (let i = 0; i < count; i++) {
      const v = colorValues[i];
      if (Number.isFinite(v)) {
        if (v < colorMin) colorMin = v;
        if (v > colorMax) colorMax = v;
      }
    }
    if (!Number.isFinite(colorMin) || colorMin === colorMax) {
      colorMin = 0;
      colorMax = 1;
    }
  }

  return { count, positions, colorValues, colorField: cf?.name, colorMin, colorMax, zMin, zMax };
}

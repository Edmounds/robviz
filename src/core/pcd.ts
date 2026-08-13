/**
 * PCD 文件解析/序列化。支持 ascii、binary、binary_compressed（LZF + SoA 布局）。
 * 设计为在 Worker 内解析大文件（Point-LIO/FAST-LIO 建图产物常为千万点级）。
 */

export interface PcdField {
  name: string;
  size: number; // 字节
  type: "F" | "I" | "U";
  count: number;
}

export interface PcdHeader {
  fields: PcdField[];
  width: number;
  height: number;
  points: number;
  data: "ascii" | "binary" | "binary_compressed";
  /** 头部结束（数据起始）偏移 */
  dataOffset: number;
}

export interface PcdCloud {
  count: number;
  positions: Float32Array; // xyz 连续
  /** intensity（无则 undefined） */
  intensity?: Float32Array;
}

// ---- LZF 解压（PCL binary_compressed 使用的算法） ----

export function lzfDecompress(input: Uint8Array, outputLength: number): Uint8Array {
  const out = new Uint8Array(outputLength);
  let i = 0;
  let o = 0;
  const inLen = input.length;
  while (i < inLen) {
    const ctrl = input[i++];
    if (ctrl < 32) {
      // 字面量：ctrl+1 字节
      const len = ctrl + 1;
      out.set(input.subarray(i, i + len), o);
      i += len;
      o += len;
    } else {
      // 回溯引用
      let len = ctrl >> 5;
      if (len === 7) len += input[i++];
      len += 2;
      let ref = o - ((ctrl & 0x1f) << 8) - input[i++] - 1;
      // 引用区间可与输出区间重叠（RLE 式），必须逐字节
      while (len-- > 0) out[o++] = out[ref++];
    }
  }
  if (o !== outputLength) {
    throw new Error(`LZF: expected ${outputLength} bytes, got ${o}`);
  }
  return out;
}

// ---- 头部解析 ----

export function parsePcdHeader(buffer: ArrayBuffer): PcdHeader {
  // 头部是 ASCII 行，逐行读到 DATA 行为止
  const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 4096));
  const text = new TextDecoder("ascii").decode(bytes);

  const header: Partial<PcdHeader> = {};
  let names: string[] = [];
  let sizes: number[] = [];
  let types: string[] = [];
  let counts: number[] = [];
  let offset = 0;

  for (const lineRaw of text.split("\n")) {
    const lineEnd = offset + lineRaw.length + 1;
    const line = lineRaw.trim();
    if (line.length > 0 && !line.startsWith("#")) {
      const [key, ...rest] = line.split(/\s+/);
      switch (key) {
        case "FIELDS":
          names = rest;
          break;
        case "SIZE":
          sizes = rest.map(Number);
          break;
        case "TYPE":
          types = rest;
          break;
        case "COUNT":
          counts = rest.map(Number);
          break;
        case "WIDTH":
          header.width = Number(rest[0]);
          break;
        case "HEIGHT":
          header.height = Number(rest[0]);
          break;
        case "POINTS":
          header.points = Number(rest[0]);
          break;
        case "DATA":
          header.data = rest[0] as PcdHeader["data"];
          header.dataOffset = lineEnd;
          break;
      }
    }
    offset = lineEnd;
    if (header.data) break;
  }

  if (!header.data || names.length === 0) throw new Error("invalid PCD header");
  header.points ??= (header.width ?? 0) * (header.height ?? 1);
  header.fields = names.map((name, i) => ({
    name,
    size: sizes[i] ?? 4,
    type: (types[i] ?? "F") as PcdField["type"],
    count: counts[i] ?? 1,
  }));
  return header as PcdHeader;
}

// ---- 数值读取器 ----

function readerFor(type: string, size: number): (v: DataView, o: number) => number {
  if (type === "F" && size === 4) return (v, o) => v.getFloat32(o, true);
  if (type === "F" && size === 8) return (v, o) => v.getFloat64(o, true);
  if (type === "U" && size === 1) return (v, o) => v.getUint8(o);
  if (type === "U" && size === 2) return (v, o) => v.getUint16(o, true);
  if (type === "U" && size === 4) return (v, o) => v.getUint32(o, true);
  if (type === "I" && size === 1) return (v, o) => v.getInt8(o);
  if (type === "I" && size === 2) return (v, o) => v.getInt16(o, true);
  if (type === "I" && size === 4) return (v, o) => v.getInt32(o, true);
  throw new Error(`unsupported PCD field type ${type}${size}`);
}

// ---- 主解析 ----

export function parsePcd(buffer: ArrayBuffer): PcdCloud {
  const header = parsePcdHeader(buffer);
  const { fields, points, data, dataOffset } = header;

  const ix = fields.findIndex((f) => f.name === "x");
  const iy = fields.findIndex((f) => f.name === "y");
  const iz = fields.findIndex((f) => f.name === "z");
  const ii = fields.findIndex((f) => f.name === "intensity");
  if (ix < 0 || iy < 0 || iz < 0) throw new Error("PCD missing x/y/z fields");

  const positions = new Float32Array(points * 3);
  const intensity = ii >= 0 ? new Float32Array(points) : undefined;

  if (data === "ascii") {
    const text = new TextDecoder("ascii").decode(new Uint8Array(buffer, dataOffset));
    let p = 0;
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (t.length === 0) continue;
      const parts = t.split(/\s+/);
      positions[p * 3] = Number(parts[ix]);
      positions[p * 3 + 1] = Number(parts[iy]);
      positions[p * 3 + 2] = Number(parts[iz]);
      if (intensity) intensity[p] = Number(parts[ii]);
      if (++p >= points) break;
    }
    return { count: p, positions, intensity };
  }

  if (data === "binary") {
    // AoS：逐点记录
    const pointStep = fields.reduce((s, f) => s + f.size * f.count, 0);
    const offsets: number[] = [];
    let acc = 0;
    for (const f of fields) {
      offsets.push(acc);
      acc += f.size * f.count;
    }
    const view = new DataView(buffer, dataOffset);
    const rx = readerFor(fields[ix].type, fields[ix].size);
    const ry = readerFor(fields[iy].type, fields[iy].size);
    const rz = readerFor(fields[iz].type, fields[iz].size);
    const ri = ii >= 0 ? readerFor(fields[ii].type, fields[ii].size) : undefined;

    // 快路径：x/y/z 连续 float32（PCL 默认布局）。
    // 头部长度不定导致数据区可能未 4 字节对齐，此时一次拷贝换取对齐（远快于逐点 DataView）
    const fast =
      fields[ix].type === "F" && fields[ix].size === 4 &&
      offsets[iy] === offsets[ix] + 4 && offsets[iz] === offsets[ix] + 8 &&
      pointStep % 4 === 0;
    if (fast) {
      const aligned = dataOffset % 4 === 0 ? buffer : buffer.slice(dataOffset);
      const alignedOffset = dataOffset % 4 === 0 ? dataOffset : 0;
      const f32 = new Float32Array(aligned, alignedOffset, Math.floor((aligned.byteLength - alignedOffset) / 4));
      const stride = pointStep >> 2;
      const base = offsets[ix] >> 2;
      for (let p = 0; p < points; p++) {
        const s = p * stride + base;
        positions[p * 3] = f32[s];
        positions[p * 3 + 1] = f32[s + 1];
        positions[p * 3 + 2] = f32[s + 2];
      }
    } else {
      for (let p = 0; p < points; p++) {
        const s = p * pointStep;
        positions[p * 3] = rx(view, s + offsets[ix]);
        positions[p * 3 + 1] = ry(view, s + offsets[iy]);
        positions[p * 3 + 2] = rz(view, s + offsets[iz]);
      }
    }
    if (intensity && ri) {
      for (let p = 0; p < points; p++) {
        intensity[p] = ri(view, p * pointStep + offsets[ii]);
      }
    }
    return { count: points, positions, intensity };
  }

  // binary_compressed：uint32 压缩长度 + uint32 原始长度 + LZF 数据；
  // 解压后是 SoA（按字段分块：全部 x，再全部 y……）
  const head = new DataView(buffer, dataOffset, 8);
  const compressedSize = head.getUint32(0, true);
  const uncompressedSize = head.getUint32(4, true);
  const raw = lzfDecompress(
    new Uint8Array(buffer, dataOffset + 8, compressedSize),
    uncompressedSize,
  );
  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);

  const fieldBlockOffsets: number[] = [];
  let acc = 0;
  for (const f of fields) {
    fieldBlockOffsets.push(acc);
    acc += f.size * f.count * points;
  }

  const readColumn = (fi: number, out: Float32Array, stride: number, base: number) => {
    const f = fields[fi];
    const r = readerFor(f.type, f.size);
    const off = fieldBlockOffsets[fi];
    if (f.type === "F" && f.size === 4 && (raw.byteOffset + off) % 4 === 0) {
      const col = new Float32Array(raw.buffer, raw.byteOffset + off, points);
      for (let p = 0; p < points; p++) out[p * stride + base] = col[p];
    } else {
      for (let p = 0; p < points; p++) out[p * stride + base] = r(view, off + p * f.size);
    }
  };

  readColumn(ix, positions, 3, 0);
  readColumn(iy, positions, 3, 1);
  readColumn(iz, positions, 3, 2);
  if (intensity && ii >= 0) readColumn(ii, intensity, 1, 0);
  return { count: points, positions, intensity };
}

// ---- 体素降采样（每体素保留首点，可视化足够且省一次除法归约） ----

export function voxelDownsample(cloud: PcdCloud, voxelSize: number): PcdCloud {
  if (voxelSize <= 0) return cloud;
  const { count, positions, intensity } = cloud;
  const inv = 1 / voxelSize;
  // 17bit/轴（±6.5 万格），key 打包进 float64 精确整数范围
  const HALF = 1 << 16;
  const seen = new Set<number>();
  const outPos = new Float32Array(count * 3);
  const outInt = intensity ? new Float32Array(count) : undefined;
  let n = 0;
  for (let p = 0; p < count; p++) {
    const x = positions[p * 3];
    const y = positions[p * 3 + 1];
    const z = positions[p * 3 + 2];
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
    const kx = Math.floor(x * inv) + HALF;
    const ky = Math.floor(y * inv) + HALF;
    const kz = Math.floor(z * inv) + HALF;
    const key = (kx * 131072 + ky) * 131072 + kz;
    if (seen.has(key)) continue;
    seen.add(key);
    outPos[n * 3] = x;
    outPos[n * 3 + 1] = y;
    outPos[n * 3 + 2] = z;
    if (outInt && intensity) outInt[n] = intensity[p];
    n++;
  }
  return {
    count: n,
    positions: outPos.slice(0, n * 3),
    intensity: outInt?.slice(0, n),
  };
}

// ---- 序列化（binary，x y z [intensity]） ----

export function serializePcdBinary(cloud: PcdCloud): ArrayBuffer {
  const { count, positions, intensity } = cloud;
  const hasI = intensity !== undefined;
  const header =
    `# .PCD v0.7 - Point Cloud Data file format\nVERSION 0.7\n` +
    `FIELDS x y z${hasI ? " intensity" : ""}\n` +
    `SIZE 4 4 4${hasI ? " 4" : ""}\n` +
    `TYPE F F F${hasI ? " F" : ""}\n` +
    `COUNT 1 1 1${hasI ? " 1" : ""}\n` +
    `WIDTH ${count}\nHEIGHT 1\nVIEWPOINT 0 0 0 1 0 0 0\nPOINTS ${count}\nDATA binary\n`;
  const headerBytes = new TextEncoder().encode(header);
  const stride = hasI ? 16 : 12;
  const strideF = stride >> 2;
  // 头部长度不保证 4 字节对齐，数据区单独填充后拼接
  const f32 = new Float32Array(count * strideF);
  for (let p = 0; p < count; p++) {
    const d = p * strideF;
    f32[d] = positions[p * 3];
    f32[d + 1] = positions[p * 3 + 1];
    f32[d + 2] = positions[p * 3 + 2];
    if (hasI && intensity) f32[d + 3] = intensity[p];
  }
  const out = new ArrayBuffer(headerBytes.length + count * stride);
  const u8 = new Uint8Array(out);
  u8.set(headerBytes);
  u8.set(new Uint8Array(f32.buffer), headerBytes.length);
  return out;
}

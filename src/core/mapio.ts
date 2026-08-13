/**
 * ROS map_server 格式（PGM + YAML）读写，供 2D 地图编辑器使用。
 * 栅格值语义与 nav_msgs/OccupancyGrid 一致：0 自由，100 占用，-1 未知。
 */

export interface MapMeta {
  resolution: number;
  origin: [number, number, number]; // x, y, yaw
  negate: number;
  occupiedThresh: number;
  freeThresh: number;
}

export interface EditableMap {
  width: number;
  height: number;
  /** 行主序，行 0 = 地图 y 最小行（与 OccupancyGrid 一致） */
  data: Int8Array;
  meta: MapMeta;
}

const DEFAULT_META: MapMeta = {
  resolution: 0.05,
  origin: [0, 0, 0],
  negate: 0,
  occupiedThresh: 0.65,
  freeThresh: 0.196,
};

// map_saver 的标准像素值
const PX_FREE = 254;
const PX_OCCUPIED = 0;
const PX_UNKNOWN = 205;

/** 解析 map_server 的 YAML（只取我们需要的键，不引入 YAML 库） */
export function parseMapYaml(text: string): { image: string; meta: MapMeta } {
  const meta = { ...DEFAULT_META };
  let image = "";
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([a-z_]+)\s*:\s*(.+?)\s*$/);
    if (!m) continue;
    const [, key, value] = m;
    switch (key) {
      case "image":
        image = value;
        break;
      case "resolution":
        meta.resolution = Number(value);
        break;
      case "origin": {
        const nums = value.replace(/[[\]]/g, "").split(",").map(Number);
        meta.origin = [nums[0] ?? 0, nums[1] ?? 0, nums[2] ?? 0];
        break;
      }
      case "negate":
        meta.negate = Number(value);
        break;
      case "occupied_thresh":
        meta.occupiedThresh = Number(value);
        break;
      case "free_thresh":
        meta.freeThresh = Number(value);
        break;
    }
  }
  return { image, meta };
}

export function serializeMapYaml(imageName: string, meta: MapMeta): string {
  return (
    `image: ${imageName}\n` +
    `resolution: ${meta.resolution}\n` +
    `origin: [${meta.origin[0]}, ${meta.origin[1]}, ${meta.origin[2]}]\n` +
    `negate: ${meta.negate}\n` +
    `occupied_thresh: ${meta.occupiedThresh}\n` +
    `free_thresh: ${meta.freeThresh}\n`
  );
}

/**
 * 解析 PGM（P5 二进制 / P2 文本）→ 占用栅格。
 * PGM 行 0 在图像顶部 = 地图 y 最大行，需要垂直翻转到 OccupancyGrid 行序。
 */
export function parsePgm(buffer: ArrayBuffer, meta: MapMeta): EditableMap {
  const bytes = new Uint8Array(buffer);
  // 头部：magic、宽高、maxval，允许 # 注释
  let pos = 0;
  const readToken = (): string => {
    // 跳过空白与注释
    for (;;) {
      while (pos < bytes.length && /\s/.test(String.fromCharCode(bytes[pos]))) pos++;
      if (bytes[pos] === 0x23 /* # */) {
        while (pos < bytes.length && bytes[pos] !== 0x0a) pos++;
      } else break;
    }
    const start = pos;
    while (pos < bytes.length && !/\s/.test(String.fromCharCode(bytes[pos]))) pos++;
    return new TextDecoder("ascii").decode(bytes.subarray(start, pos));
  };

  const magic = readToken();
  if (magic !== "P5" && magic !== "P2") throw new Error(`not a PGM file (${magic})`);
  const width = Number(readToken());
  const height = Number(readToken());
  const maxval = Number(readToken());
  pos++; // maxval 后单个空白

  const data = new Int8Array(width * height);
  const px = (v: number): number => {
    // map_server 语义：occ = (255 - v) / 255（negate=0）
    const p = meta.negate ? v : maxval - v;
    const occ = p / maxval;
    if (occ > meta.occupiedThresh) return 100;
    if (occ < meta.freeThresh) return 0;
    return -1;
  };

  if (magic === "P5") {
    for (let row = 0; row < height; row++) {
      const gridRow = height - 1 - row; // 垂直翻转
      const src = pos + row * width;
      const dst = gridRow * width;
      for (let c = 0; c < width; c++) data[dst + c] = px(bytes[src + c]);
    }
  } else {
    for (let row = 0; row < height; row++) {
      const gridRow = height - 1 - row;
      const dst = gridRow * width;
      for (let c = 0; c < width; c++) data[dst + c] = px(Number(readToken()));
    }
  }

  return { width, height, data, meta };
}

/** 占用栅格 → PGM P5（map_saver 标准像素值） */
export function serializePgm(map: EditableMap): ArrayBuffer {
  const { width, height, data } = map;
  const header = new TextEncoder().encode(`P5\n${width} ${height}\n255\n`);
  const out = new Uint8Array(header.length + width * height);
  out.set(header);
  for (let row = 0; row < height; row++) {
    const gridRow = height - 1 - row;
    const src = gridRow * width;
    const dst = header.length + row * width;
    for (let c = 0; c < width; c++) {
      const v = data[src + c];
      out[dst + c] = v === 100 ? PX_OCCUPIED : v === 0 ? PX_FREE : PX_UNKNOWN;
    }
  }
  return out.buffer;
}

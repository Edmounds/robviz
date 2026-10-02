import type { Header } from "./types";

// canonical encoding, bytes per pixel, bytes per component
const IMAGE_FORMATS: Record<string, readonly [string, number, number]> = {
  rgb8: ["rgb8", 3, 1], bgr8: ["bgr8", 3, 1],
  rgba8: ["rgba8", 4, 1], bgra8: ["bgra8", 4, 1],
  mono8: ["mono8", 1, 1], "8uc1": ["8UC1", 1, 1],
  mono16: ["mono16", 2, 2], "16uc1": ["16UC1", 2, 2],
  "32fc1": ["32FC1", 4, 4],
};

export interface RosImage {
  header: Header;
  width: number;
  height: number;
  encoding: string;
  step: number;
  is_bigendian: boolean | number;
  data: Uint8Array;
}

/** 网关只处理彩色视频；只有已识别的灰度/深度编码可自动选择 Raw。 */
export function requiresRawImage(encoding: string): boolean {
  return ["mono8", "8uc1", "mono16", "16uc1", "32fc1"].includes(encoding.toLowerCase());
}

/** Worker 内统一校验并转成紧凑、小端图像，渲染和悬停使用同一份像素布局。 */
export function normalizeImage(msg: RosImage): RosImage & { is_bigendian: false } {
  const key = typeof msg.encoding === "string" ? msg.encoding.toLowerCase() : "";
  const format = Object.hasOwn(IMAGE_FORMATS, key) ? IMAGE_FORMATS[key] : undefined;
  if (!format) throw new Error(`unsupported image encoding: ${msg.encoding}`);
  const [encoding, pixelBytes, componentBytes] = format;
  const { width, height, step } = msg;
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
      width < 1 || height < 1 || width > 8192 || height > 8192) {
    throw new Error(`invalid image dimensions: ${width}x${height}`);
  }
  const rowBytes = width * pixelBytes;
  const maxBytes = 64 * 1024 * 1024;
  if (!Number.isSafeInteger(step) || step < rowBytes || step * height > maxBytes ||
      !(msg.data instanceof Uint8Array) || msg.data.byteLength < step * height) {
    throw new Error("image step/data length does not match dimensions or exceeds 64 MiB");
  }
  if (![false, true, 0, 1].includes(msg.is_bigendian)) {
    throw new Error("invalid image endianness");
  }
  const swap = Boolean(msg.is_bigendian) && componentBytes > 1;
  let data = msg.data.subarray(0, rowBytes * height);
  if (step !== rowBytes || swap) {
    data = new Uint8Array(rowBytes * height);
    for (let row = 0; row < height; row++) {
      data.set(msg.data.subarray(row * step, row * step + rowBytes), row * rowBytes);
    }
    if (swap) {
      for (let offset = 0; offset < data.length; offset += componentBytes) {
        for (let byte = 0; byte < componentBytes / 2; byte++) {
          const end = offset + componentBytes - 1 - byte;
          const value = data[offset + byte];
          data[offset + byte] = data[end];
          data[end] = value;
        }
      }
    }
  }
  return { header: msg.header, width, height, encoding, step: rowBytes, is_bigendian: false, data };
}

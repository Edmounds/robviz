import { describe, expect, it } from "vitest";
import { normalizeImage, requiresRawImage, type RosImage } from "../../src/core/image";

const header = { stamp: { sec: 1, nanosec: 0 }, frame_id: "camera" };
const image = (overrides: Partial<RosImage> = {}): RosImage => ({
  header, width: 2, height: 2, encoding: "rgb8", step: 8, is_bigendian: false,
  data: new Uint8Array([1, 2, 3, 4, 5, 6, 90, 91, 7, 8, 9, 10, 11, 12, 92, 93]),
  ...overrides,
});

describe("image normalization", () => {
  it("strips row padding into the common packed pixel layout", () => {
    const result = normalizeImage(image());
    expect(result.step).toBe(6);
    expect(Array.from(result.data)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(result.header).toBe(header);
  });

  it("retains the backing buffer for packed little-endian inputs, including offset views", () => {
    const buffer = new Uint8Array([99, 1, 2, 3, 4, 5, 6, 99]);
    const result = normalizeImage(image({ height: 1, step: 6, data: buffer.subarray(1, 7) }));
    expect(result.data.buffer).toBe(buffer.buffer);
    expect(Array.from(result.data)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("converts padded big-endian depth without modifying the source", () => {
    const source = image({ encoding: "16UC1", step: 6, is_bigendian: 1,
      data: new Uint8Array([3, 232, 7, 208, 99, 99, 11, 184, 15, 160, 99, 99]) });
    const result = normalizeImage(source);
    expect(result.step).toBe(4);
    expect(result.is_bigendian).toBe(false);
    const view = new DataView(result.data.buffer);
    expect([0, 2, 4, 6].map((offset) => view.getUint16(offset, true))).toEqual([1000, 2000, 3000, 4000]);
    expect(source.data[0]).toBe(3);
  });

  it("swaps 32-bit floats, canonicalizes encoding, and preserves NaN/invalid depth", () => {
    const data = new Uint8Array(16);
    const view = new DataView(data.buffer);
    [1.5, 0, NaN, -1].forEach((value, index) => view.setFloat32(index * 4, value, false));
    const result = normalizeImage(image({ encoding: "32fc1", step: 8, is_bigendian: true, data }));
    expect(result.encoding).toBe("32FC1");
    const pixels = new Float32Array(result.data.buffer);
    expect(Array.from(pixels)).toEqual([1.5, 0, NaN, -1]);
  });

  it.each([
    { width: 0 }, { height: -1 }, { width: 8193 }, { width: 1.5 },
    { step: 5 }, { step: NaN }, { step: 64 * 1024 * 1024 },
    { data: new Uint8Array(15) }, { is_bigendian: 2 },
    { encoding: "bayer_rggb8" }, { encoding: "constructor" },
  ])("rejects malformed or unsupported input: %j", (overrides) => {
    expect(() => normalizeImage(image(overrides))).toThrow();
  });

  it("routes known grayscale/depth encodings to Raw, never unavailable color gateways", () => {
    for (const encoding of ["mono8", "8UC1", "mono16", "16UC1", "32FC1"]) {
      expect(requiresRawImage(encoding)).toBe(true);
    }
    for (const encoding of ["rgb8", "bgr8", "rgba8", "bgra8", "bayer_rggb8", ""]) {
      expect(requiresRawImage(encoding)).toBe(false);
    }
  });
});

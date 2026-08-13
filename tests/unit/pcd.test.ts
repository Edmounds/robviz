import { describe, expect, it } from "vitest";

import {
  lzfDecompress,
  parsePcd,
  parsePcdHeader,
  serializePcdBinary,
  voxelDownsample,
} from "../../src/core/pcd";

/** 字面量-only 的合法 LZF 编码（控制字节 <32 = 字面量段） */
function lzfLiteralCompress(data: Uint8Array): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < data.length; i += 32) {
    const chunk = data.subarray(i, Math.min(i + 32, data.length));
    out.push(chunk.length - 1, ...chunk);
  }
  return new Uint8Array(out);
}

function makeCloud(n: number) {
  const positions = new Float32Array(n * 3);
  const intensity = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    positions[i * 3] = i * 0.5;
    positions[i * 3 + 1] = -i;
    positions[i * 3 + 2] = i * 0.25;
    intensity[i] = i * 10;
  }
  return { count: n, positions, intensity };
}

describe("LZF", () => {
  it("字面量段解压", () => {
    const data = new Uint8Array(100).map((_, i) => i % 251);
    const decompressed = lzfDecompress(lzfLiteralCompress(data), data.length);
    expect([...decompressed]).toEqual([...data]);
  });

  it("回溯引用（含重叠拷贝）", () => {
    // "ABCD" 字面量 + 引用回溯 8 字节 → "ABCDABCDABCD"
    const compressed = new Uint8Array([3, 65, 66, 67, 68, 192, 3]);
    const out = lzfDecompress(compressed, 12);
    expect(new TextDecoder().decode(out)).toBe("ABCDABCDABCD");
  });
});

describe("PCD", () => {
  it("binary 序列化/解析往返", () => {
    const cloud = makeCloud(1000);
    const buf = serializePcdBinary(cloud);
    const header = parsePcdHeader(buf);
    expect(header.data).toBe("binary");
    expect(header.points).toBe(1000);

    const parsed = parsePcd(buf);
    expect(parsed.count).toBe(1000);
    expect(parsed.positions[3]).toBeCloseTo(0.5);
    expect(parsed.positions[4]).toBeCloseTo(-1);
    expect(parsed.intensity![7]).toBeCloseTo(70);
  });

  it("ascii 解析", () => {
    const text =
      "VERSION 0.7\nFIELDS x y z intensity\nSIZE 4 4 4 4\nTYPE F F F F\n" +
      "COUNT 1 1 1 1\nWIDTH 2\nHEIGHT 1\nPOINTS 2\nDATA ascii\n" +
      "1.5 2.5 3.5 100\n-1 -2 -3 200\n";
    const parsed = parsePcd(new TextEncoder().encode(text).buffer as ArrayBuffer);
    expect(parsed.count).toBe(2);
    expect(parsed.positions[0]).toBeCloseTo(1.5);
    expect(parsed.positions[5]).toBeCloseTo(-3);
    expect(parsed.intensity![1]).toBeCloseTo(200);
  });

  it("binary_compressed（SoA 布局）解析", () => {
    const n = 50;
    const cloud = makeCloud(n);
    // SoA：全部 x，全部 y，全部 z，全部 intensity
    const soa = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      soa[i] = cloud.positions[i * 3];
      soa[n + i] = cloud.positions[i * 3 + 1];
      soa[2 * n + i] = cloud.positions[i * 3 + 2];
      soa[3 * n + i] = cloud.intensity[i];
    }
    const rawBytes = new Uint8Array(soa.buffer);
    const compressed = lzfLiteralCompress(rawBytes);

    const header = new TextEncoder().encode(
      "VERSION 0.7\nFIELDS x y z intensity\nSIZE 4 4 4 4\nTYPE F F F F\n" +
        `COUNT 1 1 1 1\nWIDTH ${n}\nHEIGHT 1\nPOINTS ${n}\nDATA binary_compressed\n`,
    );
    const buf = new ArrayBuffer(header.length + 8 + compressed.length);
    new Uint8Array(buf).set(header);
    const dv = new DataView(buf, header.length, 8);
    dv.setUint32(0, compressed.length, true);
    dv.setUint32(4, rawBytes.length, true);
    new Uint8Array(buf, header.length + 8).set(compressed);

    const parsed = parsePcd(buf);
    expect(parsed.count).toBe(n);
    expect(parsed.positions[3]).toBeCloseTo(0.5);
    expect(parsed.positions[4]).toBeCloseTo(-1);
    expect(parsed.intensity![10]).toBeCloseTo(100);
  });

  it("体素降采样去重且保序有限", () => {
    // 100 个点挤在 2 个体素里
    const positions = new Float32Array(100 * 3);
    for (let i = 0; i < 100; i++) {
      positions[i * 3] = i < 60 ? 0.01 + i * 0.0001 : 5.01;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }
    const out = voxelDownsample({ count: 100, positions }, 1.0);
    expect(out.count).toBe(2);
    expect(out.positions[0]).toBeCloseTo(0.01);
    expect(out.positions[3]).toBeCloseTo(5.01);
  });

  it("体素降采样跳过 NaN 点", () => {
    const positions = new Float32Array([1, 1, 1, NaN, 0, 0, 2, 2, 2]);
    const out = voxelDownsample({ count: 3, positions }, 0.5);
    expect(out.count).toBe(2);
  });
});

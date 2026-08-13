import { describe, expect, it } from "vitest";

import {
  parseMapYaml,
  parsePgm,
  serializeMapYaml,
  serializePgm,
  type EditableMap,
} from "../../src/core/mapio";

function makeMap(): EditableMap {
  const width = 8;
  const height = 6;
  const data = new Int8Array(width * height).fill(-1);
  data[0] = 100; // 栅格行 0（y 最小）左下角占用
  data[width * height - 1] = 0; // 右上角自由
  return {
    width,
    height,
    data,
    meta: {
      resolution: 0.05,
      origin: [-1, -2, 0],
      negate: 0,
      occupiedThresh: 0.65,
      freeThresh: 0.196,
    },
  };
}

describe("mapio", () => {
  it("PGM 序列化/解析往返（含垂直翻转）", () => {
    const map = makeMap();
    const pgm = serializePgm(map);
    const parsed = parsePgm(pgm, map.meta);
    expect(parsed.width).toBe(8);
    expect(parsed.height).toBe(6);
    expect([...parsed.data]).toEqual([...map.data]);
  });

  it("PGM 像素行 0 在图像顶部（地图 y 最大）", () => {
    const map = makeMap();
    const bytes = new Uint8Array(serializePgm(map));
    const headerLen = new TextEncoder().encode("P5\n8 6\n255\n").length;
    // 栅格行 0 的占用点应出现在 PGM 最后一行
    expect(bytes[headerLen + 5 * 8]).toBe(0); // 占用 → 像素 0（黑）
    // 栅格最高行的自由点在 PGM 第一行末
    expect(bytes[headerLen + 7]).toBe(254); // 自由 → 像素 254
  });

  it("YAML 序列化/解析往返", () => {
    const meta = makeMap().meta;
    const yaml = serializeMapYaml("mymap.pgm", meta);
    const parsed = parseMapYaml(yaml);
    expect(parsed.image).toBe("mymap.pgm");
    expect(parsed.meta.resolution).toBeCloseTo(0.05);
    expect(parsed.meta.origin).toEqual([-1, -2, 0]);
    expect(parsed.meta.occupiedThresh).toBeCloseTo(0.65);
  });

  it("解析带注释的 PGM", () => {
    const text = "P2\n# a comment\n2 2\n255\n0 254\n205 0\n";
    const meta = makeMap().meta;
    const parsed = parsePgm(new TextEncoder().encode(text).buffer as ArrayBuffer, meta);
    // P2 文本：图像行 0 = [占用, 自由]（地图行 1），图像行 1 = [未知, 占用]（地图行 0）
    expect(parsed.data[parsed.width * 1 + 0]).toBe(100);
    expect(parsed.data[parsed.width * 1 + 1]).toBe(0);
    expect(parsed.data[0]).toBe(-1);
    expect(parsed.data[1]).toBe(100);
  });
});

/**
 * 生成 Mid-360 建图量级的合成 PCD（binary），用于大文件加载实测。
 * 用法：npx tsx scripts/gen-pcd.ts [百万点数] [输出路径]
 */
import { writeFileSync } from "node:fs";

import { serializePcdBinary } from "../src/core/pcd";

const millions = Number(process.argv[2] ?? 20);
const out = process.argv[3] ?? "/tmp/bigmap.pcd";
const count = Math.round(millions * 1e6);

const positions = new Float32Array(count * 3);
const intensity = new Float32Array(count);

// 模拟一条 200m 走廊环境的累积点云：地面 + 两侧墙 + 散布杂物 + 一团"动态物体拖影"
let rng = 42;
const rand = () => {
  rng = (rng * 1664525 + 1013904223) >>> 0;
  return rng / 0xffffffff;
};

for (let i = 0; i < count; i++) {
  const t = rand();
  const x = rand() * 200 - 100;
  let y: number;
  let z: number;
  if (t < 0.4) {
    y = rand() * 12 - 6;
    z = rand() * 0.05; // 地面
  } else if (t < 0.7) {
    y = (t < 0.55 ? -6 : 6) + rand() * 0.1;
    z = rand() * 3; // 墙
  } else if (t < 0.97) {
    y = rand() * 12 - 6;
    z = rand() * 2.5; // 杂物
  } else {
    // 动态物体拖影：x∈[20,30] 的一条"鬼影"带，清理测试目标
    const gx = 20 + rand() * 10;
    positions[i * 3] = gx;
    positions[i * 3 + 1] = rand() * 1.5 - 0.75;
    positions[i * 3 + 2] = rand() * 1.8;
    intensity[i] = 200 + rand() * 55;
    continue;
  }
  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;
  intensity[i] = rand() * 150;
}

const buf = serializePcdBinary({ count, positions, intensity });
writeFileSync(out, Buffer.from(buf));
console.log(`${out}: ${count.toLocaleString()} pts, ${(buf.byteLength / 1e6).toFixed(0)} MB`);

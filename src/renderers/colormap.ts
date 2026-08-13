/** turbo colormap：GLSL 多项式近似（数据着色属"内容色"，不受 UI 单色约束） */

export const TURBO_GLSL = /* glsl */ `
vec3 turbo(float t) {
  t = clamp(t, 0.0, 1.0);
  float t2 = t * t;
  float t3 = t2 * t;
  float t4 = t3 * t;
  float t5 = t4 * t;
  return vec3(
    0.13572138 + 4.61539260 * t - 42.66032258 * t2 + 132.13108234 * t3 - 152.94239396 * t4 + 59.28637943 * t5,
    0.09140261 + 2.19418839 * t + 4.84296658 * t2 - 14.18503333 * t3 + 4.27729857 * t4 + 2.82956604 * t5,
    0.10667330 + 12.64194608 * t - 60.58204836 * t2 + 110.36276771 * t3 - 89.90310912 * t4 + 27.34824973 * t5
  );
}
`;

/** JS 版（LaserScan 等小数据在主线程着色时用） */
export function turbo(t: number): [number, number, number] {
  t = Math.min(1, Math.max(0, t));
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;
  return [
    Math.min(1, Math.max(0, 0.13572138 + 4.6153926 * t - 42.66032258 * t2 + 132.13108234 * t3 - 152.94239396 * t4 + 59.28637943 * t5)),
    Math.min(1, Math.max(0, 0.09140261 + 2.19418839 * t + 4.84296658 * t2 - 14.18503333 * t3 + 4.27729857 * t4 + 2.82956604 * t5)),
    Math.min(1, Math.max(0, 0.1066733 + 12.64194608 * t - 60.58204836 * t2 + 110.36276771 * t3 - 89.90310912 * t4 + 27.34824973 * t5)),
  ];
}

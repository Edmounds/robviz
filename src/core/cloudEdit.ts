/**
 * 点云清理的纯函数核心（CloudCompare-lite）：屏幕矩形框选 → 删除/仅保留 → 撤销。
 * 无 three.js 依赖，可在 Node 测试。
 */

export interface EditableCloud {
  count: number;
  positions: Float32Array;
  intensity?: Float32Array;
}

export interface NdcRect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** 撤销记录：被移除的点（点云无序，撤销 = 追加回去） */
export interface RemovedPoints {
  count: number;
  positions: Float32Array;
  intensity?: Float32Array;
}

/**
 * mvp 为列主序 4x4（three 的 Matrix4.elements 布局），
 * 将点投影到 NDC 并判断是否落在矩形内（且在相机前方、近远平面内）。
 */
export function selectInRect(
  cloud: EditableCloud,
  mvp: ArrayLike<number>,
  rect: NdcRect,
): Uint8Array {
  const { count, positions } = cloud;
  const mask = new Uint8Array(count);
  const m0 = mvp[0], m4 = mvp[4], m8 = mvp[8], m12 = mvp[12];
  const m1 = mvp[1], m5 = mvp[5], m9 = mvp[9], m13 = mvp[13];
  const m2 = mvp[2], m6 = mvp[6], m10 = mvp[10], m14 = mvp[14];
  const m3 = mvp[3], m7 = mvp[7], m11 = mvp[11], m15 = mvp[15];
  for (let p = 0; p < count; p++) {
    const x = positions[p * 3];
    const y = positions[p * 3 + 1];
    const z = positions[p * 3 + 2];
    const w = m3 * x + m7 * y + m11 * z + m15;
    if (w <= 0) continue; // 相机后方
    const invW = 1 / w;
    const nx = (m0 * x + m4 * y + m8 * z + m12) * invW;
    if (nx < rect.minX || nx > rect.maxX) continue;
    const ny = (m1 * x + m5 * y + m9 * z + m13) * invW;
    if (ny < rect.minY || ny > rect.maxY) continue;
    const nz = (m2 * x + m6 * y + m10 * z + m14) * invW;
    if (nz < -1 || nz > 1) continue;
    mask[p] = 1;
  }
  return mask;
}

/**
 * 按掩码拆分：removeSelected = true 删除选中（保留未选中），
 * false 则仅保留选中（裁剪）。返回新云与被移除点（供撤销）。
 */
export function applyMask(
  cloud: EditableCloud,
  mask: Uint8Array,
  removeSelected: boolean,
): { kept: EditableCloud; removed: RemovedPoints } {
  const { count, positions, intensity } = cloud;
  let keepCount = 0;
  for (let p = 0; p < count; p++) {
    if ((mask[p] === 1) !== removeSelected) keepCount++;
  }
  const removedCount = count - keepCount;
  const keptPos = new Float32Array(keepCount * 3);
  const remPos = new Float32Array(removedCount * 3);
  const keptInt = intensity ? new Float32Array(keepCount) : undefined;
  const remInt = intensity ? new Float32Array(removedCount) : undefined;

  let k = 0;
  let r = 0;
  for (let p = 0; p < count; p++) {
    const keep = (mask[p] === 1) !== removeSelected;
    if (keep) {
      keptPos[k * 3] = positions[p * 3];
      keptPos[k * 3 + 1] = positions[p * 3 + 1];
      keptPos[k * 3 + 2] = positions[p * 3 + 2];
      if (keptInt && intensity) keptInt[k] = intensity[p];
      k++;
    } else {
      remPos[r * 3] = positions[p * 3];
      remPos[r * 3 + 1] = positions[p * 3 + 1];
      remPos[r * 3 + 2] = positions[p * 3 + 2];
      if (remInt && intensity) remInt[r] = intensity[p];
      r++;
    }
  }
  return {
    kept: { count: keepCount, positions: keptPos, intensity: keptInt },
    removed: { count: removedCount, positions: remPos, intensity: remInt },
  };
}

/** 撤销：把被移除的点追加回云（点云无序，追加即恢复） */
export function appendPoints(cloud: EditableCloud, removed: RemovedPoints): EditableCloud {
  const total = cloud.count + removed.count;
  const positions = new Float32Array(total * 3);
  positions.set(cloud.positions.subarray(0, cloud.count * 3));
  positions.set(removed.positions.subarray(0, removed.count * 3), cloud.count * 3);
  let intensity: Float32Array | undefined;
  if (cloud.intensity && removed.intensity) {
    intensity = new Float32Array(total);
    intensity.set(cloud.intensity.subarray(0, cloud.count));
    intensity.set(removed.intensity.subarray(0, removed.count), cloud.count);
  }
  return { count: total, positions, intensity };
}

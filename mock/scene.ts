/**
 * 确定性仿真场景：20m x 20m 房间，带内部障碍，差速机器人绕圈行驶。
 * 一切状态是时间 t（秒）的纯函数，测试可以直接断言真值。
 */

export interface Pose2D {
  x: number;
  y: number;
  yaw: number;
}

// ---- 世界模型 ----

export const ROOM_HALF = 10; // 房间半宽（米）
export const MAP_RESOLUTION = 0.1;
export const MAP_SIZE = Math.round((ROOM_HALF * 2) / MAP_RESOLUTION); // 200

/** 内部障碍：轴对齐矩形 [cx, cy, halfW, halfH] */
export const BOXES: Array<[number, number, number, number]> = [
  [4, 4, 1, 1],
  [-5, 2, 0.8, 2],
  [2, -5, 2, 0.6],
];

/** 线段表示的墙：[x1,y1,x2,y2] */
function wallSegments(): Array<[number, number, number, number]> {
  const h = ROOM_HALF;
  const segs: Array<[number, number, number, number]> = [
    [-h, -h, h, -h],
    [h, -h, h, h],
    [h, h, -h, h],
    [-h, h, -h, -h],
  ];
  for (const [cx, cy, hw, hh] of BOXES) {
    segs.push(
      [cx - hw, cy - hh, cx + hw, cy - hh],
      [cx + hw, cy - hh, cx + hw, cy + hh],
      [cx + hw, cy + hh, cx - hw, cy + hh],
      [cx - hw, cy + hh, cx - hw, cy - hh],
    );
  }
  return segs;
}

const SEGMENTS = wallSegments();

// ---- 机器人运动（map 系下真值） ----

export const CIRCLE_RADIUS = 6;
export const ANGULAR_SPEED = 0.25; // rad/s

/** base_link 在 map 系下的真值位姿 */
export function robotPoseAt(t: number): Pose2D {
  const a = ANGULAR_SPEED * t;
  return {
    x: CIRCLE_RADIUS * Math.cos(a),
    y: CIRCLE_RADIUS * Math.sin(a),
    yaw: a + Math.PI / 2, // 切线方向
  };
}

/** 模拟一点里程漂移：odom 系相对 map 系缓慢平移旋转 */
export function odomDriftAt(t: number): Pose2D {
  return {
    x: 0.02 * t * Math.cos(t * 0.05),
    y: 0.015 * t,
    yaw: 0.002 * t,
  };
}

/** base_link 在 odom 系下的位姿 = drift⁻¹ ∘ mapPose。pose 可覆盖（teleop 手动驾驶） */
export function robotInOdomAt(t: number, pose?: Pose2D): Pose2D {
  const m = pose ?? robotPoseAt(t);
  const d = odomDriftAt(t);
  const c = Math.cos(-d.yaw);
  const s = Math.sin(-d.yaw);
  const dx = m.x - d.x;
  const dy = m.y - d.y;
  return { x: c * dx - s * dy, y: s * dx + c * dy, yaw: m.yaw - d.yaw };
}

// ---- 传感器 ----

/** 单条射线与所有墙段求交，返回最近距离 */
export function rayCast(ox: number, oy: number, angle: number, maxRange: number): number {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = maxRange;
  for (const [x1, y1, x2, y2] of SEGMENTS) {
    const ex = x2 - x1;
    const ey = y2 - y1;
    const denom = dx * ey - dy * ex;
    if (Math.abs(denom) < 1e-12) continue;
    const u = ((x1 - ox) * ey - (y1 - oy) * ex) / denom; // 射线参数
    const v = ((x1 - ox) * dy - (y1 - oy) * dx) / denom; // 线段参数
    if (u > 0 && v >= 0 && v <= 1 && u < best) best = u;
  }
  return best;
}

export const SCAN_BEAMS = 360;
export const SCAN_MAX_RANGE = 25;

export interface ScanResult {
  ranges: Float32Array;
  intensities: Float32Array;
}

/** 激光装在 base_link 原点（laser frame 与 base_link 仅差一个静态高度） */
export function scanAt(t: number, noise = true, poseOverride?: Pose2D): ScanResult {
  const pose = poseOverride ?? robotPoseAt(t);
  const ranges = new Float32Array(SCAN_BEAMS);
  const intensities = new Float32Array(SCAN_BEAMS);
  for (let i = 0; i < SCAN_BEAMS; i++) {
    const angle = pose.yaw + (i / SCAN_BEAMS) * Math.PI * 2 - Math.PI;
    let r = rayCast(pose.x, pose.y, angle, SCAN_MAX_RANGE);
    if (noise) r += (deterministicNoise(t * 1000 + i) - 0.5) * 0.03;
    ranges[i] = r;
    intensities[i] = Math.max(0, 255 - r * 8);
  }
  return { ranges, intensities };
}

/** 模拟 16 线雷达点云（laser 系下），每帧 count 点 */
export const CLOUD_RINGS = 16;
export const CLOUD_AZIMUTHS = 480;

export function cloudAt(t: number, azimuths = CLOUD_AZIMUTHS, poseOverride?: Pose2D): {
  count: number;
  /** 交错布局 [x,y,z,intensity,ring] × count，float32 */
  buffer: Float32Array;
} {
  const pose = poseOverride ?? robotPoseAt(t);
  const count = CLOUD_RINGS * azimuths;
  const buffer = new Float32Array(count * 5);
  let o = 0;
  for (let ring = 0; ring < CLOUD_RINGS; ring++) {
    const elevation = ((ring / (CLOUD_RINGS - 1)) - 0.5) * (Math.PI / 6); // ±15°
    const cosE = Math.cos(elevation);
    const sinE = Math.sin(elevation);
    for (let a = 0; a < azimuths; a++) {
      const azimuthLocal = (a / azimuths) * Math.PI * 2 - Math.PI;
      const azimuthWorld = pose.yaw + azimuthLocal;
      const horizontal = rayCast(pose.x, pose.y, azimuthWorld, SCAN_MAX_RANGE);
      // 向下的束打到地面（雷达高度 0.5m）就取地面交点
      let d = horizontal / Math.max(cosE, 1e-6);
      if (sinE < 0) {
        const dFloor = 0.5 / -sinE;
        if (dFloor < d) d = dFloor;
      }
      buffer[o++] = d * cosE * Math.cos(azimuthLocal);
      buffer[o++] = d * cosE * Math.sin(azimuthLocal);
      buffer[o++] = d * sinE;
      buffer[o++] = Math.max(0, 200 - d * 6) + deterministicNoise(ring * 1000 + a) * 20;
      buffer[o++] = ring;
    }
  }
  return { count, buffer };
}

/** OccupancyGrid 栅格（生成一次即可，静态世界） */
export function gridData(): Int8Array {
  const n = MAP_SIZE;
  const data = new Int8Array(n * n).fill(0);
  const toIdx = (x: number, y: number) => {
    const cx = Math.floor((x + ROOM_HALF) / MAP_RESOLUTION);
    const cy = Math.floor((y + ROOM_HALF) / MAP_RESOLUTION);
    if (cx < 0 || cy < 0 || cx >= n || cy >= n) return -1;
    return cy * n + cx;
  };
  // 墙壁描边
  for (const [x1, y1, x2, y2] of SEGMENTS) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.ceil(len / (MAP_RESOLUTION / 2));
    for (let s = 0; s <= steps; s++) {
      const idx = toIdx(x1 + ((x2 - x1) * s) / steps, y1 + ((y2 - y1) * s) / steps);
      if (idx >= 0) data[idx] = 100;
    }
  }
  // 障碍内部填充
  for (const [cx, cy, hw, hh] of BOXES) {
    for (let x = cx - hw; x <= cx + hw; x += MAP_RESOLUTION / 2) {
      for (let y = cy - hh; y <= cy + hh; y += MAP_RESOLUTION / 2) {
        const idx = toIdx(x, y);
        if (idx >= 0) data[idx] = 100;
      }
    }
  }
  return data;
}

/** 确定性伪随机（可复现测试） */
function deterministicNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

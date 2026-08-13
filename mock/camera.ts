/**
 * 模拟深度/彩色相机：装在 base_link 前方（camera_link，朝 +x），
 * 对 2D 墙面世界做逐列光线投射 + 逐像素地面/天花板求交。
 * 深度 32FC1（米），彩色 RGBA（由 server 编 JPEG）。
 */
import type { Pose2D } from "./scene";
import { rayCast, SCAN_MAX_RANGE } from "./scene";

export const CAM_WIDTH = 320;
export const CAM_HEIGHT = 240;
export const CAM_HFOV = Math.PI / 3; // 60°
export const CAM_HEIGHT_M = 0.5; // 相机离地高度
const CEILING_M = 3.0;

/** 针孔模型焦距（像素） */
const FX = CAM_WIDTH / 2 / Math.tan(CAM_HFOV / 2);

export interface CameraFrame {
  /** 32FC1 深度（米），行主序，行 0 在图像顶部 */
  depth: Float32Array;
  /** RGBA 彩色 */
  rgba: Uint8Array;
}

export function renderCamera(pose: Pose2D): CameraFrame {
  const depth = new Float32Array(CAM_WIDTH * CAM_HEIGHT);
  const rgba = new Uint8Array(CAM_WIDTH * CAM_HEIGHT * 4);

  // 每列一条水平射线
  const colDist = new Float32Array(CAM_WIDTH);
  const colAngle = new Float32Array(CAM_WIDTH);
  for (let u = 0; u < CAM_WIDTH; u++) {
    const angle = Math.atan2(u - CAM_WIDTH / 2 + 0.5, FX);
    colAngle[u] = angle;
    colDist[u] = rayCast(pose.x, pose.y, pose.yaw + angle, SCAN_MAX_RANGE);
  }

  for (let v = 0; v < CAM_HEIGHT; v++) {
    // 行 0 在顶部 = 向上看
    const tanEl = (CAM_HEIGHT / 2 - v - 0.5) / FX;
    for (let u = 0; u < CAM_WIDTH; u++) {
      const h = colDist[u];
      const cosA = Math.cos(colAngle[u]);
      // 沿视线走 d，前向距离 = d·cos(el)·cos(az)（近似用列射线水平距离截断）
      let d = (h / cosA) * Math.sqrt(1 + tanEl * tanEl); // 到墙
      let surface: "wall" | "floor" | "ceil" = "wall";
      if (tanEl < 0) {
        const dFloor = (CAM_HEIGHT_M / -tanEl) * Math.sqrt(1 + tanEl * tanEl);
        if (dFloor < d) {
          d = dFloor;
          surface = "floor";
        }
      } else if (tanEl > 0) {
        const dCeil = ((CEILING_M - CAM_HEIGHT_M) / tanEl) * Math.sqrt(1 + tanEl * tanEl);
        if (dCeil < d) {
          d = dCeil;
          surface = "ceil";
        }
      }
      const idx = v * CAM_WIDTH + u;
      depth[idx] = d;

      // 彩色：墙按世界位置竖条纹 + 距离衰减；地面棋盘格；天花板暗灰
      const fade = Math.max(0.15, 1 - d / 15);
      let r: number;
      let g: number;
      let b: number;
      if (surface === "floor") {
        const groundDist = d / Math.sqrt(1 + tanEl * tanEl);
        const wx = pose.x + groundDist * Math.cos(pose.yaw + colAngle[u]);
        const wy = pose.y + groundDist * Math.sin(pose.yaw + colAngle[u]);
        const check = (Math.floor(wx) + Math.floor(wy)) % 2 === 0 ? 150 : 100;
        r = check * fade;
        g = check * fade;
        b = (check + 20) * fade;
      } else if (surface === "ceil") {
        r = 40 * fade;
        g = 40 * fade;
        b = 45 * fade;
      } else {
        const wx = pose.x + colDist[u] * Math.cos(pose.yaw + colAngle[u]);
        const wy = pose.y + colDist[u] * Math.sin(pose.yaw + colAngle[u]);
        const stripe = Math.abs(Math.floor((wx + wy) * 2)) % 2 === 0 ? 1 : 0.75;
        r = 200 * stripe * fade;
        g = 160 * stripe * fade;
        b = 120 * stripe * fade;
      }
      const o = idx * 4;
      rgba[o] = r;
      rgba[o + 1] = g;
      rgba[o + 2] = b;
      rgba[o + 3] = 255;
    }
  }
  return { depth, rgba };
}

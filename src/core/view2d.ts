/**
 * 2D 视图数学与变换工具
 * 纯状态函数，用于航点网格、图像等画布的平移、光标锚定缩放及标签避让计算。
 */

export interface View2DTransform {
  centerX: number;
  centerY: number;
  scale: number;
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlacedLabel {
  name: string;
  rect: Rect;
  textX: number;
  textY: number;
  leaderLine?: { fromX: number; fromY: number; toX: number; toY: number };
  crowded?: boolean;
}

/** 世界坐标转画布像素坐标（世界 Y 向上，画布 Y 向下） */
export function worldToCanvas(
  view: View2DTransform,
  wx: number,
  wy: number,
): [number, number] {
  const px = view.width / 2 + (wx - view.centerX) * view.scale;
  const py = view.height / 2 - (wy - view.centerY) * view.scale;
  return [px, py];
}

/** 画布像素坐标转世界坐标 */
export function canvasToWorld(
  view: View2DTransform,
  px: number,
  py: number,
): { x: number; y: number } {
  return {
    x: view.centerX + (px - view.width / 2) / view.scale,
    y: view.centerY - (py - view.height / 2) / view.scale,
  };
}

/** 平移视图 */
export function panView(
  view: View2DTransform,
  deltaPxX: number,
  deltaPxY: number,
): View2DTransform {
  return {
    ...view,
    centerX: view.centerX - deltaPxX / view.scale,
    centerY: view.centerY + deltaPxY / view.scale,
  };
}

/** 以指定画布像素点为锚点进行缩放，确保锚点所指的世界坐标位置在缩放前后不变 */
export function zoomViewAtAnchor(
  view: View2DTransform,
  anchorPxX: number,
  anchorPxY: number,
  factor: number,
  minScale = 2,
  maxScale = 2000,
): View2DTransform {
  const nextScale = Math.max(minScale, Math.min(maxScale, view.scale * factor));
  if (Math.abs(nextScale - view.scale) < 1e-6) return view;

  // 缩放前锚点对应的世界坐标
  const wx = view.centerX + (anchorPxX - view.width / 2) / view.scale;
  const wy = view.centerY - (anchorPxY - view.height / 2) / view.scale;

  // 调整中心使锚点在缩放后仍落在 (anchorPxX, anchorPxY)
  const nextCenterX = wx - (anchorPxX - view.width / 2) / nextScale;
  const nextCenterY = wy + (anchorPxY - view.height / 2) / nextScale;

  return {
    ...view,
    centerX: nextCenterX,
    centerY: nextCenterY,
    scale: nextScale,
  };
}

/** 自适应适配世界边界到画布 */
export function fitViewToBounds(
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  width: number,
  height: number,
  padding = 40,
): View2DTransform {
  const spanX = Math.max(1, bounds.maxX - bounds.minX);
  const spanY = Math.max(1, bounds.maxY - bounds.minY);
  const availW = Math.max(10, width - padding * 2);
  const availH = Math.max(10, height - padding * 2);

  const scale = Math.max(2, Math.min(availW / spanX, availH / spanY));
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  return {
    centerX: Number.isFinite(centerX) ? centerX : 0,
    centerY: Number.isFinite(centerY) ? centerY : 0,
    scale: Number.isFinite(scale) ? scale : 50,
    width,
    height,
  };
}

/** 矩形相交检测（支持可选容差与间距） */
export function rectsIntersect(a: Rect, b: Rect, padding = 3): boolean {
  return (
    a.x - padding < b.x + b.width &&
    a.x + a.width + padding > b.x &&
    a.y - padding < b.y + b.height &&
    a.y + a.height + padding > b.y
  );
}

/**
 * 图像像素坐标转世界坐标 (odom)
 * 图像中心位于 (imageWidth / 2, imageHeight / 2)。
 * 角度 rotationDeg 在 odom 坐标系下逆时针（CCW）为正。
 */
export function imagePixelToWorld(
  config: { centerX: number; centerY: number; metersPerPixel: number; rotationDeg: number },
  imageWidth: number,
  imageHeight: number,
  u: number,
  v: number,
): { x: number; y: number } {
  const du = u - imageWidth / 2;
  const dv = v - imageHeight / 2;
  const rad = (config.rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const s = config.metersPerPixel;
  const dx = s * (cos * du + sin * dv);
  const dy = s * (sin * du - cos * dv);
  return {
    x: config.centerX + dx,
    y: config.centerY + dy,
  };
}

/**
 * 世界坐标 (odom) 转图像像素坐标 (u, v)
 */
export function worldToImagePixel(
  config: { centerX: number; centerY: number; metersPerPixel: number; rotationDeg: number },
  imageWidth: number,
  imageHeight: number,
  wx: number,
  wy: number,
): { u: number; v: number } {
  const s = config.metersPerPixel;
  if (s <= 1e-9) return { u: imageWidth / 2, v: imageHeight / 2 };
  const rad = (config.rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = wx - config.centerX;
  const dy = wy - config.centerY;
  const du = (cos * dx + sin * dy) / s;
  const dv = (sin * dx - cos * dy) / s;
  return {
    u: imageWidth / 2 + du,
    v: imageHeight / 2 + dv,
  };
}

/**
 * 计算新的图像中心 (centerX, centerY)，保持 pivot (pivotU, pivotV)
 * 在新缩放和新旋转角下，其世界坐标 (pivotWorldX, pivotWorldY) 保持不变。
 */
export function centerFromPivotInvariant(
  pivotWorld: { x: number; y: number },
  pivotPixel: { u: number; v: number },
  imageWidth: number,
  imageHeight: number,
  newMetersPerPixel: number,
  newRotationDeg: number,
): { centerX: number; centerY: number } {
  const du = pivotPixel.u - imageWidth / 2;
  const dv = pivotPixel.v - imageHeight / 2;
  const rad = (newRotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const s = newMetersPerPixel;
  const dx = s * (cos * du + sin * dv);
  const dy = s * (sin * du - cos * dv);
  return {
    centerX: pivotWorld.x - dx,
    centerY: pivotWorld.y - dy,
  };
}

/**
 * 确定性标签避让算法：
 * 为每个航点计算最佳标签位置，依次尝试右上、右下、左上、左下及引线外扩位置，
 * 避免标签之间互相覆盖；在极密区域提供拥挤降级。
 */
export function placeWaypointLabels(
  points: ReadonlyArray<{ name: string; px: number; py: number }>,
  measureText: (name: string) => { width: number; height: number },
  viewportWidth: number,
  viewportHeight: number,
): PlacedLabel[] {
  const placed: PlacedLabel[] = [];
  const obstacles: Rect[] = [];

  for (const pt of points) {
    const dim = measureText(pt.name);
    const tw = Math.max(12, dim.width);
    const th = Math.max(12, dim.height);
    const pad = 3;

    // 尝试候选位置（由近及远，先四角，再引线外扩）
    const candidates = [
      // 1. 右上
      {
        rect: { x: pt.px + 10, y: pt.py - th - 2, width: tw + pad * 2, height: th + pad * 2 },
        textX: pt.px + 10 + pad,
        textY: pt.py - 2,
        needLeader: false,
      },
      // 2. 右下
      {
        rect: { x: pt.px + 10, y: pt.py + 4, width: tw + pad * 2, height: th + pad * 2 },
        textX: pt.px + 10 + pad,
        textY: pt.py + 4 + th,
        needLeader: false,
      },
      // 3. 左上
      {
        rect: { x: pt.px - 10 - tw - pad * 2, y: pt.py - th - 2, width: tw + pad * 2, height: th + pad * 2 },
        textX: pt.px - 10 - tw - pad,
        textY: pt.py - 2,
        needLeader: false,
      },
      // 4. 左下
      {
        rect: { x: pt.px - 10 - tw - pad * 2, y: pt.py + 4, width: tw + pad * 2, height: th + pad * 2 },
        textX: pt.px - 10 - tw - pad,
        textY: pt.py + 4 + th,
        needLeader: false,
      },
      // 5. 正上方近引线
      {
        rect: { x: pt.px - tw / 2 - pad, y: pt.py - th - 20, width: tw + pad * 2, height: th + pad * 2 },
        textX: pt.px - tw / 2,
        textY: pt.py - 20,
        needLeader: true,
      },
      // 6. 正下方近引线
      {
        rect: { x: pt.px - tw / 2 - pad, y: pt.py + 18, width: tw + pad * 2, height: th + pad * 2 },
        textX: pt.px - tw / 2,
        textY: pt.py + 18 + th,
        needLeader: true,
      },
      // 7. 右上方远引线
      {
        rect: { x: pt.px + 14, y: pt.py - th - 34, width: tw + pad * 2, height: th + pad * 2 },
        textX: pt.px + 14 + pad,
        textY: pt.py - 34,
        needLeader: true,
      },
      // 8. 左上方远引线
      {
        rect: { x: pt.px - 14 - tw - pad * 2, y: pt.py - th - 34, width: tw + pad * 2, height: th + pad * 2 },
        textX: pt.px - 14 - tw - pad,
        textY: pt.py - 34,
        needLeader: true,
      },
      // 9. 右下方远引线
      {
        rect: { x: pt.px + 14, y: pt.py + 32, width: tw + pad * 2, height: th + pad * 2 },
        textX: pt.px + 14 + pad,
        textY: pt.py + 32 + th,
        needLeader: true,
      },
      // 10. 左下方远引线
      {
        rect: { x: pt.px - 14 - tw - pad * 2, y: pt.py + 32, width: tw + pad * 2, height: th + pad * 2 },
        textX: pt.px - 14 - tw - pad,
        textY: pt.py + 32 + th,
        needLeader: true,
      },
    ];

    let chosen: (typeof candidates)[0] | undefined;

    for (const cand of candidates) {
      // 边界检查：必须大致在画布视口内（留 4px 边距）
      if (cand.rect.x < 4 || cand.rect.x + cand.rect.width > viewportWidth - 4) continue;
      if (cand.rect.y < 4 || cand.rect.y + cand.rect.height > viewportHeight - 4) continue;

      // 碰撞检测：不能与已经放置的标签相交
      const collides = obstacles.some((obs) => rectsIntersect(cand.rect, obs, 2));
      if (!collides) {
        chosen = cand;
        break;
      }
    }

    if (chosen) {
      const labelItem: PlacedLabel = {
        name: pt.name,
        rect: chosen.rect,
        textX: chosen.textX,
        textY: chosen.textY,
        leaderLine: chosen.needLeader
          ? {
              fromX: pt.px,
              fromY: pt.py,
              toX: chosen.rect.x + chosen.rect.width / 2,
              toY: chosen.rect.y + (chosen.rect.y > pt.py ? 0 : chosen.rect.height),
            }
          : undefined,
      };
      placed.push(labelItem);
      obstacles.push(chosen.rect);
    } else {
      // 候选位置全部被阻挡或超出视口：降级为紧凑标记，寻找安全的紧凑候选位置
      const compactW = 22;
      const compactH = th + pad * 2;
      const compactCandidates = [
        {
          rect: { x: pt.px + 8, y: pt.py - th - 2, width: compactW, height: compactH },
          textX: pt.px + 8 + 4,
          textY: pt.py - 2,
          needLeader: false,
        },
        {
          rect: { x: pt.px + 8, y: pt.py + 4, width: compactW, height: compactH },
          textX: pt.px + 8 + 4,
          textY: pt.py + 4 + th,
          needLeader: false,
        },
        {
          rect: { x: pt.px - 8 - compactW, y: pt.py - th - 2, width: compactW, height: compactH },
          textX: pt.px - 8 - compactW + 4,
          textY: pt.py - 2,
          needLeader: false,
        },
        {
          rect: { x: pt.px - 8 - compactW, y: pt.py + 4, width: compactW, height: compactH },
          textX: pt.px - 8 - compactW + 4,
          textY: pt.py + 4 + th,
          needLeader: false,
        },
        {
          rect: { x: pt.px - compactW / 2, y: pt.py - th - 18, width: compactW, height: compactH },
          textX: pt.px - compactW / 2 + 4,
          textY: pt.py - 18,
          needLeader: true,
        },
        {
          rect: { x: pt.px - compactW / 2, y: pt.py + 16, width: compactW, height: compactH },
          textX: pt.px - compactW / 2 + 4,
          textY: pt.py + 16 + th,
          needLeader: true,
        },
      ];

      let compactChosen: (typeof compactCandidates)[0] | undefined;
      for (const cand of compactCandidates) {
        if (cand.rect.x < 4 || cand.rect.x + cand.rect.width > viewportWidth - 4) continue;
        if (cand.rect.y < 4 || cand.rect.y + cand.rect.height > viewportHeight - 4) continue;
        const collides = obstacles.some((obs) => rectsIntersect(cand.rect, obs, 2));
        if (!collides) {
          compactChosen = cand;
          break;
        }
      }

      if (compactChosen) {
        placed.push({
          name: pt.name,
          rect: compactChosen.rect,
          textX: compactChosen.textX,
          textY: compactChosen.textY,
          leaderLine: compactChosen.needLeader
            ? {
                fromX: pt.px,
                fromY: pt.py,
                toX: compactChosen.rect.x + compactChosen.rect.width / 2,
                toY: compactChosen.rect.y + (compactChosen.rect.y > pt.py ? 0 : compactChosen.rect.height),
              }
            : undefined,
          crowded: true,
        });
        obstacles.push(compactChosen.rect);
      } else {
        // 若紧凑候选也受阻，做严格边界限制（确保在视口内）
        const clampedX = Math.max(4, Math.min(viewportWidth - compactW - 4, pt.px + 8));
        const clampedY = Math.max(4, Math.min(viewportHeight - compactH - 4, pt.py - th - 2));
        const clampedRect = { x: clampedX, y: clampedY, width: compactW, height: compactH };
        placed.push({
          name: pt.name,
          rect: clampedRect,
          textX: clampedX + 4,
          textY: clampedY + th,
          crowded: true,
        });
        obstacles.push(clampedRect);
      }
    }
  }

  return placed;
}

import { describe, expect, it } from "vitest";

import {
  canvasToWorld,
  centerFromPivotInvariant,
  fitViewToBounds,
  imagePixelToWorld,
  panView,
  placeWaypointLabels,
  rectsIntersect,
  worldToCanvas,
  worldToImagePixel,
  zoomViewAtAnchor,
  type View2DTransform,
} from "../../src/core/view2d";

describe("2D View transform utilities", () => {
  const baseView: View2DTransform = {
    centerX: 2.0,
    centerY: -1.0,
    scale: 100, // 1m = 100px
    width: 800,
    height: 600,
  };

  it("converts world to canvas and back reversibly", () => {
    const wx = 3.5;
    const wy = -0.5;
    const [px, py] = worldToCanvas(baseView, wx, wy);

    expect(px).toBe(800 / 2 + (3.5 - 2.0) * 100); // 400 + 150 = 550
    expect(py).toBe(600 / 2 - (-0.5 - (-1.0)) * 100); // 300 - 50 = 250

    const back = canvasToWorld(baseView, px, py);
    expect(back.x).toBeCloseTo(wx, 5);
    expect(back.y).toBeCloseTo(wy, 5);
  });

  it("pans view inversely to pixel movement", () => {
    const panned = panView(baseView, 100, -50);
    expect(panned.centerX).toBeCloseTo(2.0 - 100 / 100, 5); // 1.0
    expect(panned.centerY).toBeCloseTo(-1.0 + (-50) / 100, 5); // -1.5
  });

  it("keeps anchor world coordinate unchanged when zooming", () => {
    const anchorPxX = 600;
    const anchorPxY = 200;
    const beforeWorld = canvasToWorld(baseView, anchorPxX, anchorPxY);

    const zoomed = zoomViewAtAnchor(baseView, anchorPxX, anchorPxY, 1.5);
    expect(zoomed.scale).toBeCloseTo(150, 4);

    const afterWorld = canvasToWorld(zoomed, anchorPxX, anchorPxY);
    expect(afterWorld.x).toBeCloseTo(beforeWorld.x, 5);
    expect(afterWorld.y).toBeCloseTo(beforeWorld.y, 5);
  });

  it("fits view to bounding box with padding", () => {
    const fitted = fitViewToBounds(
      { minX: 0, maxX: 10, minY: -5, maxY: 5 },
      800,
      600,
      50,
    );
    expect(fitted.centerX).toBe(5);
    expect(fitted.centerY).toBe(0);
    // Avail width: 700, span: 10 -> scale <= 70
    // Avail height: 500, span: 10 -> scale <= 50
    expect(fitted.scale).toBeCloseTo(50, 1);
  });

  it("detects rectangle intersection correctly", () => {
    const r1 = { x: 10, y: 10, width: 40, height: 20 };
    const r2 = { x: 45, y: 15, width: 30, height: 20 }; // intersects r1
    const r3 = { x: 100, y: 100, width: 20, height: 20 }; // far away

    expect(rectsIntersect(r1, r2)).toBe(true);
    expect(rectsIntersect(r1, r3)).toBe(false);
  });

  it("places labels with collision avoidance for adjacent points", () => {
    const points = [
      { name: "Alpha", px: 200, py: 200 },
      { name: "Beta", px: 205, py: 202 }, // Very close to Alpha
    ];

    const measureText = (name: string) => ({ width: name.length * 8, height: 14 });
    const placed = placeWaypointLabels(points, measureText, 800, 600);

    expect(placed).toHaveLength(2);
    // Alpha and Beta labels must not intersect
    expect(rectsIntersect(placed[0].rect, placed[1].rect, 1)).toBe(false);
  });

  it("handles super wide labels by safely falling back to compact placed label within bounds", () => {
    const points = [
      {
        name: "Super_Long_Waypoint_Name_That_Exceeds_Canvas_Viewport_Width_By_A_Huge_Margin_ABCDEFGHIJKLMN_1234567890",
        px: 400,
        py: 300,
      },
    ];
    // Super wide measurement: 1200px width inside an 800px viewport
    const measureText = () => ({ width: 1200, height: 16 });
    const placed = placeWaypointLabels(points, measureText, 800, 600);

    expect(placed).toHaveLength(1);
    expect(placed[0].crowded).toBe(true);
    // Placed rect must stay within viewport boundaries
    expect(placed[0].rect.x).toBeGreaterThanOrEqual(4);
    expect(placed[0].rect.x + placed[0].rect.width).toBeLessThanOrEqual(800 - 4);
    expect(placed[0].rect.y).toBeGreaterThanOrEqual(4);
    expect(placed[0].rect.y + placed[0].rect.height).toBeLessThanOrEqual(600 - 4);
  });

  it("safely handles multiple coincident points at boundary", () => {
    const points = [
      { name: "P1", px: 795, py: 10 },
      { name: "P2", px: 795, py: 10 },
      { name: "P3", px: 795, py: 10 },
    ];
    const measureText = (name: string) => ({ width: name.length * 10, height: 14 });
    const placed = placeWaypointLabels(points, measureText, 800, 600);

    expect(placed).toHaveLength(3);
    for (const p of placed) {
      expect(p.rect.x).toBeGreaterThanOrEqual(4);
      expect(p.rect.x + p.rect.width).toBeLessThanOrEqual(800 - 4);
      expect(p.rect.y).toBeGreaterThanOrEqual(4);
      expect(p.rect.y + p.rect.height).toBeLessThanOrEqual(600 - 4);
    }
  });

  describe("Background image coordinate transforms", () => {
    const imgConfig = {
      centerX: 1.0,
      centerY: 2.0,
      metersPerPixel: 0.02,
      rotationDeg: 0,
    };
    const W = 1000;
    const H = 600;

    it("maps image center to world center", () => {
      const world = imagePixelToWorld(imgConfig, W, H, W / 2, H / 2);
      expect(world.x).toBeCloseTo(1.0, 5);
      expect(world.y).toBeCloseTo(2.0, 5);

      const pixel = worldToImagePixel(imgConfig, W, H, 1.0, 2.0);
      expect(pixel.u).toBeCloseTo(W / 2, 5);
      expect(pixel.v).toBeCloseTo(H / 2, 5);
    });

    it("round-trips imagePixelToWorld and worldToImagePixel with rotation", () => {
      const rotatedConfig = { ...imgConfig, rotationDeg: 37.5, metersPerPixel: 0.015 };
      const testU = 750;
      const testV = 200;

      const world = imagePixelToWorld(rotatedConfig, W, H, testU, testV);
      const pixel = worldToImagePixel(rotatedConfig, W, H, world.x, world.y);

      expect(pixel.u).toBeCloseTo(testU, 5);
      expect(pixel.v).toBeCloseTo(testV, 5);
    });

    it("preserves pivot world position when scale and rotation change", () => {
      const initialConfig = { ...imgConfig, rotationDeg: 10, metersPerPixel: 0.02 };
      const pivotPixel = { u: 700, v: 450 };

      // Current world position of this pivot point
      const pivotWorld = imagePixelToWorld(initialConfig, W, H, pivotPixel.u, pivotPixel.v);

      // Now change scale and rotation drastically
      const newScale = 0.035;
      const newRot = 65.0;

      const newCenter = centerFromPivotInvariant(
        pivotWorld,
        pivotPixel,
        W,
        H,
        newScale,
        newRot,
      );

      const transformedConfig = {
        centerX: newCenter.centerX,
        centerY: newCenter.centerY,
        metersPerPixel: newScale,
        rotationDeg: newRot,
      };

      // The pivot point MUST evaluate to the exact same world position!
      const afterWorld = imagePixelToWorld(transformedConfig, W, H, pivotPixel.u, pivotPixel.v);
      expect(afterWorld.x).toBeCloseTo(pivotWorld.x, 5);
      expect(afterWorld.y).toBeCloseTo(pivotWorld.y, 5);
    });
  });
});

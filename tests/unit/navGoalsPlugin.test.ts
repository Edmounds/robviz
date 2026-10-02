import { describe, expect, it, vi } from "vitest";

import type { PluginContext } from "../../src/plugins/types";
import {
  handleGoalPose,
  handleInitialPose,
  readNavPluginState,
} from "../../src/plugins/nav-goals";

function context(overrides: Partial<PluginContext> = {}) {
  return {
    bridge: { publish: vi.fn() },
    topics: [],
    tf: {} as PluginContext["tf"],
    fixedFrame: "map",
    theme: "dark",
    locale: "en",
    active: true,
    connectionState: "open",
    pluginStates: {},
    onPluginStateChange: vi.fn(),
    ...overrides,
  } as unknown as PluginContext;
}

describe("bundled Nav Goals plugin", () => {
  it("publishes selected goal coordinates, yaw, fixed frame, and configured topic", () => {
    const ctx = context({
      pluginStates: { "nav-goals": { goalTopic: "/navigate", initialPoseTopic: "/localize" } },
    });

    handleGoalPose(ctx, { position: { x: 1, y: 2, z: 0 }, yaw: Math.PI });

    expect(ctx.bridge.publish).toHaveBeenCalledWith(
      "/navigate",
      "geometry_msgs/msg/PoseStamped",
      expect.objectContaining({
        header: expect.objectContaining({ frame_id: "map" }),
        pose: {
          position: { x: 1, y: 2, z: 0 },
          orientation: expect.objectContaining({ z: 1, w: expect.closeTo(0, 5) }),
        },
      }),
    );
  });

  it("publishes initial-pose covariance to its configured topic", () => {
    const ctx = context({
      pluginStates: { "nav-goals": { goalTopic: "/navigate", initialPoseTopic: "/localize" } },
    });

    handleInitialPose(ctx, { position: { x: 3, y: 4, z: 0 }, yaw: 0 });

    const [, schema, message] = vi.mocked(ctx.bridge.publish).mock.calls[0];
    expect(schema).toBe("geometry_msgs/msg/PoseWithCovarianceStamped");
    expect(message).toMatchObject({
      header: { frame_id: "map" },
      pose: {
        pose: { position: { x: 3, y: 4, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 } },
        covariance: expect.arrayContaining([0.25]),
      },
    });
    expect(vi.mocked(ctx.bridge.publish).mock.calls[0][0]).toBe("/localize");
    expect((message as { pose: { covariance: number[] } }).pose.covariance).toHaveLength(36);
  });

  it("does not publish while inactive or disconnected and validates imported settings", () => {
    const inactive = context({ active: false });
    handleGoalPose(inactive, { position: { x: 0, y: 0, z: 0 }, yaw: 0 });
    expect(inactive.bridge.publish).not.toHaveBeenCalled();

    const disconnected = context({ connectionState: "closed" });
    handleInitialPose(disconnected, { position: { x: 0, y: 0, z: 0 }, yaw: 0 });
    expect(disconnected.bridge.publish).not.toHaveBeenCalled();

    expect(readNavPluginState({ goalTopic: "  /custom  ", initialPoseTopic: 7 })).toEqual({
      goalTopic: "/custom",
      initialPoseTopic: "/initialpose",
    });
  });
});

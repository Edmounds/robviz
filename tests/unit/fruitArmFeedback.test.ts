import { describe, expect, it } from "vitest";

import { hasValidFeedback, telemetrySchema } from "../../src/plugins/fruit-arm/api";
import type { ArmConfiguration, Telemetry } from "../../src/plugins/fruit-arm/api";

const syntheticConfig: ArmConfiguration = {
  geometry: {
    base_z: 0.1,
    a2: 0.2,
    a3: 0.2,
    a4: 0.12,
    tool_z_offset_m: -0.03,
  },
  joint_mapping: {
    q1: { direction: 1, offset_deg: 0, limits_deg: [-90, 90] },
    q2: { direction: 1, offset_deg: 0, limits_deg: [-45, 90] },
    q3: { direction: 1, offset_deg: 0, limits_deg: [-120, 30] },
    q4: { direction: 1, offset_deg: 0, limits_deg: [-90, 90] },
  },
  planning: {
    default_duration_ms: 1000,
  interpolation_step_ms: 200,
  default_dwell_ms: 500,
  status_max_age_sec: 0.25,
  hover_height_m: 0.06,
  },
  presets: {},
};

function createValidTelemetry(overrides?: Partial<Telemetry>): Telemetry {
  const baseStamp = overrides?.header?.stamp ?? { sec: 1000, nanosec: 500_000_000 };
  const baseFrame = overrides?.header?.frame_id ?? "arm_base_link";
  const baseHardware = {
    header: { frame_id: baseFrame, stamp: baseStamp },
    name: ["joint_1", "joint_2", "joint_3", "joint_4"] as const,
    position: [0, 0, 0, 0],
    velocity: [0, 0, 0, 0],
    effort: [] as number[],
  };
  const baseModel = {
    header: { frame_id: baseFrame, stamp: baseStamp },
    name: ["joint_1", "joint_2", "joint_3", "joint_4"] as const,
    position: [0, 0, 0, 0],
    velocity: [0, 0, 0, 0],
    effort: [] as number[],
  };

  return {
    header: { frame_id: baseFrame, stamp: baseStamp },
    hardware_joint_state: overrides?.hardware_joint_state ? {
      ...baseHardware,
      ...overrides.hardware_joint_state,
      header: overrides.hardware_joint_state.header ?? { frame_id: baseFrame, stamp: baseStamp },
    } : baseHardware,
    model_joint_state: overrides?.model_joint_state ? {
      ...baseModel,
      ...overrides.model_joint_state,
      header: overrides.model_joint_state.header ?? { frame_id: baseFrame, stamp: baseStamp },
    } : baseModel,
    tcp_position: { x: 0.2, y: 0.0, z: 0.3 },
    tcp_pitch_deg: 0,
    trajectory_id: 1,
    task_status: 0,
    progress: 100,
    gripper_state: 0,
    error_code: 0,
    ...overrides,
  };
}

describe("hasValidFeedback pure data validation", () => {
  it("approves valid four-joint feedback within configured limits", () => {
    const telemetry = createValidTelemetry();
    expect(telemetrySchema.safeParse(telemetry).success).toBe(true);
    expect(hasValidFeedback(telemetry, syntheticConfig)).toBe(true);
    expect(hasValidFeedback({ message: telemetry }, syntheticConfig)).toBe(true);
  });

  it("rejects null or missing feedback or configuration", () => {
    const telemetry = createValidTelemetry();
    expect(hasValidFeedback(null, syntheticConfig)).toBe(false);
    expect(hasValidFeedback(telemetry, null)).toBe(false);
    expect(hasValidFeedback(null, null)).toBe(false);
  });

  it("does not reject feedback based on timestamp age", () => {
    const ancientTelemetry = createValidTelemetry({
      header: { frame_id: "arm_base_link", stamp: { sec: 0, nanosec: 0 } },
    });
    const futureTelemetry = createValidTelemetry({
      header: { frame_id: "arm_base_link", stamp: { sec: 2_000_000_000, nanosec: 0 } },
    });
    expect(hasValidFeedback(ancientTelemetry, syntheticConfig)).toBe(true);
    expect(hasValidFeedback(futureTelemetry, syntheticConfig)).toBe(true);
  });

  it("rejects non-finite values (NaN and Infinity) in joint positions", () => {
    const nanTelemetry = createValidTelemetry({
      hardware_joint_state: {
        header: { frame_id: "arm_base_link", stamp: { sec: 1000, nanosec: 500_000_000 } },
        name: ["joint_1", "joint_2", "joint_3", "joint_4"],
        position: [NaN, 0, 0, 0],
        velocity: [0, 0, 0, 0],
        effort: [],
      },
    });
    const infTelemetry = createValidTelemetry({
      hardware_joint_state: {
        header: { frame_id: "arm_base_link", stamp: { sec: 1000, nanosec: 500_000_000 } },
        name: ["joint_1", "joint_2", "joint_3", "joint_4"],
        position: [Infinity, 0, 0, 0],
        velocity: [0, 0, 0, 0],
        effort: [],
      },
    });
    expect(hasValidFeedback(nanTelemetry, syntheticConfig)).toBe(false);
    expect(hasValidFeedback(infTelemetry, syntheticConfig)).toBe(false);
  });

  it("preserves schema tolerance for NaN velocity without rejecting valid positions", () => {
    const nanVelocityTelemetry = createValidTelemetry({
      hardware_joint_state: {
        header: { frame_id: "arm_base_link", stamp: { sec: 1000, nanosec: 500_000_000 } },
        name: ["joint_1", "joint_2", "joint_3", "joint_4"],
        position: [0, 0, 0, 0],
        velocity: [NaN, NaN, NaN, NaN],
        effort: [],
      },
    });
    expect(hasValidFeedback(nanVelocityTelemetry, syntheticConfig)).toBe(true);
  });

  it("rejects incorrect joint names or axis counts", () => {
    const wrongNames = createValidTelemetry({
      hardware_joint_state: {
        header: { frame_id: "arm_base_link", stamp: { sec: 1000, nanosec: 500_000_000 } },
        // @ts-expect-error test wrong joint names
        name: ["j1", "j2", "j3", "j4"],
        position: [0, 0, 0, 0],
        velocity: [0, 0, 0, 0],
        effort: [],
      },
    });
    const threeAxes = createValidTelemetry({
      hardware_joint_state: {
        header: { frame_id: "arm_base_link", stamp: { sec: 1000, nanosec: 500_000_000 } },
        // @ts-expect-error test wrong axis count
        name: ["joint_1", "joint_2", "joint_3"],
        position: [0, 0, 0],
        velocity: [0, 0, 0],
        effort: [],
      },
    });
    expect(hasValidFeedback(wrongNames, syntheticConfig)).toBe(false);
    expect(hasValidFeedback(threeAxes, syntheticConfig)).toBe(false);
  });

  it("rejects incorrect frame_id", () => {
    const wrongFrame = createValidTelemetry({
      // @ts-expect-error test wrong frame
      header: { frame_id: "camera_link", stamp: { sec: 1000, nanosec: 500_000_000 } },
    });
    expect(hasValidFeedback(wrongFrame, syntheticConfig)).toBe(false);
  });

  it("validates hardware joint angle limits with 0.006 degree tolerance", () => {
    // q1 limits: [-90, 90] degrees
    // Exact lower limit: -90 deg
    const atLower = createValidTelemetry({
      hardware_joint_state: {
        header: { frame_id: "arm_base_link", stamp: { sec: 1000, nanosec: 500_000_000 } },
        name: ["joint_1", "joint_2", "joint_3", "joint_4"],
        position: [-90 * Math.PI / 180, 0, 0, 0],
        velocity: [0, 0, 0, 0],
        effort: [],
      },
    });
    expect(hasValidFeedback(atLower, syntheticConfig)).toBe(true);

    // Slightly below lower limit within 0.006 deg tolerance (-90.005 deg)
    const slightlyBelow = createValidTelemetry({
      hardware_joint_state: {
        header: { frame_id: "arm_base_link", stamp: { sec: 1000, nanosec: 500_000_000 } },
        name: ["joint_1", "joint_2", "joint_3", "joint_4"],
        position: [-90.005 * Math.PI / 180, 0, 0, 0],
        velocity: [0, 0, 0, 0],
        effort: [],
      },
    });
    expect(hasValidFeedback(slightlyBelow, syntheticConfig)).toBe(true);

    // Out of bounds beyond tolerance (-90.01 deg)
    const outOfLower = createValidTelemetry({
      hardware_joint_state: {
        header: { frame_id: "arm_base_link", stamp: { sec: 1000, nanosec: 500_000_000 } },
        name: ["joint_1", "joint_2", "joint_3", "joint_4"],
        position: [-90.01 * Math.PI / 180, 0, 0, 0],
        velocity: [0, 0, 0, 0],
        effort: [],
      },
    });
    expect(hasValidFeedback(outOfLower, syntheticConfig)).toBe(false);

    // Out of upper bounds beyond tolerance (90.01 deg)
    const outOfUpper = createValidTelemetry({
      hardware_joint_state: {
        header: { frame_id: "arm_base_link", stamp: { sec: 1000, nanosec: 500_000_000 } },
        name: ["joint_1", "joint_2", "joint_3", "joint_4"],
        position: [90.01 * Math.PI / 180, 0, 0, 0],
        velocity: [0, 0, 0, 0],
        effort: [],
      },
    });
    expect(hasValidFeedback(outOfUpper, syntheticConfig)).toBe(false);
  });
});

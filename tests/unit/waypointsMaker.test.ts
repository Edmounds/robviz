import { describe, expect, it } from "vitest";

import { readRecorderState } from "../../src/plugins/waypoints-maker";

describe("waypoints-maker plugin", () => {
  it("parses recorder state wrapped in ROS String message", () => {
    const innerState = {
      status: "idle",
      message: "Ready",
      file_id: "odom",
      formal: true,
      version: "v123",
      disk_version: "v123",
      disk_synced: true,
      dirty: false,
      last_backup_path: "/tmp/backup.yaml",
      waypoints: {
        count: 2,
        cursor: 0,
        next_goal: "g1",
        next_name: "w2",
        final_yaw_mode: "blend_on_path",
        template: [
          { name: "w1", type: "waypoint", recorded: true },
          { name: "g1", type: "goal", recorded: false },
        ],
      },
      navigation: {
        active: false,
        goal_accepted: false,
        cancel_requested: false,
        awaiting_standstill: false,
        cursor: 0,
        next_goal: "g1",
      },
      points: [
        { name: "w1", type: "waypoint", position: { x: 1, y: 2, z: 0 }, yaw: 0 },
      ],
    };

    const rosStringMsg = { data: JSON.stringify(innerState) };
    const parsed = readRecorderState(rosStringMsg);

    expect(parsed).toBeDefined();
    expect(parsed?.status).toBe("idle");
    expect(parsed?.fileId).toBe("odom");
    expect(parsed?.formal).toBe(true);
    expect(parsed?.diskSynced).toBe(true);
    expect(parsed?.points).toHaveLength(1);
    expect(parsed?.points[0].name).toBe("w1");
    expect(parsed?.waypoints.template).toHaveLength(2);
  });

  it("handles malformed JSON string gracefully without throwing", () => {
    const badMsg = { data: "not a valid json {{" };
    expect(readRecorderState(badMsg)).toBeUndefined();
  });

  it("detects disk_synced false when disk_version differs", () => {
    const innerState = {
      status: "idle",
      message: "Ready",
      file_id: "odom",
      formal: true,
      version: "v1",
      disk_version: "v2",
      disk_synced: false,
      dirty: false,
      last_backup_path: "",
      waypoints: { count: 0, cursor: 0, next_goal: "", next_name: "", final_yaw_mode: "blend_on_path", template: [] },
      navigation: { active: false, goal_accepted: false, cancel_requested: false, awaiting_standstill: false, cursor: 0, next_goal: "" },
      points: [],
    };
    const parsed = readRecorderState({ data: JSON.stringify(innerState) });
    expect(parsed?.diskSynced).toBe(false);
  });
});

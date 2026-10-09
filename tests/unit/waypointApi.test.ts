import { describe, expect, it, vi } from "vitest";

import {
  fetchWaypointDocument,
  fetchWaypointFiles,
  saveWaypointDocument,
  WaypointApiError,
} from "../../src/core/waypointApi";

describe("waypointApi", () => {
  it("creates WaypointApiError with status and message", () => {
    const error = new WaypointApiError(404, "Not found");
    expect(error.name).toBe("WaypointApiError");
    expect(error.status).toBe(404);
    expect(error.message).toBe("Not found");
  });

  it("fetches waypoint files array", async () => {
    const mockFiles = [
      { id: "odom", label: "odom", profile: "nav", mode: "test", frame_id: "odom", file_name: "odom.yaml", file_available: true, formal: true, version: "v1", map: { available: true } },
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ files: mockFiles }),
    }));

    const result = await fetchWaypointFiles();
    expect(result).toEqual(mockFiles);
    vi.unstubAllGlobals();
  });

  it("throws WaypointApiError on non-ok HTTP response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "Conflict version" }),
    }));

    await expect(fetchWaypointDocument("odom")).rejects.toThrow("Conflict version");
    vi.unstubAllGlobals();
  });

  it("saves waypoint document with PUT payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ saved: true, file: "odom.yaml", backup: "odom.yaml.bak", version: "v2" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await saveWaypointDocument({
      id: "odom",
      version: "v1",
      points: [
        { name: "p1", type: "waypoint", x: 1, y: 2, z: 0, yaw_deg: 0, extra: {} },
      ],
    });

    expect(result.saved).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("/api/document", expect.objectContaining({ method: "PUT" }));
    vi.unstubAllGlobals();
  });
});

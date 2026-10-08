export type WaypointType = "waypoint" | "goal";

export interface WaypointPoint {
  name: string;
  type: WaypointType;
  x: number;
  y: number;
  z: number;
  yaw_deg: number;
  extra: Record<string, unknown>;
}

export interface WaypointTemplatePoint {
  index: number;
  name: string;
  type: WaypointType;
  dx: number | null;
  dy: number | null;
  dz: number | null;
  yaw_deg: number | null;
}

export interface WaypointFileInfo {
  id: string;
  label: string;
  profile: string;
  mode: string;
  frame_id: string;
  file_name: string;
  file_available: boolean;
  formal: boolean;
  version: string | null;
  map: { available: boolean; reason?: string };
}

export interface WaypointDocument {
  id: string;
  label: string;
  schema_version: number;
  frame_id: string;
  points: WaypointPoint[];
  template: WaypointTemplatePoint[];
  formal: boolean;
  version: string;
  map: { available: boolean; reason?: string };
}

export interface ImageStreamSettings {
  bandwidth_mbps: number;
  auto_quality: boolean;
  quality: number;
  width: number;
  height: number;
  max_fps: number;
}

export interface ImageSettings {
  version: number;
  session: string;
  rgb: ImageStreamSettings;
  depth: ImageStreamSettings;
}

export class WaypointApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "WaypointApiError";
    this.status = status;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new WaypointApiError(response.status, `HTTP ${response.status}: invalid JSON response`);
  }
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `HTTP ${response.status}`;
    throw new WaypointApiError(response.status, message);
  }
  return payload as T;
}

export async function fetchWaypointFiles(): Promise<WaypointFileInfo[]> {
  const payload = await requestJson<{ files: WaypointFileInfo[] }>("/api/files");
  if (!Array.isArray(payload.files)) throw new Error("waypoint 文件目录格式无效");
  return payload.files;
}

export function fetchWaypointDocument(id: string): Promise<WaypointDocument> {
  return requestJson<WaypointDocument>(`/api/document?id=${encodeURIComponent(id)}`);
}

export function saveWaypointDocument(
  document: Pick<WaypointDocument, "id" | "version"> & { points: WaypointPoint[] },
): Promise<{ saved: boolean; file: string; backup: string; version: string }> {
  return requestJson("/api/document", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(document),
  });
}

export function fetchImageSettings(): Promise<{ settings: ImageSettings; version: number }> {
  return requestJson("/api/image-settings");
}

export function applyImageSettings(
  settings: ImageSettings,
): Promise<{ applied: boolean; status: string; settings: ImageSettings; version: number }> {
  return requestJson("/api/image-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
}

export function saveImageSettingsDefaults(
  settings: ImageSettings,
): Promise<{ saved: boolean; status: string; backup: string | null; settings: ImageSettings; version: number }> {
  return requestJson("/api/image-settings/defaults", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
}

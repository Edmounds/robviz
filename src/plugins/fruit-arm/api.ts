import { z } from "zod";

export const frameSchema = z.enum(["cartesian", "joints", "link_angles"]);
export type CoordinateFrame = z.infer<typeof frameSchema>;
export const controlModeSchema = z.enum(["cartesian", "joints"]);
export type ControlMode = z.infer<typeof controlModeSchema>;
const finite = z.number().finite();
const arrayValue = (value: unknown) => ArrayBuffer.isView(value) && !(value instanceof DataView)
  ? Array.from(value as unknown as ArrayLike<number>) : value;
const vector = z.preprocess(arrayValue, z.tuple([finite, finite, finite, finite]));
const xyz = z.tuple([finite, finite, finite]);
export const waypointSchema = z.object({
  target: z.array(finite).min(4),
  duration_ms: z.number().int().positive().max(0xffffffff),
  gripper: z.number().int().min(0).max(2).optional(),
  dwell_ms: z.number().int().min(0).max(0xffffffff).optional(),
  linear: z.boolean().optional(),
  is_via_point: z.boolean().optional(),
}).passthrough();
export const presetSchema = z.object({
  description: z.string().optional(),
  coordinate_frame: frameSchema,
  waypoints: z.array(waypointSchema).min(1),
}).passthrough();
export const presetsSchema = z.record(z.string().min(1), presetSchema);
export const draftsSchema = z.record(z.string().min(1), presetSchema.extend({ waypoints: z.array(waypointSchema) }));
export type Waypoint = z.infer<typeof waypointSchema>;
export type Preset = z.infer<typeof presetSchema>;
export type Presets = z.infer<typeof presetsSchema>;
const channel = z.object({
  direction: z.union([z.literal(1), z.literal(-1)]),
  offset_deg: finite,
  limits_deg: z.tuple([finite, finite]).refine(([lo, hi]) => lo < hi),
}).passthrough();
export const configSchema = z.object({
  geometry: z.object({ d1: finite.positive(), a2: finite.positive(), a3: finite.positive(),
    a4: finite.positive(), tool_z_offset_m: finite }).passthrough(),
  joint_mapping: z.object({ q1: channel, q2: channel, q3: channel, q4: channel }).passthrough(),
  planning: z.object({ default_duration_ms: finite.int().positive(), interpolation_step_ms: finite.int().positive(),
    default_dwell_ms: finite.int().nonnegative(), status_max_age_sec: finite.positive().max(10),
    hover_height_m: finite }).passthrough(),
  presets: presetsSchema,
});
export type ArmConfiguration = z.infer<typeof configSchema>;
export const poseSchema = z.object({ hardware_rad: vector, hardware_deg: vector, model_rad: vector,
  link_deg: vector, tcp: vector, nodes: z.array(xyz).length(6) });
export type ArmPose = z.infer<typeof poseSchema>;
export const snapshotSchema = z.object({ configuration: configSchema, revision: z.string().min(1),
  presets_revision: z.string().min(1) });
export type Snapshot = z.infer<typeof snapshotSchema>;
export const documentSchema = snapshotSchema.extend({
  version: z.string().min(1),
  file: z.string(),
  preset_order: z.array(z.string().min(1)).optional(),
});
export type ArmDocument = z.infer<typeof documentSchema>;
const stamp = z.object({ sec: finite.int(), nanosec: finite.int().min(0).max(999999999) });
const header = z.object({ frame_id: z.literal("arm_base_link"), stamp });
const joints = z.object({ header, name: z.tuple([z.literal("joint_1"), z.literal("joint_2"),
  z.literal("joint_3"), z.literal("joint_4")]), position: vector,
  // Invalid velocity never means standstill, but does not invalidate finite positions.
  velocity: z.preprocess(arrayValue, z.array(z.unknown()).length(4)),
});
export const telemetrySchema = z.object({ header, hardware_joint_state: joints, model_joint_state: joints,
  tcp_position: z.object({ x: finite, y: finite, z: finite }), tcp_pitch_deg: finite,
  trajectory_id: finite.int().nonnegative(), task_status: finite.int().nonnegative(),
  progress: finite, gripper_state: finite.int().nonnegative(), error_code: finite.int().nonnegative(),
}).refine((value) => [value.hardware_joint_state, value.model_joint_state].every((joint) =>
  joint.header.stamp.sec === value.header.stamp.sec && joint.header.stamp.nanosec === value.header.stamp.nanosec));
export type Telemetry = z.infer<typeof telemetrySchema>;
export const resultSchema = z.object({ success: z.boolean(), message: z.string(),
  trajectory_id: finite.int().nonnegative().optional() });
export const configurationReplySchema = resultSchema.extend({
  config_path: z.string(), revision: z.string().min(1), configuration_yaml: z.string().min(1),
  max_trajectory_points: finite.int().min(2).max(64),
});

export interface RuntimeTask {
  id: string;
  state: "STOPPED" | "STARTING" | "RUNNING";
  ready: boolean;
  detail: string;
  pid: number | null;
  dependencies: RuntimeTask[];
  checked_at: string;
}

export const runtimeTaskSchema: z.ZodType<RuntimeTask> = z.lazy(() => z.object({
  id: z.string(),
  state: z.enum(["STOPPED", "STARTING", "RUNNING"]),
  ready: z.boolean(),
  detail: z.string(),
  pid: z.number().int().nullable(),
  dependencies: z.array(runtimeTaskSchema),
  checked_at: z.string(),
}));

export const runtimeTaskReplySchema = z.object({
  task: runtimeTaskSchema,
  started: z.array(z.string()).optional(),
  reused: z.array(z.string()).optional(),
  stopped: z.array(z.string()).optional(),
});
export type RuntimeTaskReply = z.infer<typeof runtimeTaskReplySchema>;

export function fmt(value: number, places = 3): string {
  return Number.isFinite(value) ? value.toFixed(places) : "?";
}

export function reorderArray<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length || fromIndex === toIndex) {
    return [...list];
  }
  const result = [...list];
  const [item] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, item);
  return result;
}

export function normalizePresetOrder(order: string[] | undefined, presets: Record<string, unknown> | undefined): string[] {
  if (!presets) return [];
  const existingKeys = Object.keys(presets);
  if (!order || !order.length) return existingKeys;
  const valid = new Set(existingKeys);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const key of order) {
    if (valid.has(key) && !seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  for (const key of existingKeys) {
    if (!seen.has(key)) {
      result.push(key);
    }
  }
  return result;
}

export function isPresetOrderEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, i) => item === b[i]);
}

export function same(a: unknown, b: unknown): boolean {
  const ordered = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(ordered);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value)
      .sort(([x], [y]) => x.localeCompare(y)).map(([key, item]) => [key, ordered(item)]));
    return value;
  };
  return JSON.stringify(ordered(a)) === JSON.stringify(ordered(b));
}

export async function armRequest(path: string, _bridgeUrl?: string, body?: unknown,
  method = "POST", signal?: AbortSignal, timeoutMs = 10_000): Promise<unknown> {
  const deadline = AbortSignal.timeout(timeoutMs);
  const waiting = signal ? AbortSignal.any([signal, deadline]) : deadline;
  const response = await fetch(`/api/arm/${path}`, body === undefined
    ? { signal: waiting }
    : { method, signal: waiting, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const error = z.object({ error: z.string() }).safeParse(payload);
    throw new Error(error.success ? error.data.error : `HTTP ${response.status}`);
  }
  return payload;
}

export async function runtimeRequest(path: string, serviceBaseUrl: string, body?: unknown,
  method = "POST", signal?: AbortSignal, timeoutMs = 10_000): Promise<unknown> {
  const base = serviceBaseUrl.replace(/\/+$/, "");
  const target = `${base}/api/runtime/${path}`;
  const deadline = AbortSignal.timeout(timeoutMs);
  const waiting = signal ? AbortSignal.any([signal, deadline]) : deadline;
  const response = await fetch(target, body === undefined
    ? { method, signal: waiting }
    : { method, signal: waiting, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const error = z.object({ error: z.string() }).safeParse(payload);
    throw new Error(error.success ? error.data.error : `HTTP ${response.status}`);
  }
  return payload;
}

export function hasValidFeedback(value: Telemetry | { message: Telemetry } | null,
  config: ArmConfiguration | null): boolean {
  if (!value || !config) return false;
  const message = "message" in value ? value.message : value;
  const parsed = telemetrySchema.safeParse(message);
  if (!parsed.success) return false;
  return parsed.data.hardware_joint_state.position.every((angle, i) => {
    const limits = config.joint_mapping[(["q1", "q2", "q3", "q4"] as const)[i]].limits_deg;
    const degrees = angle * 180 / Math.PI;
    return degrees >= limits[0] - 0.006 && degrees <= limits[1] + 0.006;
  });
}

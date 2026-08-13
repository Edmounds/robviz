/** ROS 2 消息的 TS 类型（只声明我们用到的字段） */

export interface Time {
  sec: number;
  nanosec: number;
}

export interface Header {
  stamp: Time;
  frame_id: string;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Pose {
  position: Vector3;
  orientation: Quaternion;
}

export interface Transform {
  translation: Vector3;
  rotation: Quaternion;
}

export interface TransformStamped {
  header: Header;
  child_frame_id: string;
  transform: Transform;
}

export interface TFMessage {
  transforms: TransformStamped[];
}

export interface LaserScan {
  header: Header;
  angle_min: number;
  angle_max: number;
  angle_increment: number;
  time_increment: number;
  scan_time: number;
  range_min: number;
  range_max: number;
  ranges: Float32Array;
  intensities: Float32Array;
}

export interface MapMetaData {
  map_load_time: Time;
  resolution: number;
  width: number;
  height: number;
  origin: Pose;
}

export interface OccupancyGrid {
  header: Header;
  info: MapMetaData;
  data: Int8Array;
}

export interface PointField {
  name: string;
  offset: number;
  datatype: number;
  count: number;
}

export interface PointCloud2 {
  header: Header;
  height: number;
  width: number;
  fields: PointField[];
  is_bigendian: boolean;
  point_step: number;
  row_step: number;
  data: Uint8Array;
  is_dense: boolean;
}

export interface PoseStamped {
  header: Header;
  pose: Pose;
}

export interface Path {
  header: Header;
  poses: PoseStamped[];
}

export interface Odometry {
  header: Header;
  child_frame_id: string;
  pose: { pose: Pose; covariance: Float64Array };
  twist: {
    twist: { linear: Vector3; angular: Vector3 };
    covariance: Float64Array;
  };
}

/** 秒（float64）。纳秒精度对插值无意义，微秒级足够 */
export type TimeSec = number;

export function toSec(t: Time): TimeSec {
  return t.sec + t.nanosec * 1e-9;
}

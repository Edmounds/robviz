/**
 * 模拟器的频道清单。schema 文本统一在 src/core/rosSchemas.ts
 * （编码端与解码端共用同一份，用同一个库互检）。
 */
import {
  COMPRESSED_IMAGE_SCHEMA,
  FLOAT32_SCHEMA,
  IMAGE_SCHEMA,
  JOINT_STATE_SCHEMA,
  LASER_SCAN_SCHEMA,
  MARKER_ARRAY_SCHEMA,
  OCCUPANCY_GRID_SCHEMA,
  ODOMETRY_SCHEMA,
  PATH_SCHEMA,
  POINT_CLOUD2_SCHEMA,
  TF_MESSAGE_SCHEMA,
} from "../src/core/rosSchemas";

export interface ChannelSpec {
  topic: string;
  schemaName: string;
  schema: string;
}

export const CHANNELS: ChannelSpec[] = [
  { topic: "/tf", schemaName: "tf2_msgs/msg/TFMessage", schema: TF_MESSAGE_SCHEMA },
  { topic: "/scan", schemaName: "sensor_msgs/msg/LaserScan", schema: LASER_SCAN_SCHEMA },
  { topic: "/map", schemaName: "nav_msgs/msg/OccupancyGrid", schema: OCCUPANCY_GRID_SCHEMA },
  { topic: "/cloud", schemaName: "sensor_msgs/msg/PointCloud2", schema: POINT_CLOUD2_SCHEMA },
  { topic: "/path", schemaName: "nav_msgs/msg/Path", schema: PATH_SCHEMA },
  { topic: "/odom", schemaName: "nav_msgs/msg/Odometry", schema: ODOMETRY_SCHEMA },
  { topic: "/camera/depth", schemaName: "sensor_msgs/msg/Image", schema: IMAGE_SCHEMA },
  {
    topic: "/camera/color/compressed",
    schemaName: "sensor_msgs/msg/CompressedImage",
    schema: COMPRESSED_IMAGE_SCHEMA,
  },
  { topic: "/joint_states", schemaName: "sensor_msgs/msg/JointState", schema: JOINT_STATE_SCHEMA },
  { topic: "/markers", schemaName: "visualization_msgs/msg/MarkerArray", schema: MARKER_ARRAY_SCHEMA },
  { topic: "/battery", schemaName: "std_msgs/msg/Float32", schema: FLOAT32_SCHEMA },
];

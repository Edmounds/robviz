/**
 * ros2msg schema 文本（与 foxglove_bridge 广播格式一致：拼接 .msg 定义，
 * 80 个 '=' + `MSG: <pkg>/<Type>` 分隔）。模拟器编码、客户端发布编码、
 * CLI 发布共用同一份，保证互检。
 */

const SEP = "=".repeat(80);

const TIME = `MSG: builtin_interfaces/Time
int32 sec
uint32 nanosec`;

const DURATION = `MSG: builtin_interfaces/Duration
int32 sec
uint32 nanosec`;

const HEADER = `MSG: std_msgs/Header
builtin_interfaces/Time stamp
string frame_id`;

const VECTOR3 = `MSG: geometry_msgs/Vector3
float64 x
float64 y
float64 z`;

const QUATERNION = `MSG: geometry_msgs/Quaternion
float64 x
float64 y
float64 z
float64 w`;

const POINT = `MSG: geometry_msgs/Point
float64 x
float64 y
float64 z`;

const POSE = `MSG: geometry_msgs/Pose
geometry_msgs/Point position
geometry_msgs/Quaternion orientation`;

const TRANSFORM = `MSG: geometry_msgs/Transform
geometry_msgs/Vector3 translation
geometry_msgs/Quaternion rotation`;

const TWIST = `MSG: geometry_msgs/Twist
geometry_msgs/Vector3 linear
geometry_msgs/Vector3 angular`;

const COLOR_RGBA = `MSG: std_msgs/ColorRGBA
float32 r
float32 g
float32 b
float32 a`;

const COMPRESSED_IMAGE_MSG = `MSG: sensor_msgs/CompressedImage
std_msgs/Header header
string format
uint8[] data`;

function schema(main: string, ...deps: string[]): string {
  return [main, ...deps].join(`\n${SEP}\n`);
}

// ---- 订阅方向（模拟器发布） ----

export const TF_MESSAGE_SCHEMA = schema(
  `geometry_msgs/TransformStamped[] transforms`,
  `MSG: geometry_msgs/TransformStamped
std_msgs/Header header
string child_frame_id
geometry_msgs/Transform transform`,
  HEADER,
  TIME,
  TRANSFORM,
  VECTOR3,
  QUATERNION,
);

export const LASER_SCAN_SCHEMA = schema(
  `std_msgs/Header header
float32 angle_min
float32 angle_max
float32 angle_increment
float32 time_increment
float32 scan_time
float32 range_min
float32 range_max
float32[] ranges
float32[] intensities`,
  HEADER,
  TIME,
);

export const OCCUPANCY_GRID_SCHEMA = schema(
  `std_msgs/Header header
nav_msgs/MapMetaData info
int8[] data`,
  `MSG: nav_msgs/MapMetaData
builtin_interfaces/Time map_load_time
float32 resolution
uint32 width
uint32 height
geometry_msgs/Pose origin`,
  HEADER,
  TIME,
  POSE,
  POINT,
  QUATERNION,
);

export const POINT_CLOUD2_SCHEMA = schema(
  `std_msgs/Header header
uint32 height
uint32 width
sensor_msgs/PointField[] fields
bool is_bigendian
uint32 point_step
uint32 row_step
uint8[] data
bool is_dense`,
  `MSG: sensor_msgs/PointField
string name
uint32 offset
uint8 datatype
uint32 count`,
  HEADER,
  TIME,
);

export const PATH_SCHEMA = schema(
  `std_msgs/Header header
geometry_msgs/PoseStamped[] poses`,
  `MSG: geometry_msgs/PoseStamped
std_msgs/Header header
geometry_msgs/Pose pose`,
  HEADER,
  TIME,
  POSE,
  POINT,
  QUATERNION,
);

export const ODOMETRY_SCHEMA = schema(
  `std_msgs/Header header
string child_frame_id
geometry_msgs/PoseWithCovariance pose
geometry_msgs/TwistWithCovariance twist`,
  `MSG: geometry_msgs/PoseWithCovariance
geometry_msgs/Pose pose
float64[36] covariance`,
  `MSG: geometry_msgs/TwistWithCovariance
geometry_msgs/Twist twist
float64[36] covariance`,
  TWIST,
  HEADER,
  TIME,
  POSE,
  POINT,
  QUATERNION,
  VECTOR3,
);

export const IMAGE_SCHEMA = schema(
  `std_msgs/Header header
uint32 height
uint32 width
string encoding
uint8 is_bigendian
uint32 step
uint8[] data`,
  HEADER,
  TIME,
);

export const COMPRESSED_IMAGE_SCHEMA = schema(
  `std_msgs/Header header
string format
uint8[] data`,
  HEADER,
  TIME,
);

export const JOINT_STATE_SCHEMA = schema(
  `std_msgs/Header header
string[] name
float64[] position
float64[] velocity
float64[] effort`,
  HEADER,
  TIME,
);

export const FLOAT32_SCHEMA = `float32 data`;

/** visualization_msgs/msg/Marker（Humble 版字段，验证解码对纹理等新字段的鲁棒性） */
const MARKER_MSG = `MSG: visualization_msgs/Marker
int32 ARROW=0
int32 CUBE=1
int32 SPHERE=2
int32 CYLINDER=3
int32 LINE_STRIP=4
int32 LINE_LIST=5
int32 CUBE_LIST=6
int32 SPHERE_LIST=7
int32 POINTS=8
int32 TEXT_VIEW_FACING=9
int32 MESH_RESOURCE=10
int32 TRIANGLE_LIST=11
int32 ADD=0
int32 MODIFY=0
int32 DELETE=2
int32 DELETEALL=3
std_msgs/Header header
string ns
int32 id
int32 type
int32 action
geometry_msgs/Pose pose
geometry_msgs/Vector3 scale
std_msgs/ColorRGBA color
builtin_interfaces/Duration lifetime
bool frame_locked
geometry_msgs/Point[] points
std_msgs/ColorRGBA[] colors
string texture_resource
sensor_msgs/CompressedImage texture
visualization_msgs/UVCoordinate[] uv_coordinates
string text
string mesh_resource
visualization_msgs/MeshFile mesh_file
bool mesh_use_embedded_materials`;

const MARKER_DEPS = [
  MARKER_MSG,
  `MSG: visualization_msgs/UVCoordinate
float32 u
float32 v`,
  `MSG: visualization_msgs/MeshFile
string filename
uint8[] data`,
  COMPRESSED_IMAGE_MSG,
  COLOR_RGBA,
  DURATION,
  HEADER,
  TIME,
  POSE,
  POINT,
  QUATERNION,
  VECTOR3,
];

export const MARKER_ARRAY_SCHEMA = schema(
  `visualization_msgs/Marker[] markers`,
  ...MARKER_DEPS,
);

// ---- 发布方向（客户端 → bridge） ----

export const TWIST_SCHEMA = schema(TWIST.replace("MSG: geometry_msgs/Twist\n", ""), VECTOR3);

export const POSE_STAMPED_SCHEMA = schema(
  `std_msgs/Header header
geometry_msgs/Pose pose`,
  HEADER,
  TIME,
  POSE,
  POINT,
  QUATERNION,
);

export const POSE_WITH_COVARIANCE_STAMPED_SCHEMA = schema(
  `std_msgs/Header header
geometry_msgs/PoseWithCovariance pose`,
  `MSG: geometry_msgs/PoseWithCovariance
geometry_msgs/Pose pose
float64[36] covariance`,
  HEADER,
  TIME,
  POSE,
  POINT,
  QUATERNION,
);

export const STRING_SCHEMA = `string data`;
export const BOOL_SCHEMA = `bool data`;

/** 客户端可发布的类型库：schemaName → schema 文本 */
export const PUB_SCHEMAS: Record<string, string> = {
  "geometry_msgs/msg/Twist": TWIST_SCHEMA,
  "geometry_msgs/msg/PoseStamped": POSE_STAMPED_SCHEMA,
  "geometry_msgs/msg/PoseWithCovarianceStamped": POSE_WITH_COVARIANCE_STAMPED_SCHEMA,
  "std_msgs/msg/String": STRING_SCHEMA,
  "std_msgs/msg/Bool": BOOL_SCHEMA,
};

// ---- 服务 ----

export const SET_BOOL_REQUEST_SCHEMA = `bool data`;
export const SET_BOOL_RESPONSE_SCHEMA = `bool success
string message`;
/** ROS2 空消息在 CDR 里有一个占位字节 */
export const TRIGGER_REQUEST_SCHEMA = `uint8 structure_needs_at_least_one_member`;
export const TRIGGER_RESPONSE_SCHEMA = `bool success
string message`;

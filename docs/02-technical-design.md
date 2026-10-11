# RobViz 技术方案

> 配套文档：[01-execution-plan.md](./01-execution-plan.md)（范围与里程碑）、[03-ui-design.md](./03-ui-design.md)（UI 规范）。

## 1. 总体架构

```
┌─ 机器人（真机）──────────┐        ┌─ 开发机（浏览器）────────────────────────┐
│ ROS 2                   │        │  Main Thread                Worker      │
│  └─ foxglove_bridge     │◄──ws──►│  ┌───────────┐  postMessage ┌─────────┐ │
│     (ws://robot:8765)   │  CDR   │  │ React UI   │◄─(Transfer)─│ 连接+解码 │ │
└─────────────────────────┘ 二进制  │  │ three.js   │             └─────────┘ │
                                   │  │ TF Buffer  │                         │
                                   │  └───────────┘                          │
                                   └──────────────────────────────────────────┘
```

关键点：

- **唯一的机器人侧依赖是 `foxglove_bridge`**（apt 可装，官方维护，多客户端）。

## 2. 目录结构（单包，非 monorepo）

```
robviz/
├── docs/                    # 本文档体系
├── src/
│   ├── core/                # ★ 零 React / 零 DOM 依赖，Node 与浏览器通用
│   │   ├── FoxgloveConnection.ts   # ws-protocol 客户端封装、订阅管理、解码
│   │   ├── TfBuffer.ts             # TF 时间缓冲与插值
│   │   ├── RingBuffer.ts           # Plot 用环形缓冲（M3）
│   │   ├── pointcloud.ts           # PointCloud2 字段解析 → Float32Array
│   │   └── types.ts                # ROS 消息 TS 类型、内部数据结构
│   ├── worker/
│   │   └── connection.worker.ts    # Worker 入口：持有连接，解码后转发
│   ├── bridge/
│   │   └── WorkerBridge.ts         # 主线程侧的 Worker 代理（订阅 API）
│   ├── renderers/           # three.js 显示器，每类消息一个类
│   │   ├── SceneManager.ts         # 场景、相机、控制器、渲染循环、TF 应用
│   │   ├── TfAxesRenderer.ts
│   │   ├── GridRenderer.ts         # OccupancyGrid
│   │   ├── LaserScanRenderer.ts
│   │   ├── PointCloudRenderer.ts
│   │   └── PathRenderer.ts
│   ├── panels/              # 内置 React 面板
│   │   ├── ThreeDPanel/
│   │   ├── TopicsPanel/
│   │   └── ...（Image/Plot/Teleop/Urdf/... 按里程碑加）
│   ├── app/                 # 布局、主题、连接状态
│   └── main.tsx
└── tests/                   # vitest：unit/ + integration/
```

## 3. 数据通道与解码

### 3.1 协议

`@foxglove/ws-protocol`（MIT），子协议 `foxglove.websocket.v1`：

- 服务端 `advertise`：`{id, topic, encoding: "cdr", schemaName, schema}`，schema 为 ros2msg 拼接文本（`===` 分隔符 + `MSG: pkg/Type`）。
- 客户端 `subscribe(channelId)` → 服务端推二进制帧：`op(1B) + subscriptionId(4B) + receiveTime(8B, ns) + CDR payload`。
- 客户端能力（M3 用）：`clientPublish`（advertise + 发消息）、`services`（调用 service）、`parameters`。

### 3.2 解码管线

```
ArrayBuffer(CDR) ─ @foxglove/rosmsg.parse(schema, {ros2:true})
                 ─ @foxglove/rosmsg2-serialization.MessageReader
                 → JS 对象（TypedArray 字段零拷贝引用原 buffer）
```

- 每个 channel 首次订阅时构建 MessageReader 并缓存。
- **解码发生在 Worker**。主线程通过 `WorkerBridge.subscribe(topic, cb)` 拿解码结果。
- 大负载（PointCloud2.data、Image.data）在 postMessage 时 **Transferable 转移所有权**，零拷贝。
- 小消息（TF、Odometry）直接结构化克隆，开销可忽略。
- PointCloud2 在 Worker 内直接完成"字段解析 → 预备好的 `positions/colors Float32Array`"，主线程只做 `bufferAttribute.set()`，避免主线程遍历百万点。

### 3.3 Node 复用

`FoxgloveConnection` 构造时注入 WebSocket 实现（浏览器原生 / Node `ws` 包），核心逻辑一份代码。测试直接在 Node 里实例化，不经过 Worker。

## 4. TF 系统

对齐 tf2 语义的最小实现：

- 数据结构：`Map<childFrame, {parent: string, samples: 有序数组<{time, translation, rotation}>}>`，每 frame 保留 10s 时间窗，越界批量裁剪。
- 查询 `lookup(targetFrame, sourceFrame, time)`：
  1. 从 source 沿 parent 指针上溯到根，得链 A；target 同理得链 B；找公共祖先。
  2. 每段变换在 samples 里二分查找相邻两帧，translation 线性插值、rotation 四元数 slerp（自实现，不依赖 three.js，保持 core 纯净）。
  3. 链上矩阵连乘得最终变换。
- `/tf_static` 单独存储，时间无关。
- 渲染循环每帧对每个显示器调用 `lookup(fixedFrame, msgFrame, renderTime)`，把结果写进 `Object3D.matrix`（矩阵直写，跳过 position/quaternion 分解）。
- 失败语义：链断开返回 `undefined`，显示器隐藏该对象并在 UI 标黄——这是调 TF 问题时的重要信号，不能静默。

## 5. 渲染管线（three.js）

- 单一 `Scene` + `WebGLRenderer`，按需渲染升级为固定 60fps 循环（有流式数据时始终在动，不做省电优化，KISS）。
- 坐标约定：ROS 是 Z-up 右手系，three.js 默认 Y-up。**场景根节点做一次 Z-up 适配旋转**，所有 ROS 数据原样进场景，相机控制器配置 Z 为上。
- 每个渲染器的原则：
  - **缓冲预分配 + 复用**：`BufferGeometry` 按容量分配（如点云 2^20 点起步，不够翻倍），更新只写 `attribute.array` + `needsUpdate`，绝不逐帧 new。
  - OccupancyGrid：`DataTexture(R8)` + 自定义着色器把 `[-1,0..100]` 映射为 未知/自由/占用 三段色，`magFilter: Nearest`。
  - LaserScan / PointCloud2：`THREE.Points` + shader material，着色模式（强度/高度/单色）作 uniform。
  - 累积模式（Point-LIO）：环形写入超大缓冲（默认 4M 点，可配），`drawRange` 控制有效区间。
- 交互工具（M3）：Nav Goal 通过 raycaster 打到地面平面取点，拖拽定朝向，经 WorkerBridge `clientPublish` 发 `PoseStamped`。

## 8. 性能与网络韧性（已实现，2026-08-13 实测）

### 8.1 数据流性能策略

| 策略 | 位置 | 说明 |
| --- | --- | --- |
| latest-wins 合并 | Worker | 传感器流（点云/图像/栅格/scan/path/odom）在 4ms 合帧窗口内只留最新帧，消费不过来时**丢过期帧而不是排队**，延迟有界。TF 全量保序（插值缓冲需要每个样本） |
| 合帧 postMessage | Worker→主线程 | 突发消息合并为一次 postMessage，降低跨线程开销 |
| 帧对齐二级合并 | WorkerBridge | 大负载（cloud/grid）挂 per-topic 最新槽，渲染循环开头统一消费；两帧之间到多帧只渲染最新 |
| 缓冲池回收 | 双向 | 点云/栅格输出缓冲主线程用完 Transferable 归还 Worker 复用，稳态**零大内存分配**（上限 24 块 / 128MB） |
| 按需渲染 | SceneManager | 脏标记驱动：仅数据更新/相机运动/布局变化时渲染。空闲时 render 0/s，**主机占用趋近零**；数据流动时渲染率跟随数据率（TF 30Hz → ~30 render/s），不空转 60fps |
| GPU 端着色 | shader | turbo colormap 在片元着色器算，主线程零遍历；点云 attribute 预分配 + DynamicDrawUsage 局部更新 |
| TF frames 缓存 | TfBuffer | frame 列表按拓扑版本缓存，渲染热路径零分配 |

### 8.2 网络韧性策略

| 策略 | 说明 |
| --- | --- |
| 指数退避重连 | 基数 500ms × 1.7ⁿ，上限 10s，±30% 抖动（防重启惊群）；连接稳定 15s 后才清零失败次数，重连后自动恢复全部订阅 |
| 协议心跳 | 服务端支持 parameters 时每 3s 发送只读 sentinel 参数请求，>10s 无任何协议响应才重连；业务话题静默不代表连接失效，不支持心跳的服务端依赖 WebSocket close |
| 后台会话节流 | 非活动机器保留 WebSocket、话题列表和协议心跳，但退订业务话题并回收待消费帧；切回时按原频率配置恢复订阅 |
| 滞后估计 | (本地时钟 − 服务端时间戳) 的运行最小值为基线，增量即网络/排队滞后；HUD 常显，>200ms 黄色告警。基线以 ~1ms/s 上浮适应时钟漂移 |
| TF 抖动缓冲 | 渲染时间 = 最新 TF − 自适应延迟（2×抖动EWMA + 0.5×周期EWMA，钳 20~300ms）。理想网络 ≈20ms；抖动网络自动加大，运动保持平滑不跳变 |
| 服务端丢帧容忍 | 真实 foxglove_bridge 在 send_buffer_limit（默认 10MB）满时服务端丢消息；客户端设计为无序号依赖：TF 靠插值、传感器流靠 latest-wins，天然容忍缺口 |
| TF 断链显性化 | lookup 失败隐藏对象 + HUD 黄字告警，绝不静默 |

### 8.3 实测结果（M1 管线，Apple Silicon + Chrome）

| 场景 | 结果 |
| --- | --- |
| 常规（0.7MB/s, 48msg/s） | 滞后 11ms，render 32/s（数据驱动），TF 平滑 20ms |
| 压测（29.8MB/s，30.7 万点/帧 × 5Hz ≈ 150 万点/s） | 滞后 4-5ms 稳定，零丢帧，全部话题满速率 |
| 混沌网络（0-40ms 抖动 + 周期 1.5s 停顿 + 每 20s 强制断连） | 自动重连 + 订阅自愈，滞后有界 ~40ms 不增长，TF 平滑自适应至 ~50ms，断连期间 render 0/s |

回归时连接真机数据流，HUD 角标常显吞吐、滞后与渲染率。

## 8.5 大地图工作流（M1.75，已实现，2026-08-13 实测）

### PCD 加载管线

面向重定位地图浏览：Mid-360 + Point-LIO 的建图产物通常是千万点、数百 MB 的 binary PCD。

- **格式**：`core/pcd.ts` 支持 ascii / binary / binary_compressed。binary_compressed 是
  LZF 压缩 + **SoA 布局**（按字段分块，与 binary 的 AoS 不同），LZF 解压自实现（~30 行）。
- **解析位置**：专用 `pcd.worker.ts`（一次性任务，与连接 Worker 分离），结果 Transferable 零拷贝返回。
  binary 快路径：x/y/z 连续 float32 时按 Float32Array 步进读取；数据区未 4 字节对齐时一次
  memcpy 换对齐（PCD 头长度不定），避免逐点 DataView。
- **体素降采样**：加载时可选（0.05/0.1/0.2m/原始）。每体素保留首点（可视化足够）；
  体素 key 用 17bit×3 打包进 float64 精确整数域，Set 去重，无字符串开销。
- **渲染**：`EditableCloudRenderer` 静态几何一次上载，复用点云 turbo 着色器（`pointsShader.ts`）。
- **实测**：20M 点 / 320MB binary → 0.1m 降采样 3.76M 点，选文件到显示约 3s，主线程无卡顿。

### 点云清理（CloudCompare-lite）

目标场景：建图后清除动态物体拖影。刻意只做矩形框选，不做套索/多边形（KISS）。

- 纯函数核心在 `core/cloudEdit.ts`（Node 可测）：`selectInRect`（MVP 投影到 NDC 判交，
  含 w>0 与近远平面裁剪）→ `applyMask`（框删/框留二选一，返回被移除点）→ `appendPoints`（撤销）。
- 撤销栈存**被移除的点**而非快照：点云无序，撤销 = 追加回去，删一小块只花一小块内存。上限 20 步。
- 操作即时生效（松开鼠标就删），无"先选中再删除"的中间态。
- 导出 binary PCD（x y z intensity）。

### 2D 地图编辑

- `core/mapio.ts`：map_server 格式 PGM(P5/P2)+YAML 读写，occupied/free 阈值语义与
  map_server 一致；PGM 行序与 OccupancyGrid 行序垂直翻转在读写两侧对称处理。
- 编辑器是独立 2D canvas 面板（不进 3D 场景）：offscreen ImageData 全量 + 脏区域 blit，
  画笔（圆刷 + 事件点间线性插值）/矩形填充，占用/自由/未知三值，撤销为全量快照（上限 10，
  典型 2000² 地图一张 4MB）。右键平移、滚轮以光标为中心缩放。
- 数据来源：PGM+YAML 文件多选，或"从 /map 抓取"（走 WorkerBridge 订阅一条即退订）。
- 导出：PGM + YAML 两个下载，可直接喂 map_server / nav2 map_server。

## 8.6 双向链路与面板层（M2/M3，已实现，2026-08-13 实测）

### 客户端发布与服务调用

- **发布**：`FoxgloveConnection.publish(topic, schemaName, message)`。客户端编码需要 schema，
  维护一个小型发布类型库 `core/rosSchemas.ts::PUB_SCHEMAS`（Twist / PoseStamped /
  PoseWithCovarianceStamped / String / Bool）。首次发布 advertise 客户端通道，断线后自动重
  advertise（`#pubChannels` 随 close 清空）。
- **服务**：请求/响应 schema 来自服务端 advertiseServices，**任何服务类型都可调**，不需要
  客户端内置。请求体用 `core/msgDefaults.ts` 按 schema 生成默认 JSON 预填。空请求 schema
  写入 ROS2 空结构占位字节（CDR 头 + 1 字节），兼容 rclcpp 反序列化。
- 主线程走 WorkerBridge 转发（`publish` 单向、`callService` 带 id 的 Promise 往返）。

### 图像管线

- Worker 侧把 `sensor_msgs/Image`、`CompressedImage` 的 data 拷入池缓冲 Transferable 转移
  （latest-wins，同点云）；主线程 ImagePanel 收到后**同步消费**（缓冲随即回收）。
- CompressedImage → `createImageBitmap`（浏览器原生 JPEG/PNG 解码，GPU 加速）。
- raw Image → TypedArray 转 RGBA：rgb8/bgr8/rgba8/bgra8/mono8 直转；32FC1/16UC1/mono16
  为深度图，逐帧采样求量程后 turbo 上色（复用 `renderers/colormap.ts`）。
- 悬停取值：面板保留最近一帧原始像素的拷贝，mousemove 按 canvas 缩放比例映射回像素坐标，
  深度显示米数（16UC1 同显毫米原值）。VGA@5Hz 拷贝 + 上色 <3ms，不需要再进 Worker。

### 曲线面板

- uPlot（Canvas 绘制，微秒级 setData）+ 每序列环形缓冲（60s 窗口 / 3000 点双限）。
- 字段用点路径（`twist.twist.linear.x`），时间轴取 header.stamp（无 header 用到达时间）。
- 数据在订阅回调进缓冲，图表 10Hz 定时 `uPlot.join` 对齐多序列重绘，暂停只停重绘不停采集。

### Marker 与多 frame 显示器

- `Display` 接口扩展可选 `tick(tf, fixedFrame, time, broken)`：定义了则 SceneManager 跳过
  标准的整体 frameId 变换，显示器自管 TF。MarkerRenderer / URDF 都是多 frame 内容。
- MarkerRenderer 按 `ns/id` 管理对象，2Hz 全量重建（数量小，省 diff 复杂度）；TEXT 用
  canvas 纹理 sprite，内容不变只更新位姿不重建纹理。CUBE_LIST/SPHERE_LIST 用 InstancedMesh。

### URDF

- `urdf-loader`（gkjohnson）解析 URDF XML；mesh 引用（`package://` / 相对路径）按
  **basename 匹配**用户多选的文件集合，生成 blob URL 交给 STL/Collada/OBJ loader。
  放弃精确路径解析：真实工程里 mesh 引用路径千奇百怪，basename 匹配覆盖绝大多数且失败可见。
- 模型挂到用户选的 TF frame（默认 base_link）；关节滑块与订阅 /joint_states 互斥切换。
- 场景加了 Hemisphere + Directional 光照（实体网格需要；点云/线条无光材质不受影响）。

### Teleop 与 Nav 工具

- Teleop 启用时 10Hz 持续发布（真机 cmd_vel 超时保护依赖持续流），退出发一帧零速。
- Nav Goal / Pose Estimate：相机反投影到 z=0 平面（`origin + t·dir, t = -o.z/d.z`），
  按下定位置、拖动定朝向、松开发布，frame 用当前 fixed frame。

## 8.8 故障隔离（2026-08-13 注入实测）

原则：**任何单点故障只影响自己那一层，其余功能与数据流照常**。四层舱壁：

| 层 | 机制 | 故障注入实测 |
| --- | --- | --- |
| React 面板/区块 | `ErrorBoundary` 包裹每个 dock 面板与侧栏区块（遥控/服务/URDF/TF 树/地图编辑），崩溃显示错误 + 重置按钮；`main.tsx` 顶层兜底 | 曲线面板 render 抛错 → 面板内显示"出错（已隔离）"，旁边图像面板与 3D 视图照常 |
| 消息分发 | WorkerBridge 与 FoxgloveConnection 逐 handler try/catch，错误按 topic 限流上报（1 次/5s） | LaserScan 渲染器每帧抛错（10Hz）→ 状态栏一条隔离提示，点云/路径/地图 0.6 MB/s 照常 |
| 3D 渲染循环 | SceneManager 逐显示器 try/catch，连续 5 帧出错自动禁用该显示器并上报，其余照常渲染 | 同上（渲染循环侧兜底） |
| 连接 Worker | `worker.onerror` → 拒绝挂起服务调用、1s 限流重建 Worker、自动重连并恢复订阅；Worker 内单条消息解析失败只丢该帧 | 定时炸弹让 Worker 每 5s 崩溃 → 每次自动重启，三次采样数据流始终 0.6-0.7 MB/s、状态"已连接" |

验收方式：临时注入三种崩溃（面板 render 抛错 / 渲染器 update 抛错 / Worker 未捕获异常），
浏览器实测隔离与自愈后移除注入代码（`rg 故障注入` 确认无残留）。

## 8.9 远程终端

- UI 懒加载 `@xterm/xterm`，底部抽屉横跨工作区；隐藏只改变布局，不卸载组件或断开会话。
- 开发模式由 Vite 启动钩子自动运行 `terminal/server.ts`；使用 preview/静态构建时需手动启动。
  网关只监听 `127.0.0.1:8767`，并拒绝非本机页面的
  WebSocket Origin。从客户端给出的 Foxglove `ws://`/`wss://` URL 中解析 hostname，
  用 `node-pty` 启动 `ssh user@host`；不接受独立 SSH host，也不经过 shell 字符串拼接。
- 协议只有 open/input/resize/close 与 ready/output/exit/error，边界统一用 Zod 校验；每个
  WebSocket 只允许一个 PTY，全局最多四个，连接断开和进程退出都会释放资源。
- 用户名和 SSH 密码保存在 localStorage；网关不再要求用户配置 Token，密码在 OpenSSH
  的 password prompt 出现时由网关写入 PTY，host key 交互仍由终端内处理。机器人侧仍只有
  foxglove_bridge 与标准 SSH 服务。
- loopback 明文 WebSocket 只适用于浏览器与网关同机；跨设备或 HTTPS 页面需要外部 WSS
  反向代理，首版不提供公网部署能力。

## 8.10 停靠工作区与多机器会话

- 主机器人页面使用 `dockview-react` 的无重叠分割停靠模型。统一注册 3D、图像、曲线、Topics、
  Teleop、服务、TF 树和插件面板；默认内置右下实用栏仅展示 TF 树；图像、曲线、插件 `panels` 可多开，内置工具与插件
  `sections` 是单实例。Dockview 负责标题、关闭、拖拽、标签合并、最大化和序列化。
- 每个 `RobotSessionApp` 独占 `WorkerBridge`、`TfBuffer`、Dockview 布局和面板状态。顶层只保存
  `activeSessionId` 与全局主题/语言/插件开关；关闭标签通过 React 卸载完整释放 Worker、订阅、
  WebGL 和终端资源。
- 非活动会话保持 WebSocket、话题列表和协议心跳，但暂停业务订阅、清空并回收 per-topic latest
  槽，同时停止 SceneManager 动画；切回标签后按原频率配置恢复订阅，避免后台机器持续消耗机器人
  带宽、Worker 解码和主线程传输。
- SceneManager 跟随 3D canvas 挂载：关闭 3D 即释放 WebGL、3D 显示订阅和临时 PCD；重新添加时
  从会话快照恢复相机、fixed/follow frame、显示话题和地面设置。大帧消费不依赖 3D，因此纯图像
  工作区仍持续更新。
- 配置 schema 升级为 v3（存储键 `robviz.layout.v3`）：顶层保存全部 `sessions[]` 与 active session；明确拒绝旧 v1/v2 格式，不向下兼容迁移。
  Dockview JSON 作为不透明字段保存，恢复失败只重建对应机器默认布局，其他已验证会话字段不丢失。
- WebRTC 视频流在断线或 peer/SDP 协商失败时每秒自动重试恢复连接；最后一个观看者退出后立即取消恢复。明确的网关错误与非法信令显式报错，不无限重试。截图采集命令绝不自动重发。

## 9. 决策记录（只增不删）

| # | 决策 | 理由 |
| --- | --- | --- |
| D1 | 用 foxglove_bridge + CDR，不用 rosbridge + JSON | rosbridge JSON+base64 是历史 rviz-web 项目的共同死因；CDR 直传省 3-10 倍带宽与解析时间 |
| D2 | 只支持 ROS 2 | 避免 ROS1/2 兼容层复杂度；用户环境是 ROS 2 |
| D3 | 单包目录分层，不用 monorepo | KISS；core 以目录约定保持纯净，Node 端直接 import |
| D4 | 面板写死枚举，不做插件系统 | Foxglove 复杂度的主要来源；自用工具加面板=加代码 |
| D5 | URDF 用浏览器拖文件夹（robot_viewer 模式），不做 asset server | 机器人侧零部署；mesh 解析全在前端 |
| D6 | 解码在 Worker，主线程只消费 TypedArray | 性能生死线；参见 §3.2 |
| D8 | TF 插值自实现，不依赖 three.js | core 需在 Node 跑（测试）；slerp 数学量很小 |
| D9 | 丢帧策略放客户端（latest-wins），不做应用层重传 | WebSocket 是 TCP，无真实丢包；风险是队头阻塞与排队膨胀。可视化只需最新帧，丢过期帧使延迟有界；与真实 bridge 的服务端 send_buffer_limit 丢帧行为互补 |
| D10 | 按需渲染（脏标记）而非固定 60fps 循环 | 空闲主机占用趋近零；渲染率自动跟随数据率，交互时仍满帧 |
| D11 | TF 平滑用自适应抖动缓冲而非固定延迟 | 理想网络下延迟代价 ~20ms 接近 rviz；恶劣网络自动加大延迟换平滑，不需要用户调参 |
| D12 | PCD 解析用专用 Worker，不复用连接 Worker | 文件解析是一次性重活，与流式解码互不干扰；解析中不影响实时数据流 |
| D13 | 点云清理只做矩形框选（框删/框留） | 清拖影的实际操作就是几次框删；套索/多边形/SOR 是 CloudCompare 的事，违背 KISS |
| D14 | 点云撤销存被移除点而非快照 | 点云无序，追加即恢复；内存正比于删除量而非云大小（千万点快照一步就是百 MB） |
| D15 | 2D 地图编辑用独立 canvas 面板，不进 3D 场景 | 像素级编辑要平面正交视图 + 精确笔刷，2D canvas 天然合适且实现小一个数量级 |
| D16 | 发布类型用内置 schema 库，服务类型用服务端 advertise 的 schema | 发布必须客户端编码（常用类型就那几个）；服务调用则完全 schema 驱动，任何类型免配置 |
| D17 | 服务请求/发布 JSON 支持部分字段，缺省按 schema 补零 | 人和测试都只想写 `{"linear":{"x":0.5}}`；补全逻辑一处实现两处受益（UI/测试） |
| D18 | 图像面板主线程上色，不进 Worker | VGA@5Hz 转 RGBA <3ms；进 Worker 反而多一次拷贝，违背收益/复杂度比 |
| D19 | URDF mesh 按 basename 匹配用户选的文件 | package:// 路径在真实工程千奇百怪；basename 命中率最高且失败可见（报缺哪个文件） |
| D20 | Display.tick 扩展支持多 frame 显示器 | Marker/URDF 内部含多个 frame，整体变换模型不适用；tick 自管 TF 是最小侵入 |
| D21 | 已废弃（MCP 与反向截图通道已移除） | 历史用于反向截图 WS 通道；已随 CLI/Agent 清理彻底废弃 |
| D23 | 四层故障舱壁（ErrorBoundary / 逐 handler 隔离 / 逐显示器隔离 / Worker 自愈），用故障注入验收 | 一个功能崩溃不能拖垮整体；隔离逻辑不注入真实崩溃测过等于没写 |
| D24 | 终端网关在操作电脑用系统 SSH，不在机器人部署 Web Shell | 保留机器人侧零自研服务；复用 OpenSSH 的 known_hosts、密码/密钥交互与加密链路 |
| D25 | 主工作区使用 Dockview 无重叠分割停靠，不实现桌面式浮窗 | 对齐 Foxglove 的高密度多视图工作流，同时避免遮挡和窗口层级管理 |
| D26 | 每台机器独立 Worker/布局/场景，非活动机器保持连接但暂停业务订阅 | 保持快速切换与状态隔离，同时消除后台机器的传感器带宽、解码和主线程传输成本 |
| D27 | 顶栏主页与功能插件化解耦，开关确认后保存并整页刷新重排 | 顶栏命名改为主页（内部 3D 板块保留“3D 视图”）；5 大功能模块插件化，插件声明承载为顶栏 pages 还是主页 panels；开关全局刷新确保彻底清理状态，主页板块自动重排并保留顶栏排序 |

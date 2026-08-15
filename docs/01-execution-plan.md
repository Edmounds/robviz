# RobViz 执行方案

> 状态：M0–M4 全部完成并通过验收（2026-08-13）。本文档是项目的执行契约：范围、里程碑、验收标准、测试策略。
> 技术细节见 [02-technical-design.md](./02-technical-design.md)，UI 规范见 [03-ui-design.md](./03-ui-design.md)。

## 1. 项目定位

RobViz 是一个**个人自用**的 Web 上位机，替代 rviz 的日常功能，服务于以下开发场景：

- 激光雷达调试（LaserScan / PointCloud2 可视化与字段着色）
- Point-LIO（大规模累积点云、里程计轨迹、TF 链路检查）
- Nav2 导航（地图、costmap、路径、发目标点、teleop、cmd_vel 曲线对比）
- 相机与深度相机（多图并排、悬停取像素值/深度值，视觉调参）
- 机械臂（URDF 加载、joint_states 驱动、关节曲线、service/action 调用）
- Agent 交互（MCP server，让 AI agent 查话题、查 TF、发消息、截图）

### 设计原则（按优先级）

1. **KISS**：只实现自己需要的功能。不做插件体系、不做通用消息浏览器、不追求 rviz 功能对等。
2. **性能是生死线**：二进制协议（CDR）、Worker 解码、Transferable 零拷贝、GPU 缓冲复用。历史上 rviz-web 项目全部死于 rosbridge+JSON 的性能天花板。
3. **数据层与 UI 解耦**：`src/core/` 零 React 依赖，浏览器 UI 和 Node 端（MCP server、测试）共用。
4. **状态即 JSON**：布局、面板配置全部可序列化，人和 agent 都能读写。
5. **机器人侧零侵入**：机器人上只需 `foxglove_bridge`，不部署任何自研服务。

### 明确不做（Non-goals）

- ROS 1 支持
- Foxglove 式 extension/插件系统
- 通用的"任意消息类型"渲染
- 云端存储、多用户、账号体系
- Electron 桌面版（浏览器即产品）

## 2. 里程碑

### M0 — 地基：连接层 + TF + 3D 视口

| 任务 | 说明 |
| --- | --- |
| 项目骨架 | Vite + React + TS，目录结构见技术方案 §2 |
| core/连接层 | 封装 `@foxglove/ws-protocol` 客户端，channel 管理、按 topic 订阅 |
| core/CDR 解码 | 用 bridge 广播的 ros2msg schema 动态生成 MessageReader |
| core/TF 缓冲 | 带时间窗的 transform 缓冲、二分查找、lerp + slerp 插值、跨 frame 链路求解 |
| Worker 封装 | 连接与解码跑在 Web Worker，解码结果 Transferable 传主线程 |
| 模拟服务器 | Node 端模拟 foxglove_bridge，发布合成 TF/scan/map/path/cloud（见 §4） |
| 3D 视口 | three.js 场景、网格地面、OrbitControls、fixed frame 选择、TF 坐标轴显示 |

**验收**：浏览器连上模拟服务器，选定 fixed frame 后能看到 TF 树各坐标轴实时运动；断线自动重连。

> ✅ 2026-08-13 通过：14 个 vitest 用例全绿（TF 插值/链路/逆变换与运动学真值比对、
> CDR 编解码往返）；浏览器实测连接、frame 列表、fixed frame 切换（map/base_link）正常。

### M1 — 雷达与 Point-LIO 可用

| 任务 | 说明 |
| --- | --- |
| OccupancyGrid 渲染 | DataTexture 贴平面，支持 map/costmap 叠加、透明度 |
| LaserScan 渲染 | 极坐标转点，按强度/距离着色 |
| PointCloud2 渲染 | 动态字段解析（xyz + intensity/ring/...），预分配大缓冲，累积模式（Point-LIO 建图），colormap 着色 |
| Path / Odometry | 轨迹线渲染 |
| 话题面板 | 列出 bridge 广播的所有 topic，勾选订阅 |

**验收**：模拟服务器场景下，地图、扫描、点云、轨迹同屏 60fps；100 万累积点不掉帧。

> ✅ 2026-08-13 通过：/map、/scan、/cloud、/path 四显示同屏 60fps；
> 累积模式 30s 写入约 115 万点后仍稳定 60fps（2M 点环形缓冲 + GPU 端 turbo 着色）。

### M1.5 — 性能与网络韧性专项（追加）

Worker 合帧 + latest-wins 丢帧、缓冲池零分配、按需渲染（空闲零占用）、
指数退避重连 + 半开看门狗、滞后估计 HUD、TF 自适应抖动平滑；
模拟器新增 `CLOUD_SCALE`（压测）与 `CHAOS=1`（混沌网络）模式。
详见技术方案 §8。

> ✅ 2026-08-13 通过：29.8MB/s（150 万点/s）滞后 4-5ms 零丢帧；
> 混沌网络下自动重连 + 订阅自愈，滞后有界不增长。断线重连有集成测试覆盖。

### M1.75 — 大地图工作流：PCD 加载/清理 + 2D 地图编辑（追加）

| 任务 | 说明 |
| --- | --- |
| PCD 加载 | ascii / binary / binary_compressed（LZF+SoA）全支持，专用 Worker 解析，Mid-360/Point-LIO 建图产物量级（千万点、数百 MB） |
| 体素降采样 | 加载时可选 0.05/0.1/0.2m，重定位地图浏览不需要全分辨率 |
| 点云清理 | CloudCompare-lite：框删 / 框留（NDC 投影矩形选择）、撤销、导出 binary PCD，清除动态物体拖影 |
| 2D 地图编辑 | PGM+YAML（map_server 格式）读写、从 /map 话题抓取、画笔/矩形（占用/自由/未知）、撤销、导出 |

**验收**：20M 点 PCD 从选择文件到显示 <5s；框选编辑交互流畅；地图编辑导出可直接给 map_server 用。

> ✅ 2026-08-13 通过：20M 点（320MB）binary PCD 解析 + 0.1m 降采样至 3.76M 点约 3s（Worker 内，UI 不卡）；
> 框删/框留/撤销实测正确；PGM+YAML 与 /map 抓取、画笔（带笔画插值）/矩形/撤销/导出全部实测通过。
> 核心逻辑（PCD 解析、LZF、框选、PGM 读写）均有单元测试。

### M2 — 视觉调参可用 ✅（2026-08-13）

| 任务 | 说明 |
| --- | --- |
| Image 面板 | CompressedImage 走 createImageBitmap（GPU 解码），raw Image 主线程 TypedArray 转 RGBA |
| 深度图 | 16UC1/32FC1/mono16 turbo 上色，逐帧自动量程（采样求 min/max） |
| 悬停取值 | 鼠标位置显示像素坐标 + RGB / 深度米数（16UC1 同时显示毫米原值） |
| 多图布局 | 底部面板坞多面板并排（放弃 react-mosaic，KISS：flex + 添加/关闭） |

**验收**：模拟服务器发布 RGB + 深度图，悬停读值正确，四图并排不卡。

> ✅ 实测：/camera/depth（32FC1 320×240 5Hz）turbo 上色 + 量程显示，悬停 (159,119) 读值 1.543m
> 与场景几何一致；/camera/color/compressed（JPEG）解码显示正常；与曲线面板三面板并排流畅。
> 图像 payload 在连接 Worker 内拷贝转移（Transferable + 池化），主线程只做上色。

### M3 — 完全替代 rviz + rqt 常用功能 ✅（2026-08-13）

| 任务 | 说明 |
| --- | --- |
| Plot 面板 | uPlot + 环形缓冲（60s 窗 / 3000 点双限），点路径取字段（如 twist.twist.linear.x），常用类型有字段建议，暂停/框选缩放 |
| Nav Goal / Pose Estimate | 视口工具条，点击定位置、拖动定朝向，发 /goal_pose（PoseStamped）与 /initialpose（PoseWithCovarianceStamped，含默认协方差） |
| Teleop 面板 | WASD/方向键 + 按住式方向按钮，启用时 10Hz 持续发布，线/角速滑块，退出发零速 |
| Service 调用面板 | 服务列表来自 bridge advertise，请求体按 schema 生成默认 JSON 预填，显示响应/错误 |
| URDF 面板 | 选 .urdf + mesh 多文件（或整文件夹），mesh 按文件名解析 blob URL（STL/DAE/OBJ），挂载 frame 可选，关节滑块 / 订阅 /joint_states 二选一 |
| TF tree 面板 | 侧栏缩进树，child→parent 自动找根 |
| Marker/MarkerArray | ARROW/CUBE/SPHERE/CYLINDER/LINE_STRIP/LINE_LIST/CUBE_LIST/SPHERE_LIST/POINTS/TEXT，逐 marker frame TF（Display.tick 扩展），DELETE/DELETEALL |

**验收**：日常导航/机械臂开发不再需要打开 rviz 和 rqt。

> ✅ 实测（模拟器仿真真机行为）：
> - **遥控闭环**：启用 Teleop 按住前进，曲线面板实时记录 odom 线速度 1.5（自动巡航）→ 0.5（手动）→ 0（松开），
>   模拟机器人按 cmd_vel 积分驶离圆形轨迹，超时 1s 回到自动。
> - **服务闭环**：enable_motor(false) 请求体按 schema 预填，响应 "motor disabled (pose frozen)"，机器人冻结；reset_pose 复位。
> - **Nav 工具**：两个工具拖拽发布，模拟器端解码打印 position 正确（视口中心 ≈ 世界原点）。
> - **URDF**：真实机器人 T12（urdf-loader 官方测试模型，36 关节 37 STL）网上下载后浏览器加载，
>   挂 base_link 随机器人移动，/joint_states 驱动六足摆动，36 个关节滑块可手动调。
> - **Marker**：4 种类型同屏（箭头挂 base_link 验证逐 marker TF、脉动球、旋转半透明方块、圆形路线）。
> - 双向链路（cmd_vel 遥控 + 服务往返 + 相机/关节/marker 解码）有 6 项集成测试覆盖。

### M4 — Agent 接入 ✅（2026-08-13）

| 任务 | 说明 |
| --- | --- |
| MCP server | `mcp/server.ts`，Node 进程复用 src/core，作为 bridge 的平级客户端（不依赖 UI） |
| 工具集 | list_topics / echo / get_tf / publish / call_service / screenshot |
| 截图 API | MCP 进程开 WebSocket 命令通道（:8766），Web UI 主动连入，按需渲染一帧导出 PNG |
| 布局生成 | 砍掉（KISS：面板手动添加已足够轻，agent 主要消费数据面工具） |

**验收**：在 Cursor 里问"机器人为什么不动"，agent 能自主查 cmd_vel、TF 链路并给出结论。

> ✅ 实测（scripts/mcp-smoke.ts 以 MCP stdio 客户端逐工具验证）：
> list_topics 11 话题 + 2 服务；echo /odom 拿到位姿；get_tf map→base_link 返回平移+四元数+yaw；
> publish cmd_vel 后 odom 速度立即变为指令值（机器人真的动了）；call_service reset_pose 成功；
> screenshot 在浏览器打开时返回真实 3D 视图 PNG（scripts/mcp-screenshot-test.ts），未打开时报可读错误。
> publish/call_service 支持部分字段 JSON（缺省字段按 schema 自动补零值），对 agent 友好。

### M4.5 — 故障隔离加固（追加）✅（2026-08-13）

| 任务 | 说明 |
| --- | --- |
| 面板级错误边界 | 每个 dock 面板与侧栏区块独立 ErrorBoundary，崩溃显示错误 + 重置，顶层兜底 |
| 消息分发隔离 | Bridge / Connection 逐 handler try/catch，错误按 topic 限流上报 |
| 显示器隔离 | 渲染循环逐显示器 try/catch，连续出错自动禁用该显示器，其余照常 |
| Worker 自愈 | Worker 崩溃自动重建 + 重连 + 恢复订阅；单条畸形消息只丢该帧 |

**验收**：任何单个功能崩溃不影响其余功能与数据流。

> ✅ 故障注入实测（详见技术方案 §8.8）：曲线面板 render 抛错→仅该面板隔离；
> 激光渲染器每帧抛错→其余显示器 0.6 MB/s 照常；Worker 每 5s 崩溃→自动重启，数据流不断。

### M5 — 远程终端 ✅（2026-08-15）

| 任务 | 说明 |
| --- | --- |
| 本地终端网关 | 操作电脑上的 loopback WebSocket 网关，用 `node-pty` 启动系统 SSH |
| 底部终端 | xterm.js 单会话面板，Ctrl+反引号呼出/隐藏，可拖动高度且跨页面可用 |
| 目标与凭据 | 主机严格跟随当前 Foxglove URL；用户名本地保存，Token 仅存 sessionStorage，SSH 密码不保存 |
| 生命周期 | 隐藏保持会话；切换机器人、刷新、主动结束或 WebSocket 断开时清理 SSH 子进程 |

**验收**：浏览器通过本机网关进入当前机器人 SSH；网关协议、鉴权、输入输出、resize、退出与断连清理有自动化测试。

## 3. 测试策略（无 ROS 环境）

开发机是 macOS、无 ROS 2。全部测试基于**模拟 foxglove_bridge 服务器**（`mock/` 目录，Node + `@foxglove/ws-protocol` 服务端 + CDR 编码器）：

1. **单元测试（vitest）**：TF 缓冲插值/链路求解、CDR 解码、PointCloud2 字段解析、环形缓冲。
2. **集成测试（vitest，Node 环境）**：拉起模拟服务器 → core 客户端连接 → 断言收到并正确解码各类消息、TF 查询结果与模拟器的真值一致。
3. **浏览器验证**：`npm run mock` + `npm run dev`，人工/截图检查渲染；性能用 `stats` 面板观测帧率。
4. **真机验证**（用户侧）：机器人装 `ros-$DISTRO-foxglove-bridge`，浏览器直连。模拟器与真实 bridge 走同一协议，理论上无差异；差异点（消息字段布局、QoS）在真机阶段回归。

## 4. 模拟服务器场景设定

一个在 20m x 20m 带墙壁房间里绕圈行驶的差速机器人：

- `/tf` (30Hz)：`map → odom → base_link → laser / camera_link`
- `/scan` (10Hz)：360 束射线对墙壁做光线投射，带噪声与强度
- `/map` (0.2Hz, latched 语义)：OccupancyGrid，墙壁 + 内部障碍
- `/cloud` (5Hz)：模拟 16 线雷达的 PointCloud2（xyz + intensity + ring）
- `/path` (1Hz)：历史轨迹
- `/odom` (30Hz)：Odometry
- M2 起：`/camera/image_raw`、`/camera/depth`（合成图案）；M3 起：`/joint_states`、service demo

## 5. 文档管理约定

- `docs/01-execution-plan.md`（本文档）：范围与里程碑，**每个里程碑完成时更新状态与验收结论**。
- `docs/02-technical-design.md`：架构与模块设计，接口变更时同步更新；重要技术决策记录在其附录"决策记录"中，只增不删。
- `docs/03-ui-design.md`：视觉规范，UI 相关改动前先对照。
- `README.md`：快速上手（安装、启动模拟器、启动 UI、连真机）。

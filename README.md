# RobViz

> A web-based robot dashboard that replaces rviz/rqt — connects straight to `foxglove_bridge` from the browser, zero deployment on the robot.

[![License: MIT](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-lightgrey.svg)](tsconfig.json)

个人自用的 Web 机器人上位机，替代 rviz / rqt 的日常功能。浏览器直连 `foxglove_bridge`，机器人侧零部署。

**技术栈**：React 19 + three.js + TypeScript + Vite；连接与消息解码在 Web Worker 内完成，
主线程只做渲染；无后端、无 Electron，`npm run build` 产物是纯静态页面。

**功能一览**：3D 显示（Map / LaserScan / PointCloud2 / Path / Marker / URDF / TF）、
图像面板（压缩图 + 深度图 turbo 上色 + 悬停取值）、曲线面板（多话题字段对比）、
遥控 Teleop、服务调用、Nav 目标 / 初始位姿、TF 树、视角跟踪目标、大 PCD 加载清理、
2D 地图编辑、布局配置保存/加载（rviz 式）、明暗主题、插件系统、
CLI（agent 直接查询/操作机器人）。

**稳定性**：四层故障舱壁（面板错误边界 / 消息分发隔离 / 显示器隔离 / 连接 Worker 崩溃自愈），
任何单个功能崩溃不影响其余功能与数据流，已用故障注入实测（技术方案 §8.8）。

## 文档

- [执行方案](docs/01-execution-plan.md) — 范围、里程碑、验收标准
- [技术方案](docs/02-technical-design.md) — 架构、协议、模块设计、决策记录
- [UI 规范](docs/03-ui-design.md) — 单色系统设计令牌
- [插件指南](docs/04-plugin-guide.md) — 三类扩展点、PluginContext、示例与验证清单

## 快速开始（无 ROS 环境，模拟模式）

```bash
npm install
npm run mock   # 终端 1：启动模拟 foxglove_bridge（ws://localhost:8765）
npm run dev    # 终端 2：启动 Web UI
```

模拟器旋钮：

```bash
CLOUD_SCALE=40 npm run mock   # 点云压测（30 万点/帧 × 5Hz）
CHAOS=1 npm run mock          # 混沌网络：抖动 + 周期停顿 + 每 20s 强制断连
```

浏览器打开 dev server 地址，连接 `ws://localhost:8765`。

## 大地图工作流

- **加载 PCD**（重定位地图浏览）：顶栏"打开 PCD"，支持 ascii / binary / binary_compressed，
  可选加载时体素降采样（Mid-360 千万点建图产物建议 0.1m）。测试文件生成：
  `npx tsx scripts/gen-pcd.ts 20 /tmp/bigmap.pcd`（2000 万点）。
- **点云清理**（清除动态物体拖影）：加载后工具条切"框删/框留"，拖框即删/裁剪，
  可撤销，"导出"下载清理后的 binary PCD。
- **2D 地图编辑**：顶栏切"地图编辑"，打开 PGM+YAML（可多选）或"从 /map 抓取"；
  画笔/矩形绘制占用/自由/未知，导出 PGM+YAML 直接给 map_server 用。

## 日常面板

- **图像**：侧栏"+ 图像"，选 `Image` / `CompressedImage` 话题。深度图（32FC1/16UC1）自动
  turbo 上色并显示量程；悬停显示像素坐标与深度米数，视觉调参用。
- **曲线**：侧栏"+ 曲线"，选话题 + 字段点路径（如 `twist.twist.linear.x`），多序列对比、
  暂停、拖框缩放。
- **遥控**：侧栏 Teleop 启用后 WASD / 方向键 / 按住方向按钮，10Hz 持续发 cmd_vel。
- **服务**：侧栏列出 bridge 广播的服务，请求体按 schema 预填，改完点调用。
- **Nav 工具**：视口右上"导航目标 / 初始位姿"，点击定位置、拖动定朝向，
  发 `/goal_pose` / `/initialpose`。
- **URDF**：侧栏"加载 URDF + mesh"，一次多选 .urdf 和全部 mesh 文件（STL/DAE/OBJ，
  按文件名匹配引用），挂载到 TF frame；关节用滑块或订阅 `/joint_states`。

## Agent 接入（CLI）

agent（或人）直接跑命令即可查询/操作机器人，零 server 配置：

```bash
npm run cli -- topics                          # 列话题与服务
npm run cli -- echo /odom -n 3                 # 看消息（JSON，长数组截断）
npm run cli -- tf map base_link                # 查坐标链（含 yaw）
npm run cli -- pub /cmd_vel geometry_msgs/msg/Twist '{"linear":{"x":0.5}}'
npm run cli -- call /robot/reset_pose          # 调服务
npm run cli -- screenshot -o /tmp/shot.png     # 截 3D 视图（需浏览器打开页面）
```

真机加 `--bridge ws://robot:8765` 或设 `BRIDGE_URL`。`pub` / `call` 支持部分字段
JSON，缺省字段按 schema 自动补零。仓库内置 `.cursor/skills/robviz-cli`，
Cursor agent 会自动学会这些命令。

验证：`npx tsx scripts/cli-smoke.ts`（需 mock 在跑）。

## 布局配置与主题

- 顶栏"保存配置 / 加载配置"：当前布局（连接地址、激活话题、面板、相机、跟踪目标、
  主题）导出为 `robviz.json`，跨机器分享；页面状态也会自动存 localStorage，
  下次打开自动恢复。
- 右上角图标切换明暗主题；3D 视口、曲线轴、地图编辑器全部跟随。
- 视口工具条"跟踪"下拉（或点 TF 树节点）：视角一键锁定目标 frame，
  跟踪中仍可自由旋转缩放。双击视口聚焦地面点，"复位视角"飞回默认机位。

## 插件

想加自己的功能（自定义面板 / 3D 显示器 / 侧栏区块）：

```bash
npm run plugin:new my-plugin   # 生成 src/plugins/my-plugin/index.tsx 骨架
```

放进目录即自动生效，崩溃自动隔离不影响主体。完整契约见
[插件指南](docs/04-plugin-guide.md)；对 Cursor agent 说"帮我写一个 XX 插件"
即可（内置 `.cursor/skills/robviz-plugin` 会引导它）。

## 连接真机

机器人上安装并启动 bridge：

```bash
sudo apt install ros-$ROS_DISTRO-foxglove-bridge
ros2 launch foxglove_bridge foxglove_bridge_launch.xml
```

Web UI 连接 `ws://<robot-ip>:8765`。

## 测试

```bash
npm test   # vitest：core 单元测试 + 对接模拟服务器的集成测试
```

## License

[MIT](LICENSE) © Edmounds

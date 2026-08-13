---
name: robviz-cli
description: 用 RobViz CLI 查询和操作机器人：列话题、看消息（echo）、查 TF、发布消息（如 cmd_vel）、调用服务、截取 3D 视图。当需要查看机器人状态、话题数据、TF 坐标链，或需要发消息/调服务/给机器人下指令时使用。
---

# RobViz CLI

终端直连 foxglove_bridge 的机器人调试 CLI，无需任何 server 配置。

## 前置

- 机器人（或 `npm run mock` 模拟器）上的 foxglove_bridge 在运行。
- 默认连 `ws://localhost:8765`；真机加 `--bridge ws://<robot-ip>:8765` 或设 `BRIDGE_URL` 环境变量。

## 命令

```bash
npm run cli -- topics                          # 列话题（含类型）与服务
npm run cli -- echo /odom -n 3 -t 10           # 收 3 条消息（默认 1 条/5s 超时）
npm run cli -- tf map base_link                # 查位姿（平移+四元数+yaw_rad）
npm run cli -- pub /cmd_vel geometry_msgs/msg/Twist '{"linear":{"x":0.5}}'
npm run cli -- call /robot/reset_pose '{}'     # 调服务（服务名见 topics 输出）
npm run cli -- screenshot -o /tmp/shot.png     # 截 Web UI 3D 视图（需浏览器开着页面）
```

- 输出一律 JSON 到 stdout；失败非零退出码 + stderr 中文原因。
- `pub` / `call` 的 JSON 可以只给部分字段，缺省字段按 schema 自动补零。
  可发布类型见 `npm run cli -- --help`。
- 长数组（点云等）自动截断到 100 元素。

## 验证链路

```bash
npx tsx scripts/cli-smoke.ts   # 需 npm run mock 在跑，全子命令冒烟
```

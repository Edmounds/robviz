# Fruit Arm plugin

独立机械臂页面。插件 ID 为 `fruit-arm`，页面 ID 为 `fruit-arm:main`。
现有 registry 自动发现插件。无需修改 `App.tsx` 或手动注册。

## 使用

1. 从目标机器的 HTTP 编辑服务打开 RobViz，例如 `http://<robot>:8000`。
2. 连接同一机器的 Foxglove bridge。
3. 在机械臂页面选择预设或输入单姿态。
4. 拖动二维 TCP，或调整 yaw、绝对 pitch。
5. 选择实测起点或手动模拟硬件角。
6. 点击预览，再播放离散轨迹点。
7. 插入、追加或替换草稿航点。
8. 保存文件，再单独重载预设。

拖动、滑条、打点、保存和动画均不发送运动请求。
非法候选点不能执行，画面保留最后有效姿态。
二维姿态按各自 yaw 截面展开。三维显示真实空间方向。
TCP 是真实解算位置。`pitch=0°` 表示 a4 水平。
预览不检测碰撞，也不保证硬件连续路径误差。

非空预设的坐标类型锁定。跨类型复制后必须手动填写。
替换姿态只更新目标，保留 timing、gripper、LIN 和途经点属性。
驻留留空、显式零和正值分别保留。
完整工序只能执行已保存且已重载的命名预设。
单姿态执行不包含 `dwell_ms` 或 `is_via_point`。

## 实机控制

先停止 mission 和其他运动客户端，再确认现场安全并启用控制。
启用状态不持久化。刷新、离页、断连、换机器或失焦会清除启用状态。
离开活动 jog 尝试 STOP。明确提交的单次动作仍由 planner 完成。
STOP/ESTOP 不依赖控制启用。
STOP 响应只表示请求已发布。
新鲜 IDLE 和有限原始速度不超过 `0.05 rad/s` 时，页面报告低速反馈。
该反馈不代表已经验证硬件减速过程。

Jog 默认 XYZ `0.01 m`、pitch `5°`、PTP、HOLD、默认时长。
聚焦 jog 区后使用方向键 XY、`a/z` 高度、`s/x` pitch。
`t/e` 请求 STOP/ESTOP。
Jog 完成当前动作后才提交最新累计目标，不逐键排队。
待提交夹爪动作优先，OPEN/CLOSE 使用新鲜实测硬件角。

每台机器只保存草稿、文件基线、选择和步长。
不保存控制启用、jog 队列、请求或自动重放。
浏览器与机器人必须同步时钟。
HTTP 文件主机必须与所选机器人一致。
文件路径与 planner 路径不同时，阻止文件预设重载和执行。

## 依赖与等待

机器端提供现有 HTTP 服务的 `/api/arm/*` 端点。
planner 提供 `fruit_interfaces/srv/GetArmPlannerConfiguration`。
机器端复用原有 FK/IK、JointTransformer、TrajectoryPlanner。
浏览器仅渲染和投影，不实现另一套 IK 或串口控制。
运行配置未知时可以离线预览文件，但不能启用实机控制。

`WorkerBridge.callService(name, request, {timeoutMs})` 的等待策略贯穿 Worker 与 FoxgloveConnection：

| timeoutMs | 行为 |
| --- | --- |
| 省略 | 10 秒等待 |
| `null` | 无等待期限，断连/销毁/Worker 故障仍拒绝请求 |
| 正有限值 | 指定毫秒，最大 `2_147_483_647` |

运动和 Home 使用 `null`。查询、重载、STOP 使用默认期限。
HTTP 请求单独限制为 10 秒。
等待超时不取消远端执行。断连后结果未知，绝不自动重发。
轨迹 ID 只用于诊断，不能证明页面拥有该运动。

## 验证

```bash
npm run build
npm exec oxlint -- src/plugins/fruit-arm src/bridge/WorkerBridge.ts src/core/FoxgloveConnection.ts src/worker/protocol.ts src/worker/connection.worker.ts
npm exec vitest -- run tests/unit/FoxgloveConnection.test.ts tests/unit/WorkerBridge.test.ts tests/unit/pluginRegistry.test.ts
```

诊断级别只改变网页订阅，不改变 planner 日志参数。
debug 订阅 Header/Mode，trace 额外订阅 Point。
页面保留最多 200 条事件，可下载日志。
UI 使用当前工作区的插件页面基础设施，保留其独立修改。
实机方向、夹爪、STOP/ESTOP、长动作和浏览器交互需操作者验收。

# Fruit Arm plugin

独立机械臂页面。插件 ID 为 `fruit-arm`，页面 ID 为 `fruit-arm:main`。
现有 registry 自动发现插件。无需修改 `App.tsx` 或手动注册。

## 页面操作

页面只提供表单、遥测和服务调用。页面不绘制 2D/3D 机械臂，不提供路径预览、时间轴或模拟播放。

直接控制有两种输入模式：

- `TCP / Cartesian` 输入真实 TCP 的 `X/Y/Z/pitch_deg`。可选择 LIN 或 PTP，直接调用 `move_cartesian`。
- `原始电机角 / Joints` 输入四个原始硬件角度，单位为度。固定使用 PTP，直接调用 `move_joints`。

点击“下发当前目标”前，页面仍要求启用实机控制、新鲜四轴反馈、空闲状态和没有其他动作。planner 负责正式限位、规划和执行结果确认。

Home、夹爪动作和已应用预设也直接调用 planner 服务。页面不调用路径预览接口作为运动前置步骤。

## Jog

Jog 与直接控制共用 TCP/关节角输入模式。

- TCP 模式按 XYZ 和绝对 pitch 累加目标。XYZ 默认步长为 `0.01 m`，pitch 默认步长为 `5°`。
- 关节模式按四个原始硬件角逐轴增减。默认步长为 `5°`，可调范围为 `0.1°..30°`。
- Jog 只提交最新累计目标，不排队。待提交夹爪动作使用新鲜实测硬件角。
- 失焦、离页、断连和停用 Jog 会清理输入。已提交的 Jog 会请求 STOP。
- `t` 请求 STOP，`Escape` 请求 ESTOP。STOP/ESTOP 的返回只表示请求已发布。

## 预设路径点集

预设继续读写机器端唯一配置文件中的 `presets`。预设支持 `cartesian`、`joints` 和 `link_angles` 三种坐标类型。

每个预设使用可同时展开的卡片。航点支持就地编辑：

- `target`
- `duration_ms`
- `gripper`
- `dwell_ms`
- `linear`
- `is_via_point`

航点可以使用原生拖放改变顺序。新建、编辑、排序、删除和追加只修改页面草稿，不发送运动请求。

“追加当前直控目标”会先使用 `/api/arm/pose` 的有效结果，再转换为选定预设的坐标类型，并追加到末尾：TCP 使用 `pose.tcp`，原始角使用 `pose.hardware_deg`，连杆角使用 `pose.link_deg`。

点击“保存文件”才写入 YAML。保存继续使用版本冲突校验。保存成功后必须单独点击“重载预设”，执行按钮才会启用。文件未保存、文件版本冲突、planner 路径不一致或预设未成功重载时，执行按钮保持禁用。

## 布局

桌面端使用 `react-resizable-panels`。预设区、直接控制/Jog 区和遥测/诊断区可以拖动分隔条调整大小。直接控制与 Jog、遥测与诊断也可以分别调整大小。

布局比例保存到 RobViz 当前会话的 `fruit-arm` 插件状态。布局状态不写入机械臂 YAML。移动端拖拽布局不在本页面范围内。

## 实机控制

先停止 mission 和其他运动客户端，再确认现场安全并启用控制。
启用状态不持久化。刷新、离页、断连、换机器或失焦会清除启用状态。
反馈新鲜度使用浏览器收到消息的单调时间判断，不要求浏览器与机器人同步系统时钟。HTTP 文件主机必须与所选机器人一致。

`WorkerBridge.callService(name, request, { timeoutMs: null })` 用于运动和 Home。运动等待 planner 返回最终结果。断连后的结果未知，页面绝不自动重发。

## 依赖与验证

机器端提供现有 HTTP 服务的 `/api/arm/*` 端点，planner 提供机械臂服务。
浏览器只负责表单、数据转换请求和状态显示，不实现第二套 IK、轨迹规划或串口控制。

```bash
npm run lint
npm run test
npm run build
```

实机方向、夹爪、STOP/ESTOP、长动作和浏览器交互需要操作者在现场安全条件下验收。

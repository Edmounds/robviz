# RobViz 插件开发指南

> 目标读者：为 RobViz 写插件的人和 AI agent。读完本文即可独立完成一个插件。

## 0. 一分钟上手

```bash
npm run plugin:new my-plugin   # 生成 src/plugins/my-plugin/index.tsx 骨架
# 编辑 index.tsx 实现功能
npm run lint && npx tsc -b --noEmit && npm test   # 验证
npm run dev                    # 打开页面即可看到插件生效
```

插件 = `src/plugins/<目录名>/index.tsx` 里 **default 导出一个 `RobvizPlugin` 对象**。
放进目录即自动生效（构建期 `import.meta.glob` 发现），不需要在任何地方注册。

## 1. 插件契约

完整类型定义在 [src/plugins/types.ts](../src/plugins/types.ts)（以代码为准）：

```ts
interface RobvizPlugin {
  id: string;    // 唯一 id，小写中划线，与目录名一致
  name: string;  // 显示名
  displays?: Array<{ schema: string; create: () => Display }>;
  panels?: Array<{ kind: string; title: string; component: ComponentType<PluginPanelProps> }>;
  sections?: Array<{ id: string; title: string; component: ComponentType<PluginSectionProps> }>;
}
```

三类扩展点，按需实现一类或多类：

| 扩展点 | 出现位置 | 适合做什么 |
| --- | --- | --- |
| `displays` | 话题列表（该 schema 的话题可勾选显示） | 自定义消息类型的 3D 可视化 |
| `panels` | 侧栏"面板"区的添加按钮 → 底部面板坞 | 需要较大画面的内容（自定义图表、视频、表格） |
| `sections` | 右侧侧栏常驻区块（同 Teleop / 服务） | 小型状态显示、控制开关 |

### PluginContext（宿主能力）

面板与区块组件都收到 `ctx: PluginContext`：

```ts
interface PluginContext {
  bridge: WorkerBridge;   // 数据通道（见下）
  topics: TopicInfo[];    // 当前话题列表 [{ topic, schemaName }]
  tf: TfBuffer;           // TF 查询
  fixedFrame: string;     // 当前 fixed frame
  theme: "dark" | "light";
  locale: "zh-CN" | "en"; // 当前宿主语言；插件自行翻译自己的名称和文案
}
```

`bridge` 的常用方法：

```ts
// 订阅：返回取消函数，务必在 useEffect cleanup 里调用
const unsub = ctx.bridge.subscribe("/odom", (payload) => {
  if (payload.kind !== "raw") return;   // raw = 已解码的消息对象
  const msg = payload.message as Odometry;
});

// 发布（schemaName 须在 src/core/rosSchemas.ts 的 PUB_SCHEMAS 内）
ctx.bridge.publish("/cmd_vel", "geometry_msgs/msg/Twist", { linear: { x: 0.5, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } });

// 调服务
const res = await ctx.bridge.callService("/reset", {});
```

`payload.kind` 说明：普通消息是 `"raw"`；点云/栅格/图像是预解析的 `"cloud"` / `"grid"` /
`"image"` / `"compressed_image"`（定义见 [src/worker/protocol.ts](../src/worker/protocol.ts)）。

TF 查询：

```ts
const tf = ctx.tf.lookup("map", "base_link", Infinity); // Infinity = 最新
// → { translation: {x,y,z}, rotation: {x,y,z,w} } | undefined
```

### 面板状态持久化

面板组件通过 `state` / `onStateChange` 接入配置文件（保存布局时随 `robviz.json` 导出，
加载时恢复）：

```tsx
function MyPanel({ ctx, state, onStateChange, onClose }: PluginPanelProps) {
  const [topic, setTopic] = useState((state as { topic?: string } | undefined)?.topic ?? "");
  useEffect(() => onStateChange({ topic }), [topic]);
  // ...
}
```

state 必须是可 JSON 序列化的普通对象。

### 运行时启停

用户可在“设置 → 插件”中立即启用或停用已打包插件。停用会卸载该插件的面板和侧栏区块，
并销毁其 3D display；重新启用后，宿主会恢复已保存的面板状态、尺寸和 display 目标话题。
插件仍由 Vite 在构建期发现，设置页不负责安装、删除或运行时扫描文件夹。

插件模块顶层代码会在应用加载时执行，无法通过启停撤销，因此不要在模块顶层创建订阅、定时器、
WebSocket 或 DOM 监听。把副作用放进 React `useEffect` 或 display 生命周期，并在 cleanup / `dispose()`
中完整释放。插件文案可根据 `ctx.locale` 在 `"zh-CN"` 与 `"en"` 之间切换。

## 2. 三类扩展点示例

### 侧栏区块（最简单，从这里开始）

完整可运行的例子：[src/plugins/example-odom-hud/index.tsx](../src/plugins/example-odom-hud/index.tsx)
（订阅 Odometry 显示速度，约 60 行）。

### 面板坞面板

```tsx
const plugin: RobvizPlugin = {
  id: "battery",
  name: "电池",
  panels: [{ kind: "status", title: "电池状态", component: BatteryPanel }],
};
```

面板外层容器用 `className="panel"`，标题栏用 `panel-header`（含关闭按钮调 `onClose`），
主体用 `panel-body`，即可获得与内置面板一致的外观。

### 3D 显示器

实现 [src/renderers/SceneManager.ts](../src/renderers/SceneManager.ts) 的 `Display` 接口：

```ts
class MyDisplay implements Display {
  readonly root = new THREE.Group();     // 挂到场景的根节点
  frameId: string | undefined;           // 最近消息的 frame_id（宿主按它求 TF 摆放）
  update(payload: MessagePayload): void { /* 消息 → three.js 对象 */ }
  dispose(): void { /* 释放 geometry/material */ }
}

const plugin: RobvizPlugin = {
  id: "my-viz",
  name: "自定义可视化",
  displays: [{ schema: "my_msgs/msg/Custom", create: () => new MyDisplay() }],
};
```

内置已有显示器的 schema（LaserScan/PointCloud2/OccupancyGrid/Path/MarkerArray）不可覆盖。

## 3. 规则与约定

- **只经 `ctx.bridge` 收发数据**，不要自己开 WebSocket 连 foxglove_bridge。
- **不要改 `src/app/App.tsx`** 或其他宿主代码；插件的全部代码都在自己目录内。
- **UI 单色**：界面骨架用现有 CSS 类（`side-row`、`side-label`、`panel-header` 等）
  和设计令牌（`var(--foreground)` 等，见 [03-ui-design.md](03-ui-design.md)）；
  数据内容（曲线、点云颜色）可以有彩色。深浅主题都要可读——不要硬编码黑白。
- **订阅必须清理**：`useEffect` 返回 `unsub`，否则关面板后还在收消息。
- **顶层不得产生副作用**：运行时开关只卸载扩展点，无法撤销模块求值时创建的资源。
- **错误隔离**：三类扩展点都套在 ErrorBoundary/显示器隔离里，插件崩溃不会拖垮主体，
  但仍应自己处理可预期的错误（话题不存在、字段缺失）。
- id 与目录名必须一致，否则 registry 会跳过该插件；面板 kind 会自动带上 `<id>:` 前缀写入配置文件。

## 4. 验证清单

```bash
npm run lint                # 无新增告警
npx tsc -b --noEmit        # 类型通过
npm test                    # registry 测试会确认插件被发现
npm run dev                 # 连接真机，手动验证功能与深浅主题下的外观
```

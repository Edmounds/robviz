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
  panels?: Array<PluginPanelEntry>;
  sections?: Array<{ id: string; title: string; component: ComponentType<PluginSectionProps> }>;
  viewportTools?: PluginViewportTool[];
  pages?: PluginPage[];
}
```

五类扩展点，按需实现一类或多类：

| 扩展点 | 出现位置 | 适合做什么 |
| --- | --- | --- |
| `pages` | 顶栏主导航栏；独立完整工作页面 | 专用大页面（地图编辑、URDF 编辑、航点编辑、图像采集） |
| `displays` | 话题列表（该 schema 的话题可勾选显示） | 自定义消息类型的 3D 可视化 |
| `panels` | 顶栏“添加面板”菜单；允许创建多个停靠实例（或内置 3D 绑定） | 需要较大画面的内容（自定义图表、视频、表格、3D 主机位） |
| `sections` | 顶栏“添加面板”菜单；单实例停靠面板 | 小型状态显示、控制开关 |
| `viewportTools` | 3D 视口工具条 | 需要主视口点选/拖拽交互的机器人功能 |

两类组件都保留原有 props。区别只在宿主生命周期：`panels` 可多开，每个实例有独立 `state`；
`sections` 以 `<plugin-id>:<section-id>` 为稳定单例，用户可以移动、合并标签、最大化、关闭并重新添加。新建会话会首次加入当时启用的插件区块；关闭状态随会话配置保存，导入已有布局不会自动插入新插件区块。

### PluginContext（宿主能力）

面板与区块组件都收到 `ctx: PluginContext`：

```ts
interface PluginContext {
  bridge: WorkerBridge;   // 数据通道（见下）
  topics: TopicInfo[];    // 当前话题列表 [{ topic, schemaName }]
  tf: TfBuffer;           // TF 查询
  fixedFrame: string;     // 当前 fixed frame
  theme: "dark" | "light";
  locale: "zh-CN" | "en";
  active: boolean;                 // 当前机器标签是否在前台
  connectionState: "connecting" | "open" | "closed";
  pluginStates: Readonly<Record<string, unknown>>; // 当前机器各插件的 JSON 状态
  onPluginStateChange(pluginId: string, state: unknown): void;
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

### 插件状态持久化

工具条和区块共享 `ctx.pluginStates[pluginId]`，用 `ctx.onPluginStateChange(pluginId, state)` 更新。
状态按机器标签保存，并随浏览器自动恢复及 JSON 导入/导出；宿主 schema 只保证它是 JSON 数据，插件
必须在读取导入值时自行校验形状并补齐默认值。不要用独立 localStorage 键保存插件配置。

### 3D 视口工具

`viewportTools` 在 3D 工具条提供按钮。宿主负责相机投影、地面命中测试和指针拖拽；插件收到以当前
`fixedFrame` 表达的地面 `position` 与拖拽 `yaw`，无需访问 SceneManager：

```ts
const plugin: RobvizPlugin = {
  id: "nav-goals",
  name: "Navigation goals",
  viewportTools: [{
    id: "goal",
    title: (ctx) => ctx.locale === "en" ? "Navigation Goal" : "导航目标",
    hint: "Click to set position, drag to set heading",
    onPoseSelect: (ctx, interaction) => {
      if (!ctx.active || ctx.connectionState !== "open") return;
      // ctx.bridge.publish(...)
    },
  }],
};
```

工具只在所属插件启用时注册；切换会话、断线或停用插件会取消当前指针交互。宿主暴露活动状态作为元数据，
但不强制所有第三方插件在非活动会话中禁止写入；插件必须为自己的机器人写操作定义生命周期。

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

用户可在“设置 → 插件”中启用或停用已打包插件。开关操作会弹出确认提示（“请先保存相关内容，切换插件将刷新页面”），
确认后同步写入浏览器存储、清除各机器主页的 Dockview 停靠排列并刷新页面重新加载；取消则不改变配置亦不刷新。
刷新后主页根据当前启用的板块自动重新排列；用户主动关闭的面板保持关闭，未保存的内存临时草稿（地图编辑笔刷、URDF XML、航点草稿）会随刷新丢弃。
停用插件时，其声明的停靠面板与区块仅从布局中隐藏，其面板记录与参数状态（`state`）仍保留在配置中，重新启用后自动恢复；仅在启用状态下由用户主动关闭的面板才会从配置中移除。
停用 3D 视图（`view-3d`）时，3D 视口画布卸载，顶栏“打开 PCD”与降采样等视口控制项自动隐藏；若解析 PCD 期间视口卸载或不可用，任务会安全终止并清理状态，不访问空场景。
顶栏拖拽排序全局保留，停用插件的入口隐藏但保留原排序位置。插件仍由 Vite 在构建期发现，设置页不负责安装、删除或运行时扫描文件夹。

插件模块顶层代码会在应用加载时执行，无法通过启停撤销，因此不要在模块顶层创建订阅、定时器、
WebSocket 或 DOM 监听。把副作用放进 React `useEffect` 或 display 生命周期，并在 cleanup / `dispose()`
中完整释放。插件文案可根据 `ctx.locale` 在 `"zh-CN"` 与 `"en"` 之间切换。

## 2. 四类扩展点示例

### 单实例区块（最简单，从这里开始）

完整可运行的例子：[src/plugins/example-odom-hud/index.tsx](../src/plugins/example-odom-hud/index.tsx)
（订阅 Odometry 显示速度，约 60 行）。

### 可多开停靠面板

```tsx
const plugin: RobvizPlugin = {
  id: "battery",
  name: "电池",
  panels: [{ kind: "status", title: "电池状态", component: BatteryPanel }],
};
```

Dockview 已提供标题、关闭、拖拽和最大化控件。插件组件只渲染内容工具栏与主体，不要再创建
`panel-header` 或第二层可折叠外框；需要程序化关闭时仍可调用现有 `onClose` prop。

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
- **错误隔离**：面板、区块和工具按钮的渲染由 ErrorBoundary 保护，display 按实例隔离；视口事件回调不由 ErrorBoundary 捕获，插件应捕获并处理可预期错误。
  但仍应自己处理可预期的问题（话题不存在、字段缺失）。
- id 与目录名必须一致，否则 registry 会跳过该插件；面板 kind 会自动带上 `<id>:` 前缀写入配置文件。

## 4. 验证清单

```bash
npm run lint                # 无新增告警
npx tsc -b --noEmit        # 类型通过
npm test                    # registry 测试会确认插件被发现
npm run dev                 # 连接真机，手动验证功能与深浅主题下的外观
```

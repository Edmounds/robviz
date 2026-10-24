# RobViz 插件开发指南

## 共享 UI 与独立 SDK（必读）

现有 3D 主页是插件的统一视觉基准。
从 `@robviz/core` 引用共享控件、布局、媒体和反馈组件，不复制基础组件或另写一套控件样式。
可用组件、用法及无硬件预览见 [07-shared-ui.md](07-shared-ui.md)。
ESM 独立插件包结构与分发见 [08-plugin-packages.md](08-plugin-packages.md)。

插件通过 `@robviz/core` SDK 构建，由宿主在运行时通过 Native ESM 和 Import Maps 动态加载，无需重新编译宿主。

> 目标读者：为 RobViz 写插件的人和 AI agent。读完本文即可独立完成一个插件。

## 0. 插件包构建与安装

官方通用插件位于独立仓库 `robviz_plugins`。插件也可作为独立包开发：

```bash
# 在插件仓库构建产物
npm run build
# 产物生成在 plugins/<id>/（包含 manifest.json、index.js、可选 style.css）

# 安装到 RobViz 宿主
cp -R plugins/<id> /path/to/robviz/plugins/<id>
npm run plugins:scan   # 校验包并更新 plugins/index.json
```

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
  toolbarTools?: Array<{ id: string; component: ComponentType<PluginToolProps> }>;
  settings?: Array<{ id: string; title: string | ((ctx: PluginContext) => string); component: ComponentType<PluginSectionProps> }>;
}
```

七类扩展点，按需实现一类或多类：

| 扩展点 | 出现位置 | 适合做什么 |
| --- | --- | --- |
| `pages` | 顶栏主导航栏；独立完整工作页面 | 专用大页面（地图编辑、URDF 编辑、航点编辑、图像采集） |
| `displays` | 话题列表（该 schema 的话题可勾选显示） | 自定义消息类型的 3D 可视化 |
| `panels` | 顶栏“添加面板”菜单；允许创建多个停靠实例（或内置 3D 绑定） | 需要较大画面的内容（自定义图表、视频、表格、3D 主机位） |
| `sections` | 顶栏“添加面板”菜单；单实例停靠面板 | 小型状态显示、控制开关 |
| `viewportTools` | 3D 视口工具条 | 需要主视口点选/拖拽交互的机器人功能 |
| `toolbarTools` | 顶栏操作区 | 自有交互工具，可通过 outlet 挂载抽屉 |
| `settings` | 设置页中的插件自有分页 | 插件配置与后端设置，不把专属协议放进 Core |

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
确认后同步写入浏览器存储并刷新，保留所有会话的 Dockview 排列；取消则不改变配置。
未保存的内存草稿会随刷新丢弃，因此必须先保存编辑内容。
停用或缺失的插件面板显示占位内容，保留几何位置与参数状态，重新安装启用后恢复。
基础 3D 是宿主固有能力，旧 `view-3d` 禁用记录不关闭基础 3D。
插件通过运行时 ESM 加载，禁用入口不求值。安装与扫描见 [08-plugin-packages.md](08-plugin-packages.md)。

插件模块顶层代码会在应用加载时执行，无法通过启停撤销，因此不要在模块顶层创建订阅、定时器、
WebSocket 或 DOM 监听。把副作用放进 React `useEffect` 或 display 生命周期，并在 cleanup / `dispose()`
中完整释放。插件文案可根据 `ctx.locale` 在 `"zh-CN"` 与 `"en"` 之间切换。

## 2. 四类扩展点示例

### 单实例区块（最简单，从这里开始）

完整例子位于官方插件仓 `src/example-odom-hud/index.tsx`。
在 Core 中运行 `npm run plugin:new my-plugin /path/to/plugin-repository` 可生成独立插件源码与 manifest。

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
npm run dev                 # 先在离线环境验证外观。真机操作需要单独授权。
```

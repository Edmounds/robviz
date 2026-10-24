# 插件共享 UI

视觉基准是当前 3D 主页：单色控件、窄工具栏、细边框和内容优先布局。
插件拆分业务，不拆分设计系统。不要为每个插件复制基础 CSS。

## 公开入口

插件从 `@robviz/core` 引用组件和类型：

```tsx
import { Button, Field, NumberInput, Page, Toolbar, type PluginPageProps } from "@robviz/core";

export function ControlPage({ ctx }: PluginPageProps) {
  return <Page>
    <Toolbar><strong>{ctx.locale === "en" ? "Controls" : "控制"}</strong></Toolbar>
    <Field label="速度 / m/s">
      <NumberInput value={0.5} min={0.1} max={2} onValueChange={() => {}} />
    </Field>
    <Button disabled={ctx.connectionState !== "open"}>执行</Button>
  </Page>;
}
```

示例只展示组件组合。业务插件必须自行保存输入值并定义控制策略。
现阶段由 TypeScript paths 和 Vite alias 指向同一份 Core 实现。
后续独立插件构建将 external 此入口，由宿主运行时解析。
不得把宿主 UI 源码拷进插件，也不得通过另一个“UI 插件”提供这些能力。

## 可用组件

| 组件 | 用途 |
| --- | --- |
| `Button` | 普通按钮、`primary` 主操作、`danger` 危险操作、`selected` 选中态 |
| `IconButton` | 带必填 `label` 的图标按钮，提供可访问名称和提示 |
| `TextInput`、`NumberInput` | 复用已有输入校验，保留空白草稿与错误提示 |
| `TextArea`、`Select`、`Checkbox` | 多行输入、选择与复选框 |
| `Field` | 一个控件的标签、布局及可选说明 |
| `Page` | 独立插件页面，不生成第二套应用导航 |
| `PanelBody` | 停靠面板内容，不重复绘制 Dockview 标题栏 |
| `Toolbar`、`ActionRow` | 窄工具栏与操作按钮组 |
| `Section` | 独立页面内部区块，支持标题和标题栏操作 |
| `CollapsiblePanel`、`CollapsibleSection` | 复用已有可折叠面板与区块，停靠模式不重复绘制标题 |
| `StatusBadge`、`Notice`、`EmptyState` | 状态、反馈和空内容 |
| `SplitGroup`、`SplitPanel`、`SplitHandle` | 共享分栏及键盘可操作的拖拽分隔线 |
| `useSplitGroupRef` | 复用已有分栏命令式 API |
| `LogTerminal` | 按需加载的只读 ANSI 日志，不建立网络连接 |
| `validateInputs` | 调用已有字段校验，不绕过业务输入校验 |

`Button` 默认 `type="button"`，表单提交需要显式指定 `type="submit"`。
`Field` 适合一个控件，不要在同一标签内放多个交互控件。
`LogTerminal` 放在 `Suspense` 内，使用 `LogTerminalHandle` 的 `write`、`reset` 和 `clear`。
日志协议、游标、轮询和错误策略仍由插件负责。

## 样式规则

- 共享 CSS 由宿主加载一次，不由插件重复打包。
- 使用现有 `--canvas`、`--foreground`、`--border-soft`、`--border-strong` 等令牌。
- 字阶使用 `--fs-body`、`--fs-ui` 和 `--fs-meta`，跟随全局字号。
- 间距、圆角和热区使用 `--panel-gap`、`--panel-radius`、`--radius-ctl` 和 `--ctl-min-h`。
- 正常状态使用单色，警告和错误使用已有语义令牌，不另选绿色或红色。
- 业务 CSS 只管理业务布局、数据内容和业务交互标记。
- 不覆盖全局 `button`、`input` 或 `.btn-action` 等未隔离选择器。
- 图表、地图、图像和 3D 中的必要数据配色不受单色控件限制。
- 保留键盘焦点、控件名称、禁用态和文字状态，不只使用颜色表达。

## 本地检查

```bash
npm run ui:preview
```

访问 `http://127.0.0.1:5174/ui.html`。
此入口不连接机器人，不启动终端网关。
检查深浅主题、75%/100%/150% 字号、窄窗口、Tab 焦点和分栏键盘操作。
清空必填字段并点击校验，确认错误提示和焦点仍可用。
检查日志写入、清屏、主题切换和容器缩放。

构建与现有测试不等同于视觉验收。真实页面仍需逐页检查。

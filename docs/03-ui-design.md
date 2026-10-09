# RobViz UI 设计规范

> 视觉语言继承自 `~/blog_web/DESIGN.md`（Astro-star 单色系统），此处为工具类 UI 的适配版。
> 冲突时以本文档为准。

## 1. 核心原则

1. **Chrome 单色，数据有色**。界面骨架（按钮、边框、标题、tab、菜单）严格单色；
   数据本身（曲线序列、点云着色、深度 colormap、图像内容）是"内容"，保留色彩。
   这是对原设计"禁止装饰色"规则在数据工具场景下的唯一扩展。
2. **默认深色主题**。画布 `#000000`，前景 `#f5f5f5`。3D 视口即背景，不引入任何氛围层（雪、代码雨、星座一律不用）。
3. **内容最大化**。面板内容区占满，chrome 越薄越好；工具栏是一条发丝线分隔的窄条，不是卡片。

## 2. 设计令牌

直接沿用 blog DESIGN.md 的语义令牌与混色约定：

```css
--canvas: #000000;            /* 亮色主题 #ffffff，次优先级支持 */
--foreground: #f5f5f5;
--foreground-soft: rgba(245, 245, 245, 0.90);
--text-muted: color-mix(in srgb, var(--foreground) 74%, transparent);
--text-faint: color-mix(in srgb, var(--foreground) 58%, transparent);
--border-soft: color-mix(in srgb, var(--foreground) 20%, transparent);
--border-strong: color-mix(in srgb, var(--foreground) 46%, transparent);
--surface-soft: color-mix(in srgb, var(--canvas) 93%, var(--foreground) 7%);
--focus-ring: color-mix(in srgb, var(--foreground) 70%, transparent);
```

- 层级强度以工具可辨识度为先：74% 次要文本、58% 辅助文本、46% 控件边界、20% 结构分隔线、7% 静默填充。
- `--border-strong` 用于输入框、下拉和按钮等交互边界；`--border-soft` 只用于面板、行和区块分隔。
- hover 向 `--foreground` 移动一级，不换色相；选中态可反色（前景底 + 画布字）。
- 无阴影、无渐变、无玻璃拟态。悬浮菜单允许一层克制阴影用于与 3D 内容分离。

### 状态色（工具特有，语义色不是装饰色）

| 用途 | 值 |
| --- | --- |
| 连接正常 / TF 正常 | `--foreground`（用实心圆点符号表达，不用绿色） |
| 警告（TF 断链、掉帧） | `#e6b800`（唯一黄色，仅用于状态指示） |
| 错误（断连、解码失败） | `#e05252`（唯一红色，仅用于状态指示） |

### 数据色（内容色板）

- 曲线序列：定长 8 色色板（取自 uPlot 场景可辨识度优化的色相环），同一 topic 的序列色稳定。
- 点云/深度 colormap：`turbo`（默认）与 `grayscale` 两档，KISS 不做 colormap 商店。

## 3. 字体

Biotif 字体文件不在本项目内，使用回退栈。拉丁字符优先走系统 UI 字体
（度量与字重渲染优于中文字体自带的拉丁字形），中文回退 PingFang/雅黑：

```css
--sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
  "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif;
/* 数值/代码/topic 名 */
--mono: ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
```

- `font-variant-numeric: tabular-nums` 在 body 上全局开启：topic 名、frame 名、
  数值刷新时不抖动（对齐抖动是数据 UI 大忌）。
- 字阶三级制，全部走令牌，禁止 0.5px 碎片字号：

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--fs-body` | 13px | 正文、面板标题（500 字重）、空状态提示 |
| `--fs-ui` | 12px | 按钮、输入框、下拉、数据行（topic/TF 树） |
| `--fs-meta` | 11px | 辅助说明、HUD 角标、图例、区块小标题 |

- 正文 `line-height: 1.5`。工具 UI 不用 clamp 流式字号。

### 工效学约定

- 控件最小热区 `--ctl-min-h: 24px`（顶栏 28px），圆角统一 `--radius-ctl: 6px`。
- 图标按钮方形热区 ≥ 24px（如面板关闭按钮 24px 宽），避免误触相邻控件。

## 4. 布局与组件

- 机器标签栏（高 32px）：名称、连接状态点、关闭与新增；当前标签通过底边/背景层级区分，双击名称进入重命名。
- 顶栏（高 40px，底部 1px 发丝线）：连接地址与状态点、添加面板、fixed frame 选择、模式切换、主题快捷按钮与设置入口；窄屏保持单行并允许横向滚动，控件不得被压成竖排文字。
- 主机器人区使用 Dockview 无重叠分割停靠：所有面板可水平/垂直拆分、重排、合并标签、最大化和关闭。通用最小高度为 30px，3D 不设专属最小/最大尺寸。地图、设置与终端不进入停靠区；URDF 内部保留 `react-resizable-panels`。
- Dockview 面板标题栏约 30px，高度稳定，muted 文本 + Lucide 最大化按钮 + 关闭按钮；图像、曲线和插件内容不得再绘制第二层标题外框。
- 远程终端：全局底部抽屉，默认高 280px、范围 160px 至视口 60%；顶边提供 6px 拖动热区，
  隐藏后保持会话，3D/地图/URDF/设置页共用同一个终端实例。
- 控件：圆角 ≤ 6px；输入框透明底 + `--border-strong`；按钮透明底细边框，主操作反色。
- 复选/下拉尽量换成"行级点击切换 + 对勾"，减少表单感。
- 动效：180-260ms ease；面板增删用透明度，不做弹跳；`prefers-reduced-motion` 下全部瞬时。

## 5. 3D 视口内的视觉

- 地面网格：1m 次格使用 1.5px / 14%，5m 主格使用 2.25px / 30%；采用屏幕空间线宽，避免高 DPI 下退化成不可辨认的发丝线。
- TF 轴：RGB = XYZ 是机器人行业惯例，**保留**（属数据色）；轴线 3px，frame 名标签使用高对比等宽字并带反色细描边。
- 选中/悬停高亮：白色描边，不用彩色高光。
- 视口角标（fps、点数、渲染耗时）：右下角 11px 等宽 faint 文本，无底板。

## 6. 无障碍与降级

- 焦点环 2px + 3px 偏移，全键盘可达。
- 状态不单靠颜色：连接状态同时有文字，TF 断链同时在列表打标。
- 辅助文本对画布对比度不低于 4.5:1，关键控件边界不低于 3:1。
- 亮色主题为次优先级，但令牌体系保证可切换；不允许任何组件硬编码深色值。

## 7. 航点编辑页面

- 航点编辑器是独立页面，与 URDF 编辑器并列，不进入 Dockview。
- 正式文件按模板顺序显示。模板中没有实测坐标的点只显示缺失状态，不绘制占位点。
- 2D 画布使用 `odom` 坐标。机器人箭头仅在 `odom → base_link` TF 新鲜时显示，过期或断链时显示文字状态。

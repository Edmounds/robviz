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
--text-muted: color-mix(in srgb, var(--foreground) 68%, transparent);
--text-faint: color-mix(in srgb, var(--foreground) 46%, transparent);
--border-soft: color-mix(in srgb, var(--foreground) 14%, transparent);
--border-strong: color-mix(in srgb, var(--foreground) 24%, transparent);
--surface-soft: color-mix(in srgb, var(--canvas) 95.5%, var(--foreground) 4.5%);
--focus-ring: color-mix(in srgb, var(--foreground) 30%, transparent);
```

- 层级强度约定不变：68% 次要文本、24% 强边框、14% 发丝线、4.5% 静默填充。
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

Biotif 字体文件不在本项目内，使用回退栈（保持与 blog 的中文回退一致）：

```css
font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", -apple-system, sans-serif;
/* 数值/代码/topic 名 */
font-family: ui-monospace, "SF Mono", Menlo, monospace;
font-variant-numeric: tabular-nums;
```

- topic 名、frame 名、数值一律等宽 + tabular-nums（对齐抖动是数据 UI 大忌）。
- 字号比博客缩一档：面板标题 13px/500，正文 13px，辅助 11.5px。工具 UI 不用 clamp 流式字号。

## 4. 布局与组件

- 顶栏（高 40px，底部 1px 发丝线）：连接地址与状态点、fixed frame 选择、布局切换、主题切换。
- 主区：M0-M2 为 3D 视口 + 右侧可折叠设置栏（宽 280px，1px 发丝线分隔）；M2 起引入 react-mosaic 多面板，分隔条 1px 发丝线，拖拽热区 6px。
- 面板标题栏：28px 高，muted 文本 + 图标按钮（Lucide，2rem 方形热区）。
- 控件：圆角 ≤ 6px；输入框透明底 + `--border-strong`；按钮透明底细边框，主操作反色。
- 复选/下拉尽量换成"行级点击切换 + 对勾"，减少表单感。
- 动效：180-260ms ease；面板增删用透明度，不做弹跳；`prefers-reduced-motion` 下全部瞬时。

## 5. 3D 视口内的视觉

- 地面网格：1px 线，主格 `--foreground` 10%、次格 6%，1m 间距（对齐文档网格背景的"技术图纸"气质）。
- TF 轴：RGB = XYZ 是机器人行业惯例，**保留**（属数据色）；轴线细（1.5px），frame 名标签 11px 等宽、muted。
- 选中/悬停高亮：白色描边，不用彩色高光。
- 视口角标（fps、点数、渲染耗时）：右下角 11px 等宽 faint 文本，无底板。

## 6. 无障碍与降级

- 焦点环 2px + 3px 偏移，全键盘可达。
- 状态不单靠颜色：连接状态同时有文字，TF 断链同时在列表打标。
- 亮色主题为次优先级，但令牌体系保证可切换；不允许任何组件硬编码深色值。

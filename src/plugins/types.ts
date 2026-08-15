/**
 * RobViz 插件契约。写插件请读 docs/04-plugin-guide.md。
 *
 * 插件 = src/plugins/<目录>/index.tsx 里 default 导出一个 RobvizPlugin。
 * 放进目录即自动生效（构建期 import.meta.glob 发现），无需注册代码。
 * 三类扩展点都套在 ErrorBoundary 里，插件崩溃不影响主体。
 */
import type { ComponentType } from "react";

import type { WorkerBridge } from "../bridge/WorkerBridge";
import type { TopicInfo } from "../core/FoxgloveConnection";
import type { TfBuffer } from "../core/TfBuffer";
import type { Display } from "../renderers/SceneManager";
import type { Theme } from "../renderers/sceneTheme";
import type { Locale } from "../app/i18n";

/** 插件可用的宿主能力（每次渲染更新，topics/fixedFrame/theme 是最新值） */
export interface PluginContext {
  /** 订阅/发布话题、调用服务（唯一的数据通道，不要自己开 WebSocket） */
  bridge: WorkerBridge;
  /** 当前 bridge 广播的话题列表 */
  topics: TopicInfo[];
  /** TF 缓冲：lookup(parent, child, time) / frames() */
  tf: TfBuffer;
  /** 当前 fixed frame */
  fixedFrame: string;
  /** 当前明暗主题（UI chrome 请用 CSS 令牌，此值供画布类内容用） */
  theme: Theme;
  /** 当前宿主语言；插件自行负责自己的翻译文案 */
  locale: Locale;
}

/** 面板坞面板 props */
export interface PluginPanelProps {
  ctx: PluginContext;
  /** 配置恢复：上次保存的面板状态（首次打开为 undefined） */
  state?: unknown;
  /** 配置保存：状态变化时上报（会进配置文件与 localStorage） */
  onStateChange: (state: unknown) => void;
  onClose: () => void;
}

/** 侧栏常驻区块 props */
export interface PluginSectionProps {
  ctx: PluginContext;
}

export interface RobvizPlugin {
  /** 唯一 id（小写中划线），同时作为面板 kind 前缀 */
  id: string;
  /** 显示名 */
  name: string;
  /** 3D 显示器：按消息 schema 注册，出现在话题列表里可勾选 */
  displays?: Array<{ schema: string; create: () => Display }>;
  /** 面板坞面板：出现在侧栏"面板"区的添加按钮里 */
  panels?: Array<{ kind: string; title: string; component: ComponentType<PluginPanelProps> }>;
  /** 侧栏常驻区块（如内置的 Teleop / 服务） */
  sections?: Array<{ id: string; title: string; component: ComponentType<PluginSectionProps> }>;
}

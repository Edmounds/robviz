/**
 * RobViz 插件契约。写插件请读 docs/04-plugin-guide.md。
 *
 * 插件 = src/plugins/<目录>/index.tsx 里 default 导出一个 RobvizPlugin。
 * 放进目录即自动生效（构建期 import.meta.glob 发现），无需注册代码。
 * 三类扩展点都套在 ErrorBoundary 里，插件崩溃不影响主体。
 */
import type { ComponentType } from "react";

import type { WorkerBridge } from "../bridge/WorkerBridge";
import type { ConnectionState, TopicInfo } from "../core/FoxgloveConnection";
import type { TfBuffer } from "../core/TfBuffer";
import type { Display } from "../renderers/SceneManager";
import type { Theme } from "../renderers/sceneTheme";
import type { Locale } from "../app/i18n";

/** 插件服务定义（用于向平台暴露所需网络端点） */
export interface PluginServiceDefinition {
  /** 服务唯一标识（如 "runtime", "video", "terminal"） */
  id: string;
  /** 显示名称 */
  label: string;
  /** 默认端口 */
  defaultPort: number;
  /** 通信协议 */
  protocol: "http" | "ws";
  /** 服务说明 */
  description?: string;
}

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
  /** 当前机器人会话标签是否处于活动前台 */
  active: boolean;
  /** 当前机器人底层连接状态 */
  connectionState: ConnectionState;
  /** 当前会话内各插件的可持久化状态；由宿主保存到 session JSON */
  pluginStates: Readonly<Record<string, unknown>>;
  /** 更新当前会话中某个插件的持久化状态 */
  onPluginStateChange: (pluginId: string, state: unknown) => void;
  /** 获取指定服务的最终解析 URL（自动应用 Session 基准主机与网络端口覆盖） */
  getServiceUrl: (serviceId: string) => string;
}

export interface ViewportPoseInteraction {
  position: { x: number; y: number; z: number };
  yaw: number;
}

export interface PluginViewportTool {
  id: string;
  title: string | ((ctx: PluginContext) => string);
  hint?: string | ((ctx: PluginContext) => string);
  onPoseSelect: (ctx: PluginContext, interaction: ViewportPoseInteraction) => void;
}

/** 顶栏页面 props */
export interface PluginPageProps {
  ctx: PluginContext;
  bridgeUrl?: string;
  mediaUrl?: string;
  fontScale: number;
  isMobile: boolean;
}

export interface PluginPage {
  /** 插件内唯一 id */
  id: string;
  /** 页面标题，支持多语言函数或静态字符串 */
  title: string | ((ctx: PluginContext) => string);
  /** 页面组件 */
  component: ComponentType<PluginPageProps>;
  /** 兼容旧 mode 标识（如 "map" | "urdf" | "waypoints" | "capture"） */
  legacyMode?: string;
}

export type PluginPanelEntry =
  | {
      kind: string;
      title: string | ((ctx: PluginContext) => string);
      component: ComponentType<PluginPanelProps>;
      builtinKind?: never;
    }
  | {
      builtinKind: "3d";
      title: string | ((ctx: PluginContext) => string);
      kind?: never;
      component?: never;
    };

/** 面板坞面板 props */
export interface PluginPanelProps {
  ctx: PluginContext;
  /** 配置恢复：上次保存的面板状态（首次打开为 undefined） */
  state?: unknown;
  /** 配置保存：状态变化时上报（会进配置文件与 localStorage） */
  onStateChange: (state: unknown) => void;
  onClose: () => void;
}

/** 单实例停靠区块 props（为兼容已有插件保留原接口名） */
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
  /** 可多开停靠面板：出现在顶栏“添加面板”菜单 */
  panels?: Array<PluginPanelEntry>;
  /** 单实例停靠区块（可移动、关闭和重新添加） */
  sections?: Array<{ id: string; title: string; component: ComponentType<PluginSectionProps> }>;
  /** 3D 视口交互工具（出现在 3D 视图顶栏，支持点选/拖拽交互） */
  viewportTools?: PluginViewportTool[];
  /** 顶栏页面 */
  pages?: PluginPage[];
  /** 主动暴露的服务及默认端口（显示在网络设置中并允许用户自定义覆盖） */
  services?: PluginServiceDefinition[];
}

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Grid3X3, Moon, PanelTopOpen, Pencil, Plus, Settings, SquareTerminal, Sun, X } from "lucide-react";
import * as THREE from "three";

import { startAgentChannel } from "../agent/uiChannel";
import { WorkerBridge } from "../bridge/WorkerBridge";
import {
  APP_CONFIG_STORAGE_KEY,
  createDefaultSession,
  parseAppConfig,
  renameAppSession,
  saveAppConfigToStorage,
  serializeAppConfig,
  type AppConfig,
  type RobotSessionConfig,
} from "../core/appConfig";
import type { ConnectionState, ServiceInfo, TopicInfo } from "../core/FoxgloveConnection";
import type { LayoutConfig, PointCloudSettings } from "../core/layoutConfig";
import { connectionTargetLabel } from "../core/connectionTarget";
import {
  DEFAULT_POINT_CLOUD_SETTINGS,
  DEFAULT_WORKSPACE_LAYOUT,
} from "../core/layoutConfig";
import { TfBuffer } from "../core/TfBuffer";
import type { TFMessage } from "../core/types";
import { toSec } from "../core/types";
import { canAddPanel, createPanelId, type WorkspacePanel } from "../core/workspacePanels";
import { ImagePanel } from "../panels/ImagePanel";
import { ErrorBoundary } from "./ErrorBoundary";
import { PointCloudSettingsPanel } from "../panels/PointCloudSettingsPanel";
import { EchoTopicSection } from "../panels/EchoTopicSection";
import { TfTreeSection } from "../panels/TfTreeSection";
import { EditableCloudRenderer } from "../renderers/EditableCloudRenderer";
import { GridRenderer } from "../renderers/GridRenderer";
import { LaserScanRenderer } from "../renderers/LaserScanRenderer";
import { MarkerRenderer } from "../renderers/MarkerRenderer";
import { PathRenderer } from "../renderers/PathRenderer";
import { PointCloudRenderer } from "../renderers/PointCloudRenderer";
import type { Display, SceneStats } from "../renderers/SceneManager";
import { SceneManager } from "../renderers/SceneManager";
import type { Theme } from "../renderers/sceneTheme";
import { setSceneTheme } from "../renderers/sceneTheme";
import { plugins, resolvePlugins } from "../plugins/registry";
import type { PluginContext } from "../plugins/types";
import type { PluginViewportToolDef } from "../plugins/registry";
import type { PcdWorkerResponse } from "../worker/pcd.worker";
import type { MessagePayload, StreamStats } from "../worker/protocol";
import { I18nProvider, translate } from "./i18n";
import { SettingsPage } from "./SettingsPage";
import { WorkspaceDock } from "./WorkspaceDock";
import type { SerializedDockview } from "dockview-react";

const DEFAULT_URL = "ws://localhost:8765";
const PCD_KEY = "__pcd__";
const THEME_KEY = "robviz.theme";
const TERMINAL_HEIGHT_KEY = "robviz.terminal.height";
const UrdfEditorPage = lazy(() => import("../panels/UrdfEditorPage"));
const WaypointsEditorPage = lazy(() =>
  import("../panels/WaypointsEditorPage").then((module) => ({ default: module.WaypointsEditorPage })),
);
const ImageCapturePage = lazy(() =>
  import("../panels/ImageCapturePage").then((module) => ({ default: module.ImageCapturePage })),
);
const TerminalPanel = lazy(() => import("../panels/TerminalPanel"));
const MapEditorPanel = lazy(() =>
  import("../panels/MapEditorPanel").then((module) => ({ default: module.MapEditorPanel })),
);
const PlotPanel = lazy(() =>
  import("../panels/PlotPanel").then((module) => ({ default: module.PlotPanel })),
);

const BUILTIN_DISPLAY_FACTORIES: Record<string, () => Display> = {
  "sensor_msgs/msg/LaserScan": () => new LaserScanRenderer(),
  "sensor_msgs/msg/PointCloud2": () => new PointCloudRenderer(),
  "nav_msgs/msg/OccupancyGrid": () => new GridRenderer(),
  "nav_msgs/msg/Path": () => new PathRenderer(),
  "visualization_msgs/msg/MarkerArray": () => new MarkerRenderer(),
};

const TF_TOPICS = new Set(["/tf", "/tf_static"]);

type PcdTool = "orbit" | "delete" | "keep";

type NavTool = string;

interface PcdInfo {
  name: string;
  count: number;
  rawCount: number;
  undoDepth: number;
  parseMs: number;
}

interface DockPanel {
  id: string;
  kind: string;
  /** 面板自定义状态快照（配置保存/恢复用） */
  state?: unknown;
}

/** 想要显示的话题（话题未上报时挂起，出现后自动订阅） */
interface DesiredTopic {
  schemaName: string;
  pointCloud?: PointCloudSettings;
}

function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadBuffer(data: ArrayBuffer, name: string): void {
  downloadBlob(new Blob([data], { type: "application/octet-stream" }), name);
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}

function createSessionId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createDefaultAppConfig(): AppConfig {
  const session = createDefaultSession(createSessionId(), "机器 1");
  return {
    version: 2,
    activeSessionId: session.id,
    theme: "dark",
    settings: { language: "zh-CN", fontScale: 1, disabledPluginIds: [] },
    sessions: [session],
  };
}

function readStoredAppConfig(): AppConfig {
  let config: AppConfig;
  try {
    const saved = localStorage.getItem(APP_CONFIG_STORAGE_KEY);
    config = saved ? parseAppConfig(saved) : createDefaultAppConfig();
  } catch (error) {
    console.warn("[layout] 本地配置损坏，恢复默认工作区:", error);
    config = createDefaultAppConfig();
  }

  // URL search params 支持，用于直接导航与离线测试
  if (typeof window !== "undefined" && window.location?.search) {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get("mode");
      if (
        urlMode === "waypoints" ||
        urlMode === "3d" ||
        urlMode === "map" ||
        urlMode === "urdf"
      ) {
        for (const session of config.sessions) {
          session.mode = urlMode;
        }
      }
      const urlFontScale = parseFloat(params.get("fontScale") ?? "");
      if (Number.isFinite(urlFontScale) && urlFontScale >= 0.5 && urlFontScale <= 2.5) {
        config.settings.fontScale = urlFontScale;
      }
      const urlTheme = params.get("theme");
      if (urlTheme === "dark" || urlTheme === "light") {
        config.theme = urlTheme;
      }
    } catch {}
  }

  return config;
}

function persistAppConfig(config: AppConfig): void {
  try {
    saveAppConfigToStorage(config, localStorage);
  } catch {
    /* 存储不可用时忽略 */
  }
}

interface RobotSessionAppProps {
  session: RobotSessionConfig;
  active: boolean;
  headerActionsSlot?: HTMLDivElement | null;
  globalTheme: Theme;
  globalSettings: AppConfig["settings"];
  effectiveFontScale: number;
  panelGap: number;
  onSessionChange: (session: RobotSessionConfig) => void;
  onConnectionStateChange: (id: string, state: ConnectionState) => void;
  onThemeChange: (theme: Theme) => void;
  onGlobalSettingsChange: (settings: AppConfig["settings"]) => void;
  onSaveAll: (current: RobotSessionConfig) => void;
  onSaveAllAsFile: (current: RobotSessionConfig) => void;
  onLoadAll: (file: File) => void;
}

function RobotSessionApp({
  session,
  active = true,
  headerActionsSlot,
  globalTheme,
  globalSettings,
  effectiveFontScale,
  panelGap,
  onSessionChange,
  onConnectionStateChange,
  onThemeChange,
  onGlobalSettingsChange,
  onSaveAll,
  onSaveAllAsFile,
  onLoadAll,
}: RobotSessionAppProps) {
  const bridgeRef = useRef<WorkerBridge>(null);
  const tfRef = useRef<TfBuffer>(null);
  const sceneRef = useRef<SceneManager>(null);
  const unsubsRef = useRef(new Map<string, () => void>());
  /** 3D 显示器的订阅（与 TF 订阅分开管理，由 reconcile 效应维护） */
  const displaySubsRef = useRef(new Map<string, () => void>());
  const pcdRendererRef = useRef<EditableCloudRenderer>(null);
  const pcdFileRef = useRef<HTMLInputElement>(null);
  const configFileRef = useRef<HTMLInputElement>(null);
  const pluginCtxRef = useRef<PluginContext | null>(null);
  const viewportToolsRef = useRef<PluginViewportToolDef[]>([]);
  const selectStartRef = useRef<[number, number]>(null);
  const navStartRef = useRef<[number, number]>(null); // 地面坐标
  const connectedUrlRef = useRef(DEFAULT_URL);
  const initialUrlRef = useRef(session.url);
  const initialActiveRef = useRef(active);
  const savedCameraRef = useRef(session.camera);
  const isMobile = useMediaQuery("(max-width: 680px)");

  const [ready, setReady] = useState(false);
  const [sceneCanvas, setSceneCanvas] = useState<HTMLCanvasElement | null>(null);
  const [sceneGeneration, setSceneGeneration] = useState(0);
  const [mode, setMode] = useState<"3d" | "map" | "urdf" | "waypoints" | "capture" | "settings">(session.mode);
  const [settingsTab, setSettingsTab] = useState<"general" | "3d" | "images" | "plugins">("general");
  const theme = globalTheme;
  const [settings, setSettings] = useState<LayoutConfig["settings"]>(
    {
      language: globalSettings.language,
      fontScale: globalSettings.fontScale ?? 1,
      disabledPluginIds: globalSettings.disabledPluginIds,
      groundVisible: session.scene.groundVisible,
      tfAxesLineWidth: session.scene.tfAxesLineWidth,
    },
  );
  const [pluginStates, setPluginStates] = useState<Record<string, unknown>>(
    () => session.pluginState ?? {},
  );
  const [initializedPluginSectionIds, setInitializedPluginSectionIds] = useState<Set<string>>(
    () => new Set(session.initializedPluginSectionIds ?? []),
  );
  const [workspace, setWorkspace] = useState<LayoutConfig["workspace"]>(
    { ...DEFAULT_WORKSPACE_LAYOUT, urdfInspectorPercent: session.urdfInspectorPercent },
  );
  const [url, setUrl] = useState(session.url);
  const [activeBridgeUrl, setActiveBridgeUrl] = useState(session.url);
  const [connState, setConnState] = useState<ConnectionState>("closed");
  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [frames, setFrames] = useState<string[]>([]);
  const [tfTree, setTfTree] = useState<Map<string, string>>(new Map());
  const [fixedFrame, setFixedFrame] = useState(session.fixedFrame);
  const [followFrame, setFollowFrame] = useState<string | undefined>(session.followFrame);
  const [desired, setDesired] = useState<Map<string, DesiredTopic>>(() => new Map(
    session.activeTopics.map((topic) => [topic.topic, {
      schemaName: topic.schemaName,
      ...(topic.pointCloud ? { pointCloud: topic.pointCloud } : {}),
    }]),
  ));
  const [sceneStats, setSceneStats] = useState<SceneStats>({
    renderHz: 0,
    brokenFrames: [],
    tfDelayMs: 0,
  });
  const [streamStats, setStreamStats] = useState<StreamStats>();
  const [lastError, setLastError] = useState<string>();

  // PCD 加载与清理
  const [pcd, setPcd] = useState<PcdInfo>();
  const [pcdBusy, setPcdBusy] = useState<string>();
  const [pcdTool, setPcdTool] = useState<PcdTool>("orbit");
  const [pcdVoxel, setPcdVoxel] = useState(session.pcdVoxel);
  const [selectRect, setSelectRect] = useState<{ x: number; y: number; w: number; h: number }>();

  // Nav 工具与面板坞
  const [navTool, setNavTool] = useState<NavTool>();
  const [navPreview, setNavPreview] = useState<{ x: number; y: number; yawDeg: number; len: number }>();
  const [panels, setPanels] = useState<DockPanel[]>(() =>
    session.panels.filter((panel) => panel.kind !== "services").map((panel) => ({ ...panel })),
  );
  const [dockLayout, setDockLayout] = useState<SerializedDockview | undefined>(
    session.dockLayout as SerializedDockview | undefined,
  );
  const [terminalMounted, setTerminalMounted] = useState(false);
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(() => {
    const stored = Number(localStorage.getItem(TERMINAL_HEIGHT_KEY));
    const maximum = Math.max(160, Math.floor(window.innerHeight * 0.6));
    const preferred = Number.isFinite(stored) && stored >= 160 ? stored : 280;
    return Math.min(maximum, preferred);
  });
  const sceneMountStateRef = useRef({
    active,
    fixedFrame,
    followFrame,
    groundVisible: settings.groundVisible,
    tfAxesLineWidth: settings.tfAxesLineWidth,
    pcdTool,
    navTool,
    effectiveFontScale,
  });
  sceneMountStateRef.current = {
    active,
    fixedFrame,
    followFrame,
    groundVisible: settings.groundVisible,
    tfAxesLineWidth: settings.tfAxesLineWidth,
    pcdTool,
    navTool,
    effectiveFontScale,
  };

  const resolvedPlugins = useMemo(
    () => resolvePlugins(plugins, settings.disabledPluginIds),
    [settings.disabledPluginIds],
  );
  const displayFactories = useMemo<Record<string, () => Display>>(
    () => ({ ...resolvedPlugins.displays, ...BUILTIN_DISPLAY_FACTORIES }),
    [resolvedPlugins.displays],
  );
  const t = useMemo(
    () => (key: Parameters<typeof translate>[1], values?: Record<string, string | number>) =>
      translate(settings.language, key, values),
    [settings.language],
  );

  // 初始化每台机器独立的 TF 缓冲、Worker 桥与连接。
  useEffect(() => {
    const tf = new TfBuffer();
    const bridge = new WorkerBridge(initialActiveRef.current);
    const topicSubscriptions = unsubsRef.current;
    const displaySubscriptions = displaySubsRef.current;
    tfRef.current = tf;
    bridgeRef.current = bridge;
    bridge.onStateChange = setConnState;
    bridge.onError = setLastError;
    bridge.onStats = setStreamStats;
    bridge.onServicesChange = setServices;
    // raw 消息（scan/path 等）即时更新了显示器，标脏触发渲染
    bridge.onImmediateData = () => sceneRef.current?.invalidate();

    bridge.onTopicsChange = (list) => {
      setTopics(list);
      // TF 话题一出现就自动订阅
      for (const { topic } of list) {
        if (TF_TOPICS.has(topic) && !unsubsRef.current.has(topic)) {
          const isStatic = topic === "/tf_static";
          const unsub = bridge.subscribe(topic, (payload: MessagePayload) => {
            if (payload.kind !== "raw") return;
            let newest = 0;
            for (const ts of (payload.message as TFMessage).transforms) {
              const stamp = toSec(ts.header.stamp);
              if (stamp > newest) newest = stamp;
              tf.setTransform(
                ts.header.frame_id,
                ts.child_frame_id,
                stamp,
                ts.transform,
                isStatic,
              );
            }
            if (!isStatic && newest > 0) sceneRef.current?.reportTf(newest);
          });
          unsubsRef.current.set(topic, unsub);
        }
      }
    };

    connectedUrlRef.current = initialUrlRef.current;
    bridge.connect(connectedUrlRef.current);
    setReady(true);

    // frame 列表与 TF 树低频刷新
    const framesTimer = setInterval(() => {
      const next = tf.frames();
      setFrames((prev) => (prev.join() === next.join() ? prev : next));
      const nextTree = tf.tree();
      setTfTree((prev) => {
        if (prev.size === nextTree.size && [...nextTree].every(([c, p]) => prev.get(c) === p)) {
          return prev;
        }
        return nextTree;
      });
    }, 500);

    return () => {
      clearInterval(framesTimer);
      for (const unsub of topicSubscriptions.values()) unsub();
      topicSubscriptions.clear();
      for (const unsub of displaySubscriptions.values()) unsub();
      displaySubscriptions.clear();
      setReady(false);
      bridge.dispose();
    };
  }, []);

  useEffect(() => {
    if (!active || !ready || connState !== "open") return;
    if (!services.some((service) => service.name === "/fruit_robviz_bridge/reload_image_settings")) return;
    const bridge = bridgeRef.current;
    if (!bridge) return;
    let cancelled = false;
    void bridge.callService("/fruit_robviz_bridge/reload_image_settings", {})
      .catch((error: unknown) => {
        if (!cancelled) {
          setLastError(`图像配置重载失败: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
    return () => { cancelled = true; };
  }, [active, connState, ready, services]);

  const attachSceneCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    setSceneCanvas(canvas);
  }, []);

  // SceneManager 的生命周期跟随 3D 面板。关闭面板会释放 WebGL 和显示订阅，
  // 再次添加时使用保留的相机与持久化场景状态重新创建。
  useEffect(() => {
    const tf = tfRef.current;
    if (!ready || !sceneCanvas || !tf) return;
    const mountState = sceneMountStateRef.current;
    const displaySubscriptions = displaySubsRef.current;

    const scene = new SceneManager(sceneCanvas, tf);
    sceneRef.current = scene;
    scene.onStats = setSceneStats;
    scene.onDisplayError = (topic, message) => setLastError(`${topic} ${message}`);
    scene.enableAutoFitTf();
    scene.setFontScale(mountState.effectiveFontScale);
    scene.fixedFrame = mountState.fixedFrame;
    scene.setFollowFrame(mountState.followFrame);
    scene.setGridVisible(mountState.groundVisible);
    scene.setTfAxesLineWidth(mountState.tfAxesLineWidth);
    scene.setControlsEnabled(mountState.pcdTool === "orbit" && !mountState.navTool);
    scene.setActive(mountState.active);
    setSceneGeneration((current) => current + 1);

    return () => {
      savedCameraRef.current = scene.getCameraState();
      for (const unsub of displaySubscriptions.values()) unsub();
      displaySubscriptions.clear();
      scene.dispose();
      if (sceneRef.current === scene) sceneRef.current = null;
      pcdRendererRef.current = null;
      setPcd(undefined);
      setPcdBusy(undefined);
      setPcdTool("orbit");
    };
  }, [ready, sceneCanvas]);

  // 大帧消费属于机器会话而不是 3D 面板：当前机器每帧只取每话题最新值，
  // 非活动机器不消费，切回时立即刷新图像、曲线和 3D。
  useEffect(() => {
    if (!ready || !active) return;
    let frame = 0;
    const flush = () => {
      if (bridgeRef.current?.flushFrame()) sceneRef.current?.invalidate();
      frame = requestAnimationFrame(flush);
    };
    frame = requestAnimationFrame(flush);
    return () => cancelAnimationFrame(frame);
  }, [active, ready]);

  // CLI 只连接当前机器；没有 3D 面板时由当前会话明确返回错误。
  useEffect(() => {
    if (!active || !ready) return;
    return startAgentChannel({
      screenshot: () => {
        const scene = sceneRef.current;
        if (!panels.some((panel) => panel.kind === "3d") || !scene) {
          throw new Error("当前工作区没有 3D 面板");
        }
        return scene.screenshot();
      },
    });
  }, [active, panels, ready]);

  useEffect(() => {
    sceneRef.current?.setFontScale(effectiveFontScale);
  }, [effectiveFontScale]);

  // 主题：同步 CSS 令牌、3D 场景配色与持久化
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = settings.language;
    setSceneTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme, settings.language]);

  useEffect(() => {
    setSettings((current) => {
      if (
        current.language === globalSettings.language &&
        current.fontScale === globalSettings.fontScale &&
        current.disabledPluginIds.join("\0") === globalSettings.disabledPluginIds.join("\0")
      ) return current;
      return {
        ...current,
        language: globalSettings.language,
        fontScale: globalSettings.fontScale ?? 1,
        disabledPluginIds: globalSettings.disabledPluginIds,
      };
    });
  }, [globalSettings]);

  useEffect(() => {
    if (!active) return;
    onGlobalSettingsChange({
      language: settings.language,
      fontScale: settings.fontScale,
      disabledPluginIds: settings.disabledPluginIds,
    });
  }, [active, settings.language, settings.fontScale, settings.disabledPluginIds, onGlobalSettingsChange]);

  useEffect(() => {
    onConnectionStateChange(session.id, connState);
  }, [connState, onConnectionStateChange, session.id]);

  useEffect(() => {
    sceneRef.current?.setActive(active);
    bridgeRef.current?.setStreamingActive(active);
    if (!active) {
      setTerminalVisible(false);
      setTerminalMounted(false);
    }
  }, [active, ready, sceneGeneration]);

  const toggleTheme = useCallback(() => {
    // 切换瞬间挂全局颜色过渡（常态不挂，避免干扰其他 transition）
    const root = document.documentElement;
    root.classList.add("theme-anim");
    setTimeout(() => root.classList.remove("theme-anim"), 350);
    onThemeChange(theme === "dark" ? "light" : "dark");
  }, [onThemeChange, theme]);

  // fixed frame 兜底：优先 map，否则第一个可用 frame
  useEffect(() => {
    if (frames.length === 0) return;
    if (frames.includes(fixedFrame)) return;
    const next = frames.includes("map") ? "map" : frames[0];
    setFixedFrame(next);
  }, [frames, fixedFrame]);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.fixedFrame = fixedFrame;
  }, [fixedFrame]);

  useEffect(() => {
    sceneRef.current?.setGridVisible(settings.groundVisible);
    sceneRef.current?.setTfAxesLineWidth(settings.tfAxesLineWidth);
  }, [settings.groundVisible, settings.tfAxesLineWidth]);

  // 视角跟踪目标
  useEffect(() => {
    sceneRef.current?.setFollowFrame(followFrame);
  }, [followFrame]);

  // 框选 / Nav 工具激活时关闭轨道控制
  useEffect(() => {
    sceneRef.current?.setControlsEnabled(pcdTool === "orbit" && !navTool);
  }, [pcdTool, navTool]);

  const connect = useCallback(() => {
    setLastError(undefined);
    if (connectedUrlRef.current !== url) {
      tfRef.current?.clear();
      setFrames([]);
      setTfTree(new Map());
      sceneRef.current?.invalidate();
    }
    connectedUrlRef.current = url;
    setActiveBridgeUrl(url);
    bridgeRef.current?.connect(url);
  }, [url]);

  const toggleTerminal = useCallback(() => {
    setTerminalMounted(true);
    setTerminalVisible((current) => !current);
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.metaKey || event.altKey || event.code !== "Backquote") return;
      event.preventDefault();
      toggleTerminal();
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [active, toggleTerminal]);

  useEffect(() => {
    localStorage.setItem(TERMINAL_HEIGHT_KEY, String(terminalHeight));
  }, [terminalHeight]);

  const toggleTopic = useCallback((topic: string, schemaName: string) => {
    setDesired((prev) => {
      const next = new Map(prev);
      if (next.has(topic)) next.delete(topic);
      else if (schemaName in displayFactories) {
        next.set(topic, {
          schemaName,
          ...(schemaName === "sensor_msgs/msg/PointCloud2"
            ? { pointCloud: { ...DEFAULT_POINT_CLOUD_SETTINGS } }
            : {}),
        });
      }
      else return prev;
      return next;
    });
  }, [displayFactories]);

  const updatePointCloudSettings = useCallback((topic: string, settings: PointCloudSettings) => {
    setDesired((prev) => {
      const entry = prev.get(topic);
      if (!entry) return prev;
      const next = new Map(prev);
      next.set(topic, { ...entry, pointCloud: settings });
      return next;
    });
  }, []);

  // 期望话题 → 实际订阅/显示器的对账。话题未上报时挂起，出现后自动补订阅
  // （rviz 同款行为，配置加载先于话题广播到达也能生效）。
  useEffect(() => {
    if (!ready) return;
    const bridge = bridgeRef.current!;
    const scene = sceneRef.current;
    if (!scene) return;
    const subs = displaySubsRef.current;

    for (const [topic, unsub] of subs) {
      const entry = desired.get(topic);
      if (!entry || !(entry.schemaName in displayFactories)) {
        unsub();
        subs.delete(topic);
        scene.removeDisplay(topic);
      }
    }

    const advertised = new Set(topics.map((t) => t.topic));
    for (const [topic, entry] of desired) {
      const existing = scene.getDisplay(topic);
      if (existing) {
        // 已显示：同步累积开关
        if (existing instanceof PointCloudRenderer) {
          existing.applySettings(entry.pointCloud ?? DEFAULT_POINT_CLOUD_SETTINGS);
          scene.invalidate();
        }
        continue;
      }
      if (!advertised.has(topic)) continue;
      const factory = displayFactories[entry.schemaName];
      if (!factory) continue;
      const display = factory();
      if (display instanceof PointCloudRenderer) {
        display.applySettings(entry.pointCloud ?? DEFAULT_POINT_CLOUD_SETTINGS);
      }
      scene.addDisplay(topic, display);
      subs.set(
        topic,
        bridge.subscribe(topic, (payload) => display.update(payload)),
      );
    }
  }, [ready, sceneGeneration, desired, topics, displayFactories]);

  // ---- v2 会话配置保存/加载 ----

  const sessionModeRef = useRef(session.mode);
  if (mode !== "settings") sessionModeRef.current = mode;

  const buildSessionConfig = useCallback((): RobotSessionConfig => ({
    id: session.id,
    name: session.name,
    url,
    mediaUrl: session.mediaUrl,
    mode: mode === "settings" ? sessionModeRef.current : mode,
    fixedFrame,
    scene: {
      groundVisible: settings.groundVisible,
      tfAxesLineWidth: settings.tfAxesLineWidth,
    },
    urdfInspectorPercent: workspace.urdfInspectorPercent,
    pcdVoxel,
    followFrame,
    activeTopics: [...desired].map(([topic, entry]) => ({
      topic,
      schemaName: entry.schemaName,
      ...(entry.pointCloud ? { pointCloud: entry.pointCloud } : {}),
    })),
    pluginState: pluginStates,
    initializedPluginSectionIds: [...initializedPluginSectionIds],
    autoAddPluginSections: session.autoAddPluginSections,
    panels: panels.map((panel) => ({ ...panel })),
    dockLayout,
    camera: sceneRef.current?.getCameraState() ?? savedCameraRef.current,
  }), [desired, dockLayout, fixedFrame, followFrame, initializedPluginSectionIds, mode, panels, pcdVoxel, pluginStates, session.autoAddPluginSections, session.id, session.mediaUrl, session.name, settings.groundVisible, settings.tfAxesLineWidth, url, workspace.urdfInspectorPercent]);

  const buildSessionConfigRef = useRef(buildSessionConfig);
  buildSessionConfigRef.current = buildSessionConfig;

  const saveConfig = useCallback(() => {
    onSaveAll(buildSessionConfig());
  }, [buildSessionConfig, onSaveAll]);

  const saveConfigAsFile = useCallback(() => {
    onSaveAllAsFile(buildSessionConfig());
  }, [buildSessionConfig, onSaveAllAsFile]);

  const openConfigFile = useCallback(
    async (file: File) => {
      onLoadAll(file);
    },
    [onLoadAll],
  );

  const lastEmittedSessionRef = useRef("");
  useEffect(() => {
    if (!ready) return;
    const emit = () => {
      const snapshot = buildSessionConfigRef.current();
      const serialized = JSON.stringify(snapshot);
      if (serialized === lastEmittedSessionRef.current) return;
      lastEmittedSessionRef.current = serialized;
      onSessionChange(snapshot);
    };
    emit();
    const timer = setInterval(emit, 1000);
    return () => clearInterval(timer);
  }, [onSessionChange, ready]);

  // ---- PCD 加载 / 清理 ----

  const closePcd = useCallback(() => {
    sceneRef.current?.removeDisplay(PCD_KEY);
    pcdRendererRef.current = null;
    setPcd(undefined);
    setPcdTool("orbit");
  }, []);

  const openPcdFile = useCallback(
    async (file: File) => {
      closePcd();
      setLastError(undefined);
    setPcdBusy(t("readingFile"));
      const buffer = await file.arrayBuffer();
      const worker = new Worker(new URL("../worker/pcd.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.onmessage = (ev: MessageEvent<PcdWorkerResponse>) => {
        const msg = ev.data;
        if (msg.type === "progress") {
          setPcdBusy(t(msg.stage));
        } else if (msg.type === "error") {
          worker.terminate();
          setPcdBusy(undefined);
          setLastError(t("pcdParseFailed", { message: msg.message }));
        } else {
          worker.terminate();
          const scene = sceneRef.current!;
          const renderer = new EditableCloudRenderer(
            { count: msg.count, positions: msg.positions, intensity: msg.intensity },
            scene.fixedFrame,
            () => scene.invalidate(),
          );
          pcdRendererRef.current = renderer;
          scene.addDisplay(PCD_KEY, renderer);
          scene.flyToFit(renderer.bounds);
          setPcd({
            name: file.name,
            count: msg.count,
            rawCount: msg.rawCount,
            undoDepth: 0,
            parseMs: msg.parseMs,
          });
          setPcdBusy(undefined);
        }
      };
      worker.postMessage({ type: "parse", buffer, voxel: pcdVoxel }, [buffer]);
    },
    [closePcd, pcdVoxel, t],
  );

  const refreshPcdInfo = useCallback(() => {
    const r = pcdRendererRef.current;
    if (!r) return;
    setPcd((prev) => (prev ? { ...prev, count: r.count, undoDepth: r.undoDepth } : prev));
    sceneRef.current?.invalidate();
  }, []);

  const pcdUndo = useCallback(() => {
    pcdRendererRef.current?.undo();
    refreshPcdInfo();
  }, [refreshPcdInfo]);

  const pcdExport = useCallback(() => {
    const r = pcdRendererRef.current;
    if (!r || !pcd) return;
    downloadBuffer(r.exportPcd(), pcd.name.replace(/\.pcd$/i, "") + "_edited.pcd");
  }, [pcd]);

  // 框选：overlay 上拖拽矩形，松开时按 NDC 应用删除/保留
  const onSelectDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const box = e.currentTarget.getBoundingClientRect();
    selectStartRef.current = [e.clientX - box.left, e.clientY - box.top];
    setSelectRect({ x: e.clientX - box.left, y: e.clientY - box.top, w: 0, h: 0 });
  }, []);

  const onSelectMove = useCallback((e: React.PointerEvent) => {
    const start = selectStartRef.current;
    if (!start) return;
    const box = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - box.left;
    const cy = e.clientY - box.top;
    setSelectRect({
      x: Math.min(start[0], cx),
      y: Math.min(start[1], cy),
      w: Math.abs(cx - start[0]),
      h: Math.abs(cy - start[1]),
    });
  }, []);

  const onSelectUp = useCallback(
    (e: React.PointerEvent) => {
      const start = selectStartRef.current;
      selectStartRef.current = null;
      setSelectRect(undefined);
      const renderer = pcdRendererRef.current;
      const scene = sceneRef.current;
      if (!start || !renderer || !scene) return;
      const box = e.currentTarget.getBoundingClientRect();
      const cx = e.clientX - box.left;
      const cy = e.clientY - box.top;
      if (Math.abs(cx - start[0]) < 3 || Math.abs(cy - start[1]) < 3) return;
      // 像素 → NDC（y 翻转）
      const nx0 = (Math.min(start[0], cx) / box.width) * 2 - 1;
      const nx1 = (Math.max(start[0], cx) / box.width) * 2 - 1;
      const ny0 = -((Math.max(start[1], cy) / box.height) * 2 - 1);
      const ny1 = -((Math.min(start[1], cy) / box.height) * 2 - 1);
      renderer.applyRect(
        scene.camera,
        { minX: nx0, maxX: nx1, minY: ny0, maxY: ny1 },
        pcdTool === "delete",
      );
      refreshPcdInfo();
    },
    [pcdTool, refreshPcdInfo],
  );

  // ---- Nav Goal / Pose Estimate：点下定位置，拖动定朝向，松开发布 ----

  const groundPoint = useCallback(
    (e: { clientX: number; clientY: number; currentTarget: Element }): [number, number] | undefined => {
      const scene = sceneRef.current;
      if (!scene) return undefined;
      const box = e.currentTarget.getBoundingClientRect();
      const ndcX = ((e.clientX - box.left) / box.width) * 2 - 1;
      const ndcY = -(((e.clientY - box.top) / box.height) * 2 - 1);
      const cam = scene.camera;
      const origin = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
      const dir = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(cam).sub(origin).normalize();
      if (Math.abs(dir.z) < 1e-6) return undefined;
      const t = -origin.z / dir.z;
      if (t <= 0) return undefined;
      return [origin.x + dir.x * t, origin.y + dir.y * t];
    },
    [],
  );

  // 双击视口：相机平滑聚焦到地面点
  const onViewportDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const p = groundPoint(e);
      if (p) sceneRef.current?.flyTo(new THREE.Vector3(p[0], p[1], 0));
    },
    [groundPoint],
  );

  const onNavDown = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const p = groundPoint(e);
      if (!p) return;
      navStartRef.current = p;
      const box = e.currentTarget.getBoundingClientRect();
      setNavPreview({ x: e.clientX - box.left, y: e.clientY - box.top, yawDeg: 0, len: 0 });
    },
    [groundPoint],
  );

  const onNavMove = useCallback((e: React.PointerEvent) => {
    if (!navStartRef.current) return;
    // currentTarget 只在事件同步传播期间有效，必须在 setState 回调外读取
    const box = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - box.left;
    const py = e.clientY - box.top;
    setNavPreview((prev) => {
      if (!prev) return prev;
      const dx = px - prev.x;
      const dy = py - prev.y;
      return { ...prev, yawDeg: (Math.atan2(dy, dx) * 180) / Math.PI, len: Math.hypot(dx, dy) };
    });
  }, []);

  const cancelNav = useCallback(() => {
    navStartRef.current = null;
    setNavPreview(undefined);
    setNavTool(undefined);
  }, []);

  const onNavUp = useCallback(
    (e: React.PointerEvent) => {
      const start = navStartRef.current;
      navStartRef.current = null;
      setNavPreview(undefined);
      const toolId = navTool;
      setNavTool(undefined);
      if (!start || !toolId) return;
      const end = groundPoint(e) ?? start;
      const ctx = pluginCtxRef.current;
      const tool = viewportToolsRef.current.find((candidate) => candidate.id === toolId);
          if (!ctx || !tool || !ctx.active || ctx.connectionState !== "open") return;
          try {
            tool.onPoseSelect(ctx, {
              position: { x: start[0], y: start[1], z: 0 },
              yaw: Math.atan2(end[1] - start[1], end[0] - start[0]),
            });
          } catch (error) {
            setLastError(`Viewport tool ${tool.id} failed: ${error instanceof Error ? error.message : String(error)}`);
          }
    },
    [groundPoint, navTool],
  );

  // ---- 面板坞 ----

  const addPanel = useCallback((kind: string) => {
    setPanels((current) => {
      if (!canAddPanel(current, kind)) return current;
      const id = createPanelId(kind, new Set(current.map((panel) => panel.id)));
      return [...current, { id, kind }];
    });
  }, []);

  const removePanel = useCallback((id: string) => {
    setPanels((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleWorkspacePanelClosed = useCallback((id: string) => {
    const panel = panels.find((candidate) => candidate.id === id);
    if (panel?.kind.startsWith("plugin-section:")) {
      const sectionPluginId = panel.kind.slice("plugin-section:".length).split(":")[0];
      if (settings.disabledPluginIds.includes(sectionPluginId)) return;
    }
    removePanel(id);
  }, [panels, removePanel, settings.disabledPluginIds]);

  /** 面板内部状态快照上报（进配置文件） */
  const updatePanelState = useCallback((id: string, state: unknown) => {
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, state } : p)));
  }, []);

  const updatePluginState = useCallback((pluginId: string, state: unknown) => {
    setPluginStates((current) => ({ ...current, [pluginId]: state }));
  }, []);

  const togglePlugin = useCallback((pluginId: string, enabled: boolean) => {
    setSettings((current) => ({
      ...current,
      disabledPluginIds: enabled
        ? current.disabledPluginIds.filter((id) => id !== pluginId)
        : [...new Set([...current.disabledPluginIds, pluginId])],
    }));
  }, []);

  const resetWorkspaceLayout = useCallback(() => {
    setWorkspace({ ...DEFAULT_WORKSPACE_LAYOUT });
    setDockLayout(undefined);
  }, []);

  const dataTopics = topics
    .filter((t) => !TF_TOPICS.has(t.topic))
    .sort((a, b) => a.topic.localeCompare(b.topic));
  const hasThreeDPanel = panels.some((panel) => panel.kind === "3d");

  const allPluginPanelKinds = useMemo(
    () => new Set(plugins.flatMap((plugin) => (plugin.panels ?? []).map((panel) => `${plugin.id}:${panel.kind}`))),
    [],
  );
  const activePluginPanelKinds = useMemo(
    () => new Set(resolvedPlugins.panels.map((panel) => panel.kind)),
    [resolvedPlugins.panels],
  );
  const visiblePanels = panels.filter((panel) => {
    if (panel.kind.startsWith("plugin-section:")) {
      return resolvedPlugins.sections.some((section) => `plugin-section:${section.id}` === panel.kind);
    }
    return panel.kind === "image" || panel.kind === "plot" || !allPluginPanelKinds.has(panel.kind) || activePluginPanelKinds.has(panel.kind);
  });

  // 插件上下文（ready 后 refs 一定已就绪）
  const pluginCtx = useMemo<PluginContext | undefined>(() => {
    if (!ready) return undefined;
    return {
      bridge: bridgeRef.current!,
      topics,
      tf: tfRef.current!,
      fixedFrame,
      theme,
      locale: settings.language,
      active,
      connectionState: connState,
      pluginStates,
      onPluginStateChange: updatePluginState,
    };
  }, [active, connState, fixedFrame, pluginStates, ready, settings.language, theme, topics, updatePluginState]);

  pluginCtxRef.current = pluginCtx ?? null;
  viewportToolsRef.current = resolvedPlugins.viewportTools;

  useEffect(() => {
    if (!active || connState !== "open" || (navTool && !resolvedPlugins.viewportTools.some((tool) => tool.id === navTool))) {
      cancelNav();
    }
  }, [active, cancelNav, connState, navTool, resolvedPlugins.viewportTools]);

  useEffect(() => {
    const additions: DockPanel[] = [];
    const initialized = new Set(initializedPluginSectionIds);
    for (const section of resolvedPlugins.sections) {
      const kind = `plugin-section:${section.id}`;
      if (!session.autoAddPluginSections || initialized.has(section.id)) continue;
      initialized.add(section.id);
      if (!panels.some((panel) => panel.kind === kind)) additions.push({ id: kind, kind });
    }
    if (initialized.size !== initializedPluginSectionIds.size) {
      setInitializedPluginSectionIds(initialized);
    }
    if (additions.length > 0) {
      setPanels((current) => [
        ...current,
        ...additions.filter((addition) => !current.some((panel) => panel.kind === addition.kind)),
      ]);
    }
  }, [initializedPluginSectionIds, panels, resolvedPlugins.sections, session.autoAddPluginSections]);

  const panelTitle = useCallback((kind: string) => {
    if (kind === "3d") return t("view3d");
    if (kind === "topics") return t("topics");
    if (kind === "echo") return t("echoTopic");
    if (kind === "tf-tree") return t("tfTree");
    if (kind === "image") return t("imagePanel");
    if (kind === "plot") return t("plotPanel");
    if (kind.startsWith("plugin-section:")) {
      return resolvedPlugins.sections.find((section) => `plugin-section:${section.id}` === kind)?.title ?? kind;
    }
    return resolvedPlugins.panels.find((panel) => panel.kind === kind)?.title ?? kind;
  }, [resolvedPlugins.panels, resolvedPlugins.sections, t]);

  const renderWorkspacePanel = useCallback((panel: WorkspacePanel) => {
    const storedPanel = panels.find((candidate) => candidate.id === panel.id) ?? panel;

    if (panel.kind === "3d") {
      const selectedTool = navTool
        ? resolvedPlugins.viewportTools.find((tool) => tool.id === navTool)
        : undefined;

      return (
        <div className="workspace-panel">
          <div className="viewport" onDoubleClick={onViewportDoubleClick}>
            <canvas ref={attachSceneCanvas} />
            <div className="nav-toolbar">
              {pluginCtx && resolvedPlugins.viewportTools.map((tool) => (
                <button
                  key={tool.id}
                  className={navTool === tool.id ? "active" : ""}
                  disabled={!active || connState !== "open"}
                  title={tool.hint?.(pluginCtx)}
                  onClick={() => setNavTool(navTool === tool.id ? undefined : tool.id)}
                >
                  {tool.title(pluginCtx)}
                </button>
              ))}
              <button onClick={() => sceneRef.current?.resetViewToTf()} title={t("resetViewTfHint")}>
                {t("resetView")}
              </button>
              <button
                className={`icon-action ${settings.groundVisible ? "active" : ""}`}
                onClick={() => setSettings((current) => ({ ...current, groundVisible: !current.groundVisible }))}
                title={t("ground")}
                aria-label={t("ground")}
                aria-pressed={settings.groundVisible}
              >
                <Grid3X3 />
              </button>
              <label className={`field follow-field ${followFrame ? "following" : ""}`}>
                {t("follow")}
                <select value={followFrame ?? ""} onChange={(event) => setFollowFrame(event.target.value || undefined)}>
                  <option value="">{t("off")}</option>
                  {frames.map((frame) => <option key={frame} value={frame}>{frame}</option>)}
                </select>
              </label>
              {selectedTool && pluginCtx && <span className="nav-hint">{selectedTool.hint?.(pluginCtx)}</span>}
            </div>
            {(pcd || pcdBusy) && (
              <div className="pcd-toolbar">
                {pcdBusy ? <span className="pcd-status">{pcdBusy}</span> : pcd && (
                  <>
                    <span className="pcd-status">
                      {pcd.name} · {t("pointsMillions", { count: (pcd.count / 1e6).toFixed(2) })}
                      {pcd.rawCount !== pcd.count && t("originalPoints", { count: (pcd.rawCount / 1e6).toFixed(2) })}
                    </span>
                    <button className={pcdTool === "orbit" ? "active" : ""} onClick={() => setPcdTool("orbit")}>{t("browsing")}</button>
                    <button className={pcdTool === "delete" ? "active" : ""} onClick={() => setPcdTool("delete")}>{t("boxDelete")}</button>
                    <button className={pcdTool === "keep" ? "active" : ""} onClick={() => setPcdTool("keep")}>{t("boxKeep")}</button>
                    <button onClick={pcdUndo} disabled={pcd.undoDepth === 0}>{t("undoCount", { count: pcd.undoDepth })}</button>
                    <button onClick={pcdExport}>{t("export")}</button>
                    <button onClick={closePcd}>{t("close")}</button>
                  </>
                )}
              </div>
            )}
            {pcd && pcdTool !== "orbit" && !navTool && (
              <div className="select-overlay" onPointerDown={onSelectDown} onPointerMove={onSelectMove} onPointerUp={onSelectUp}>
                {selectRect && <div className="select-rect" style={{ left: selectRect.x, top: selectRect.y, width: selectRect.w, height: selectRect.h }} />}
              </div>
            )}
            {navTool && (
              <div className="select-overlay nav-overlay" onPointerDown={onNavDown} onPointerMove={onNavMove} onPointerUp={onNavUp} onPointerCancel={cancelNav}>
                {navPreview && navPreview.len > 4 && (
                  <div className="nav-arrow" style={{ left: navPreview.x, top: navPreview.y, width: navPreview.len, transform: `rotate(${navPreview.yawDeg}deg)` }} />
                )}
              </div>
            )}
            <div className="hud">
              {sceneStats.brokenFrames.length > 0 && <div className="warn">{t("tfBroken", { frames: sceneStats.brokenFrames.join(", ") })}</div>}
              {streamStats && streamStats.lagMs > 200 && <div className="warn">{t("networkLag", { ms: streamStats.lagMs })}</div>}
              {streamStats && streamStats.totalHz > 0 && (
                <div>
                  {(streamStats.totalKbps / 1024).toFixed(1)} MB/s · {Math.round(streamStats.totalHz)} msg/s
                  {streamStats.totalDropsPerSec > 0 && ` · ${t("dropped", { count: Math.round(streamStats.totalDropsPerSec) })}`}
                  {` · ${t("lagStat", { ms: streamStats.lagMs })}`}
                </div>
              )}
              <div>render {sceneStats.renderHz}/s · {t("tfSmoothing", { ms: sceneStats.tfDelayMs })}</div>
            </div>
          </div>
        </div>
      );
    }

    if (panel.kind === "topics") {
      return (
        <div className="workspace-panel utility-panel">
          {dataTopics.length === 0 && <p className="empty-hint">{t("noTopics")}</p>}
          {dataTopics.map(({ topic, schemaName }) => {
            const displayable = schemaName in displayFactories;
            const isActive = desired.has(topic);
            const topicStat = streamStats?.topics[topic];
            return (
              <div key={topic}>
                <button
                  className={`topic-row ${isActive ? "active" : ""} ${displayable ? "" : "disabled"}`}
                  onClick={() => displayable && toggleTopic(topic, schemaName)}
                  disabled={!displayable}
                >
                  <span className="check">{isActive ? "✓" : ""}</span>
                  <span className="name">{topic}</span>
                  <span className="schema">{topicStat ? `${topicStat.hz.toFixed(0)} Hz` : schemaName.split("/").pop()}</span>
                </button>
                {isActive && schemaName === "sensor_msgs/msg/PointCloud2" && (() => {
                  const renderer = sceneRef.current?.getDisplay(topic);
                  const pointCloudRenderer = renderer instanceof PointCloudRenderer ? renderer : undefined;
                  return (
                    <PointCloudSettingsPanel
                      settings={desired.get(topic)?.pointCloud ?? DEFAULT_POINT_CLOUD_SETTINGS}
                      colorField={pointCloudRenderer?.colorField}
                      autoRange={pointCloudRenderer?.autoRange ?? [0, 1]}
                      onChange={(next) => updatePointCloudSettings(topic, next)}
                      onClear={() => { pointCloudRenderer?.clear(); sceneRef.current?.invalidate(); }}
                    />
                  );
                })()}
              </div>
            );
          })}
          {lastError && <p className="error-line">{lastError}</p>}
        </div>
      );
    }

    if (panel.kind === "echo" && ready) {
      return <div className="workspace-panel utility-panel"><EchoTopicSection bridge={bridgeRef.current!} topics={topics} /></div>;
    }
    if (panel.kind === "tf-tree") {
      return (
        <div className="workspace-panel utility-panel">
          <TfTreeSection tree={tfTree} followFrame={followFrame} onFollow={(frame) => setFollowFrame((current) => current === frame ? undefined : frame)} />
        </div>
      );
    }
    if (panel.kind === "image" && ready) {
      const imageState = storedPanel.state as
        | { topic?: string; preferRaw?: boolean; useWebRtc?: boolean }
        | undefined;
      return (
        <ImagePanel
          embedded
          active={active}
          bridge={bridgeRef.current!}
          topics={topics}
          initialTopic={imageState?.topic}
          initialPreferRaw={imageState?.preferRaw}
          initialUseWebRtc={imageState?.useWebRtc !== false}
          mediaUrl={session.mediaUrl}
          onTopicChange={(topic, preferRaw, useWebRtc) =>
            updatePanelState(panel.id, { topic, preferRaw, useWebRtc })
          }
          onClose={() => removePanel(panel.id)}
        />
      );
    }
    if (panel.kind === "plot" && ready) {
      return (
        <Suspense fallback={null}>
          <PlotPanel
            embedded
            bridge={bridgeRef.current!}
            topics={topics}
            theme={theme}
            fontScale={effectiveFontScale}
            initialSeries={(storedPanel.state as { series?: Array<{ topic: string; field: string }> } | undefined)?.series}
            onSeriesChange={(series) => updatePanelState(panel.id, { series })}
            onClose={() => removePanel(panel.id)}
          />
        </Suspense>
      );
    }
    if (panel.kind.startsWith("plugin-section:") && pluginCtx) {
      const section = resolvedPlugins.sections.find((candidate) => `plugin-section:${candidate.id}` === panel.kind);
      return section ? <div className="workspace-panel utility-panel"><section.component ctx={pluginCtx} /></div> : null;
    }
    const pluginPanel = resolvedPlugins.panels.find((candidate) => candidate.kind === panel.kind);
    if (pluginPanel && pluginCtx) {
      return (
        <pluginPanel.component
          ctx={pluginCtx}
          state={storedPanel.state}
          onStateChange={(state) => updatePanelState(panel.id, state)}
          onClose={() => removePanel(panel.id)}
        />
      );
    }
    return <div className="workspace-panel"><p className="empty-hint">{t("unknownPanel", { kind: panel.kind })}</p></div>;
  }, [active, attachSceneCanvas, cancelNav, closePcd, connState, dataTopics, desired, displayFactories, effectiveFontScale, followFrame, frames, lastError, navPreview, navTool, onNavDown, onNavMove, onNavUp, onSelectDown, onSelectMove, onSelectUp, onViewportDoubleClick, panels, pcd, pcdBusy, pcdExport, pcdTool, pcdUndo, pluginCtx, ready, removePanel, resolvedPlugins.panels, resolvedPlugins.sections, resolvedPlugins.viewportTools, sceneStats, selectRect, services, session.mediaUrl, settings.groundVisible, streamStats, t, tfTree, theme, toggleTopic, topics, updatePanelState, updatePointCloudSettings]);

  return (
    <I18nProvider locale={settings.language}>
    {active && headerActionsSlot && createPortal(
      <>
        <div className="topbar-connection-group">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && connect()}
            spellCheck={false}
          />
          <button onClick={connect}>{t("connect")}</button>
          <span className={`status ${connState}`}>
            <span className="dot" />
            {connState === "open" ? t("connected") : connState === "connecting" ? t("connecting") : t("disconnected")}
          </span>
        </div>
        <div className="topbar-config-group">
          <button onClick={saveConfig} title={t("saveConfigHint")}>
            {t("saveConfig")}
          </button>
          <button onClick={saveConfigAsFile} title={t("saveConfigAsFileHint")}>
            {t("saveConfigAsFile")}
          </button>
          <button onClick={() => configFileRef.current?.click()} title={t("loadConfigHint")}>
            {t("loadConfig")}
          </button>
          <input
            ref={configFileRef}
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void openConfigFile(f);
              e.target.value = "";
            }}
          />
        </div>
        <div className="topbar-actions-group">
          <button
            className={`icon-btn ${terminalVisible ? "active" : ""}`}
            onClick={toggleTerminal}
            title={t("terminal")}
            aria-label={t("terminal")}
            aria-pressed={terminalVisible}
          >
            <SquareTerminal />
          </button>
          <button
            className="icon-btn"
            onClick={toggleTheme}
            title={theme === "dark" ? t("switchLight") : t("switchDark")}
            aria-label={t("switchTheme")}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </button>
          <button
            className={`icon-btn ${mode === "settings" ? "active" : ""}`}
            onClick={() => setMode((current) => (current === "settings" ? (sessionModeRef.current || "3d") : "settings"))}
            title={t("settings")}
            aria-label={t("settings")}
          >
            <Settings />
          </button>
        </div>
      </>,
      headerActionsSlot,
    )}
    <div className="app">
      <header className="topbar">
        <nav className="mode-tabs">
          <button className={mode === "3d" ? "active" : ""} onClick={() => setMode("3d")}>
            {t("view3d")}
          </button>
          <button className={mode === "map" ? "active" : ""} onClick={() => setMode("map")}>
            {t("mapEditor")}
          </button>
          <button className={mode === "urdf" ? "active" : ""} onClick={() => setMode("urdf")}>
            {t("urdfEditor")}
          </button>
          <button className={mode === "waypoints" ? "active" : ""} onClick={() => setMode("waypoints")}>
            {t("waypointsEditor")}
          </button>
          <button className={mode === "capture" ? "active" : ""} onClick={() => setMode("capture")}>
            {t("imageCollect")}
          </button>
        </nav>
        {mode === "3d" && (
          <details className="panel-menu">
            <summary title={t("addPanel")}>
              <PanelTopOpen /> {t("addPanel")}
            </summary>
            <div className="panel-menu-popover" role="menu">
              {[
                ["3d", t("view3d")],
                ["topics", t("topics")],
                ["echo", t("echoTopic")],
                ["tf-tree", t("tfTree")],
                ["image", t("imagePanel")],
                ["plot", t("plotPanel")],
              ].map(([kind, label]) => (
                <button
                  key={kind}
                  role="menuitem"
                  onClick={(event) => {
                    addPanel(kind);
                    event.currentTarget.closest("details")?.removeAttribute("open");
                  }}
                  disabled={!canAddPanel(panels, kind)}
                >
                  {label}
                </button>
              ))}
              {resolvedPlugins.panels.map((pluginPanel) => (
                <button key={pluginPanel.kind} role="menuitem" onClick={() => addPanel(pluginPanel.kind)}>
                  {pluginPanel.title}
                </button>
              ))}
              {resolvedPlugins.sections.map((section) => {
                const kind = `plugin-section:${section.id}`;
                return (
                  <button key={kind} role="menuitem" onClick={() => addPanel(kind)} disabled={!canAddPanel(panels, kind)}>
                    {section.title}
                  </button>
                );
              })}
            </div>
          </details>
        )}
        {mode === "3d" && hasThreeDPanel && (
          <>
            <label className="field">
              {t("downsample")}
              <select value={pcdVoxel} onChange={(e) => setPcdVoxel(Number(e.target.value))}>
                <option value={0}>{t("original")}</option>
                <option value={0.05}>0.05 m</option>
                <option value={0.1}>0.1 m</option>
                <option value={0.2}>0.2 m</option>
              </select>
            </label>
            <button onClick={() => pcdFileRef.current?.click()}>{t("openPcd")}</button>
            <input
              ref={pcdFileRef}
              type="file"
              accept=".pcd"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) openPcdFile(f);
                e.target.value = "";
              }}
            />
          </>
        )}
        {mode === "3d" && (
          <label className="field">
            Fixed Frame
            <select value={fixedFrame} onChange={(e) => setFixedFrame(e.target.value)}>
              {(frames.length > 0 ? frames : [fixedFrame]).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
        )}
      </header>

      <main className={`main mode-${mode}`}>
        {mode === "3d" && (
          <WorkspaceDock
            panels={visiblePanels}
            layout={dockLayout}
            theme={theme}
            gap={panelGap}
            titleForKind={panelTitle}
            renderPanel={(panel) => (
              <ErrorBoundary name={panelTitle(panel.kind)} onReset={() => removePanel(panel.id)}>
                {renderWorkspacePanel(panel)}
              </ErrorBoundary>
            )}
            onPanelClosed={handleWorkspacePanelClosed}
            onLayoutChange={setDockLayout}
            onInvalidLayout={() => setDockLayout(undefined)}
            maximizeLabel={t("maximizePanel")}
            restoreLabel={t("restorePanel")}
          />
        )}

        {mode === "map" && ready && (
          <ErrorBoundary name={t("mapEditor")}>
            <Suspense fallback={null}>
              <MapEditorPanel bridge={bridgeRef.current!} theme={theme} />
            </Suspense>
          </ErrorBoundary>
        )}
        {mode === "urdf" && ready && (
          <ErrorBoundary name={t("urdfEditor")}>
            <Suspense fallback={<div className="page-loading">{t("loadingUrdf")}</div>}>
              <UrdfEditorPage bridge={bridgeRef.current!} theme={theme} inspectorPercent={workspace.urdfInspectorPercent} isMobile={isMobile} onInspectorPercentChange={(urdfInspectorPercent: number) => setWorkspace((current) => ({ ...current, urdfInspectorPercent }))} />
            </Suspense>
          </ErrorBoundary>
        )}
        {mode === "waypoints" && (
          <ErrorBoundary name={t("waypointsEditor")}>
            <Suspense fallback={<div className="page-loading">{t("waypointsEditor")}</div>}>
              <WaypointsEditorPage
                fontScale={effectiveFontScale}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {mode === "capture" && ready && (
          <ErrorBoundary name={t("imageCollect")}>
            <Suspense fallback={<div className="page-loading">{t("imageCollect")}</div>}>
              <ImageCapturePage
                bridge={bridgeRef.current!}
                topics={topics}
                active={active}
                bridgeUrl={activeBridgeUrl}
                mediaUrl={session.mediaUrl}
                connectionState={connState}
                theme={theme}
                fontScale={effectiveFontScale}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {mode === "settings" && (
          <SettingsPage
            tab={settingsTab}
            settings={settings}
            theme={theme}
            plugins={plugins}
            onTabChange={setSettingsTab}
            onSettingsChange={setSettings}
            onThemeChange={onThemeChange}
            onPluginToggle={togglePlugin}
            onResetLayout={resetWorkspaceLayout}
            bridge={bridgeRef.current!}
            connectionState={connState}
          />
        )}
      </main>
      {terminalMounted && (
        <Suspense
          fallback={
            <div
              className={`terminal-drawer terminal-loading ${terminalVisible ? "visible" : "hidden"}`}
              style={terminalVisible ? { height: terminalHeight } : undefined}
            >
              {t("terminalConnecting")}
            </div>
          }
        >
          <TerminalPanel
            bridgeUrl={activeBridgeUrl}
            theme={theme}
            visible={terminalVisible}
            fontScale={effectiveFontScale}
            height={terminalHeight}
            onHeightChange={setTerminalHeight}
            onHide={() => setTerminalVisible(false)}
          />
        </Suspense>
      )}
    </div>
    </I18nProvider>
  );
}

export default function App() {
  const [config, setConfig] = useState<AppConfig>(readStoredAppConfig);
  const configRef = useRef(config);
  configRef.current = config;
  const [connectionStates, setConnectionStates] = useState<Record<string, ConnectionState>>({});
  const [runtimeGeneration, setRuntimeGeneration] = useState(0);
  const [configError, setConfigError] = useState<string>();
  const [windowSize, setWindowSize] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1440,
    height: typeof window !== "undefined" ? window.innerHeight : 900,
  }));

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const autoScale = useMemo(() => {
    const raw = Math.min(windowSize.width / 1440, windowSize.height / 900);
    return Math.max(0.9, Math.min(1, raw));
  }, [windowSize.width, windowSize.height]);

  const fontScaleSetting = config.settings.fontScale ?? 1;
  const effectiveFontScale = autoScale * fontScaleSetting;
  const isSmallScreen = windowSize.width < 1100 || windowSize.height < 700;
  const panelGap = isSmallScreen ? 6 : 8;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--auto-scale", autoScale.toFixed(4));
    root.style.setProperty("--font-scale", fontScaleSetting.toFixed(4));
    root.style.setProperty("--effective-font-scale", effectiveFontScale.toFixed(4));
    root.style.setProperty("--panel-gap", `${panelGap}px`);
    root.style.setProperty("--panel-radius", "12px");
    root.style.setProperty("--dv-border-radius", "12px");
  }, [autoScale, fontScaleSetting, effectiveFontScale, panelGap]);
  const [headerActionsSlot, setHeaderActionsSlot] = useState<HTMLDivElement | null>(null);
  const editingSessionIdRef = useRef<string | undefined>(undefined);
  const [editingSessionId, setEditingSessionId] = useState<string>();
  const [editingSessionName, setEditingSessionName] = useState("");
  const t = useMemo(
    () => (key: Parameters<typeof translate>[1], values?: Record<string, string | number>) =>
      translate(config.settings.language, key, values),
    [config.settings.language],
  );

  useEffect(() => {
    const timer = setTimeout(() => persistAppConfig(config), 500);
    return () => clearTimeout(timer);
  }, [config]);

  const renameSession = useCallback((id: string, draft: string) => {
    setConfig((current) => renameAppSession(current, id, draft));
  }, []);

  const beginRenameSession = useCallback((session: RobotSessionConfig) => {
    editingSessionIdRef.current = session.id;
    setEditingSessionId(session.id);
    setEditingSessionName(session.name);
  }, []);

  const commitRenameSession = useCallback((id: string) => {
    if (editingSessionIdRef.current !== id) return;
    editingSessionIdRef.current = undefined;
    renameSession(id, editingSessionName);
    setEditingSessionId(undefined);
  }, [editingSessionName, renameSession]);

  const cancelRenameSession = useCallback((id: string) => {
    if (editingSessionIdRef.current !== id) return;
    editingSessionIdRef.current = undefined;
    setEditingSessionId(undefined);
  }, []);

  const updateSession = useCallback((nextSession: RobotSessionConfig) => {
    setConfig((current) => {
      const previous = current.sessions.find((candidate) => candidate.id === nextSession.id);
      if (previous && JSON.stringify(previous) === JSON.stringify(nextSession)) return current;
      return {
        ...current,
        sessions: current.sessions.map((candidate) => candidate.id === nextSession.id ? nextSession : candidate),
      };
    });
  }, []);

  const updateConnectionState = useCallback((id: string, state: ConnectionState) => {
    setConnectionStates((current) => current[id] === state ? current : { ...current, [id]: state });
  }, []);

  const updateTheme = useCallback((theme: Theme) => {
    setConfig((current) => current.theme === theme ? current : { ...current, theme });
  }, []);

  const updateGlobalSettings = useCallback((settings: AppConfig["settings"]) => {
    setConfig((current) => (
      current.settings.language === settings.language &&
      current.settings.fontScale === settings.fontScale &&
      current.settings.disabledPluginIds.join("\0") === settings.disabledPluginIds.join("\0")
        ? current
        : { ...current, settings }
    ));
  }, []);

  const addSession = useCallback(() => {
    setConfig((current) => {
      const session = createDefaultSession(createSessionId(), `机器 ${current.sessions.length + 1}`);
      return { ...current, activeSessionId: session.id, sessions: [...current.sessions, session] };
    });
  }, []);

  const closeSession = useCallback((id: string) => {
    setConfig((current) => {
      if (current.sessions.length === 1) return current;
      const index = current.sessions.findIndex((session) => session.id === id);
      const sessions = current.sessions.filter((session) => session.id !== id);
      const activeSessionId = current.activeSessionId === id
        ? sessions[Math.min(Math.max(0, index), sessions.length - 1)].id
        : current.activeSessionId;
      return { ...current, activeSessionId, sessions };
    });
    setConnectionStates((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const saveAll = useCallback((currentSession: RobotSessionConfig) => {
    const current = configRef.current;
    const next = {
      ...current,
      sessions: current.sessions.map((session) => session.id === currentSession.id ? currentSession : session),
    };
    setConfig(next);
    persistAppConfig(next);
  }, []);

  const saveAllAsFile = useCallback((currentSession: RobotSessionConfig) => {
    const current = configRef.current;
    const next = {
      ...current,
      sessions: current.sessions.map((session) => session.id === currentSession.id ? currentSession : session),
    };
    setConfig(next);
    downloadBlob(new Blob([serializeAppConfig(next)], { type: "application/json" }), "robviz.json");
  }, []);

  const loadAll = useCallback(async (file: File) => {
    try {
      const next = parseAppConfig(await file.text());
      setConfig(next);
      setConnectionStates({});
      setRuntimeGeneration((current) => current + 1);
      setConfigError(undefined);
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  return (
    <div className="app-shell">
      <header className="app-shell-header">
        <div className="app-shell-nav">
          <span className="brand">RobViz</span>
          <div className="session-tabs" role="tablist" aria-label={t("machines")}>
            {config.sessions.map((session) => {
              const active = session.id === config.activeSessionId;
              const state = connectionStates[session.id] ?? "connecting";
              return (
                <div
                  key={session.id}
                  className={`session-tab ${active ? "active" : ""}`}
                  role="tab"
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setConfig((current) => ({ ...current, activeSessionId: session.id }))}
                  onDoubleClick={(event) => {
                    event.stopPropagation();
                    beginRenameSession(session);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "F2") return;
                    event.preventDefault();
                    beginRenameSession(session);
                  }}
                >
                  <span className={`session-status ${state}`} aria-hidden="true" />
                  {editingSessionId === session.id ? (
                    <input
                      className="session-name-input"
                      value={editingSessionName}
                      autoFocus
                      aria-label={t("renameMachine")}
                      onChange={(event) => setEditingSessionName(event.target.value)}
                      onClick={(event) => event.stopPropagation()}
                      onDoubleClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => {
                        event.stopPropagation();
                        if (event.key === "Enter") {
                          event.preventDefault();
                          commitRenameSession(session.id);
                        } else if (event.key === "Escape") {
                          event.preventDefault();
                          cancelRenameSession(session.id);
                        }
                      }}
                      onBlur={() => commitRenameSession(session.id)}
                    />
                  ) : (
                    <span className="session-label" title={session.url}>
                      <span className="session-name">{session.name}</span>
                      <span className="session-target">{connectionTargetLabel(session.url)}</span>
                    </span>
                  )}
                  <button
                    className="session-rename"
                    title={t("renameMachine")}
                    aria-label={t("renameMachine")}
                    onClick={(event) => {
                      event.stopPropagation();
                      beginRenameSession(session);
                    }}
                  >
                    <Pencil />
                  </button>
                  {config.sessions.length > 1 && (
                    <button
                      className="session-close"
                      title={t("closeMachine")}
                      aria-label={t("closeMachine")}
                      onClick={(event) => { event.stopPropagation(); closeSession(session.id); }}
                    >
                      <X />
                    </button>
                  )}
                </div>
              );
            })}
            <button className="session-add" onClick={addSession} title={t("addMachine")} aria-label={t("addMachine")}>
              <Plus />
            </button>
            {configError && <span className="session-error" role="alert">{configError}</span>}
          </div>
        </div>
        <div className="app-shell-actions" ref={setHeaderActionsSlot} />
      </header>
      <div className="session-stack">
        {config.sessions.map((session) => {
          const active = session.id === config.activeSessionId;
          return (
            <div key={session.id} className={`session-host ${active ? "active" : "inactive"}`} aria-hidden={!active}>
              <RobotSessionApp
                key={`${runtimeGeneration}:${session.id}`}
                session={session}
                active={active}
                headerActionsSlot={headerActionsSlot}
                globalTheme={config.theme}
                globalSettings={config.settings}
                effectiveFontScale={effectiveFontScale}
                panelGap={panelGap}
                onSessionChange={updateSession}
                onConnectionStateChange={updateConnectionState}
                onThemeChange={updateTheme}
                onGlobalSettingsChange={updateGlobalSettings}
                onSaveAll={saveAll}
                onSaveAllAsFile={saveAllAsFile}
                onLoadAll={loadAll}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

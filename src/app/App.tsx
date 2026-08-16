import { Fragment, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Moon, Settings, SquareTerminal, Sun } from "lucide-react";
import { Group, Panel, Separator, useGroupRef } from "react-resizable-panels";
import * as THREE from "three";

import { startAgentChannel } from "../agent/uiChannel";
import { WorkerBridge } from "../bridge/WorkerBridge";
import type { ConnectionState, ServiceInfo, TopicInfo } from "../core/FoxgloveConnection";
import type { LayoutConfig, PointCloudSettings } from "../core/layoutConfig";
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_POINT_CLOUD_SETTINGS,
  DEFAULT_WORKSPACE_LAYOUT,
  parseLayout,
  serializeLayout,
} from "../core/layoutConfig";
import { TfBuffer } from "../core/TfBuffer";
import type { TFMessage } from "../core/types";
import { toSec } from "../core/types";
import {
  applyPanelLayout,
  buildPanelLayout,
  layoutPercent,
  setGroupLayout,
  WORKSPACE_PANEL_MIN_SIZE,
} from "../core/workspaceLayout";
import { ImagePanel } from "../panels/ImagePanel";
import { ErrorBoundary } from "./ErrorBoundary";
import { MapEditorPanel } from "../panels/MapEditorPanel";
import { PlotPanel } from "../panels/PlotPanel";
import { PointCloudSettingsPanel } from "../panels/PointCloudSettingsPanel";
import { EchoTopicSection } from "../panels/EchoTopicSection";
import { ServiceSection } from "../panels/ServiceSection";
import { TeleopSection } from "../panels/TeleopSection";
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
import type { PcdWorkerResponse } from "../worker/pcd.worker";
import type { MessagePayload, StreamStats } from "../worker/protocol";
import { CollapsibleSection } from "./CollapsibleSection";
import { I18nProvider, translate } from "./i18n";
import { SettingsPage } from "./SettingsPage";

const DEFAULT_URL = "ws://localhost:8765";
const PCD_KEY = "__pcd__";
const THEME_KEY = "robviz.theme";
const LAYOUT_KEY = "robviz.layout";
const TERMINAL_HEIGHT_KEY = "robviz.terminal.height";
const UrdfEditorPage = lazy(() => import("../panels/UrdfEditorPage"));
const TerminalPanel = lazy(() => import("../panels/TerminalPanel"));

const BUILTIN_DISPLAY_FACTORIES: Record<string, () => Display> = {
  "sensor_msgs/msg/LaserScan": () => new LaserScanRenderer(),
  "sensor_msgs/msg/PointCloud2": () => new PointCloudRenderer(),
  "nav_msgs/msg/OccupancyGrid": () => new GridRenderer(),
  "nav_msgs/msg/Path": () => new PathRenderer(),
  "visualization_msgs/msg/MarkerArray": () => new MarkerRenderer(),
};

const TF_TOPICS = new Set(["/tf", "/tf_static"]);

type PcdTool = "orbit" | "delete" | "keep";
type NavTool = "goal" | "initialpose";

interface PcdInfo {
  name: string;
  count: number;
  rawCount: number;
  undoDepth: number;
  parseMs: number;
}

interface DockPanel {
  id: number;
  kind: string;
  /** 面板自定义状态快照（配置保存/恢复用） */
  state?: unknown;
  sizePercent?: number;
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

function yawQuat(yaw: number): { x: number; y: number; z: number; w: number } {
  return { x: 0, y: 0, z: Math.sin(yaw / 2), w: Math.cos(yaw / 2) };
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

function readStoredLayout(): LayoutConfig | undefined {
  try {
    const saved = localStorage.getItem(LAYOUT_KEY);
    return saved ? parseLayout(saved) : undefined;
  } catch (error) {
    console.warn("[layout] 本地配置损坏，忽略:", error);
    return undefined;
  }
}

export default function App() {
  const initialLayoutRef = useRef<LayoutConfig | undefined>(readStoredLayout());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bridgeRef = useRef<WorkerBridge>(null);
  const tfRef = useRef<TfBuffer>(null);
  const sceneRef = useRef<SceneManager>(null);
  const unsubsRef = useRef(new Map<string, () => void>());
  /** 3D 显示器的订阅（与 TF 订阅分开管理，由 reconcile 效应维护） */
  const displaySubsRef = useRef(new Map<string, () => void>());
  const pcdRendererRef = useRef<EditableCloudRenderer>(null);
  const pcdFileRef = useRef<HTMLInputElement>(null);
  const configFileRef = useRef<HTMLInputElement>(null);
  const selectStartRef = useRef<[number, number]>(null);
  const navStartRef = useRef<[number, number]>(null); // 地面坐标
  const nextPanelId = useRef(1);
  const connectedUrlRef = useRef(DEFAULT_URL);
  const mainGroupRef = useGroupRef();
  const centerGroupRef = useGroupRef();
  const dockGroupRef = useGroupRef();
  const isMobile = useMediaQuery("(max-width: 680px)");

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"3d" | "map" | "urdf" | "settings">("3d");
  const [settingsTab, setSettingsTab] = useState<"general" | "3d" | "plugins">("general");
  const [theme, setTheme] = useState<Theme>(() =>
    initialLayoutRef.current?.theme ?? (localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark"),
  );
  const [settings, setSettings] = useState<LayoutConfig["settings"]>(
    initialLayoutRef.current?.settings ?? { ...DEFAULT_APP_SETTINGS, disabledPluginIds: [] },
  );
  const [workspace, setWorkspace] = useState<LayoutConfig["workspace"]>(
    initialLayoutRef.current?.workspace ?? { ...DEFAULT_WORKSPACE_LAYOUT },
  );
  const [url, setUrl] = useState(DEFAULT_URL);
  const [activeBridgeUrl, setActiveBridgeUrl] = useState(
    initialLayoutRef.current?.url ?? DEFAULT_URL,
  );
  const [connState, setConnState] = useState<ConnectionState>("closed");
  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [frames, setFrames] = useState<string[]>([]);
  const [tfTree, setTfTree] = useState<Map<string, string>>(new Map());
  const [fixedFrame, setFixedFrame] = useState("map");
  const [followFrame, setFollowFrame] = useState<string>();
  const [desired, setDesired] = useState<Map<string, DesiredTopic>>(new Map());
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
  const [pcdVoxel, setPcdVoxel] = useState(0.1);
  const [selectRect, setSelectRect] = useState<{ x: number; y: number; w: number; h: number }>();

  // Nav 工具与面板坞
  const [navTool, setNavTool] = useState<NavTool>();
  const [navPreview, setNavPreview] = useState<{ x: number; y: number; yawDeg: number; len: number }>();
  const [panels, setPanels] = useState<DockPanel[]>([]);
  const [terminalMounted, setTerminalMounted] = useState(false);
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(() => {
    const stored = Number(localStorage.getItem(TERMINAL_HEIGHT_KEY));
    const maximum = Math.max(160, Math.floor(window.innerHeight * 0.6));
    const preferred = Number.isFinite(stored) && stored >= 160 ? stored : 280;
    return Math.min(maximum, preferred);
  });

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

  // 配置应用函数的最新引用（初始化效应在其定义前需要调用）
  const applyConfigRef = useRef<(cfg: LayoutConfig, reconnect: boolean) => void>(null);

  // 初始化：TF 缓冲、Worker 桥、3D 场景、自动连接
  useEffect(() => {
    const tf = new TfBuffer();
    const bridge = new WorkerBridge();
    const scene = new SceneManager(canvasRef.current!, tf);
    tfRef.current = tf;
    bridgeRef.current = bridge;
    sceneRef.current = scene;
    setReady(true);

    scene.onStats = setSceneStats;
    scene.onDisplayError = (topic, message) => setLastError(`${topic} ${message}`);
    // 大负载与渲染帧对齐消费（两帧间只留最新）
    scene.onBeforeRender = () => bridge.flushFrame();
    bridge.onStateChange = setConnState;
    bridge.onError = setLastError;
    bridge.onStats = setStreamStats;
    bridge.onServicesChange = setServices;
    // raw 消息（scan/path 等）即时更新了显示器，标脏触发渲染
    bridge.onImmediateData = () => scene.invalidate();

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
            if (!isStatic && newest > 0) scene.reportTf(newest);
          });
          unsubsRef.current.set(topic, unsub);
        }
      }
    };

    // 启动恢复：首屏初始化时已解析 localStorage，避免语言/主题闪烁
    const initial = initialLayoutRef.current;
    connectedUrlRef.current = initial?.url ?? DEFAULT_URL;
    bridge.connect(connectedUrlRef.current);
    if (initial) applyConfigRef.current?.(initial, false);

    // Agent 截图通道（CLI 的 screenshot 子命令在运行时可取 3D 视图截图）
    const stopAgent = startAgentChannel({ screenshot: () => scene.screenshot() });

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
      stopAgent();
      clearInterval(framesTimer);
      for (const unsub of unsubsRef.current.values()) unsub();
      unsubsRef.current.clear();
      for (const unsub of displaySubsRef.current.values()) unsub();
      displaySubsRef.current.clear();
      scene.dispose();
      bridge.dispose();
    };
  }, []);

  // 主题：同步 CSS 令牌、3D 场景配色与持久化
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = settings.language;
    setSceneTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme, settings.language]);

  const toggleTheme = useCallback(() => {
    // 切换瞬间挂全局颜色过渡（常态不挂，避免干扰其他 transition）
    const root = document.documentElement;
    root.classList.add("theme-anim");
    setTimeout(() => root.classList.remove("theme-anim"), 350);
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

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
    connectedUrlRef.current = url;
    setActiveBridgeUrl(url);
    bridgeRef.current?.connect(url);
  }, [url]);

  const toggleTerminal = useCallback(() => {
    setTerminalMounted(true);
    setTerminalVisible((current) => !current);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.metaKey || event.altKey || event.code !== "Backquote") return;
      event.preventDefault();
      toggleTerminal();
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [toggleTerminal]);

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
    const scene = sceneRef.current!;
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
  }, [ready, desired, topics, displayFactories]);

  // ---- 配置保存/加载（rviz 式布局文件） ----

  const buildConfig = useCallback(
    (): LayoutConfig => ({
      version: 1,
      url,
      fixedFrame,
      theme,
      settings,
      workspace,
      pcdVoxel,
      followFrame,
      activeTopics: [...desired].map(([topic, e]) => ({
        topic,
        schemaName: e.schemaName,
        ...(e.pointCloud ? { pointCloud: e.pointCloud } : {}),
      })),
      panels: panels.map(({ kind, state, sizePercent }) => ({ kind, state, sizePercent })),
      camera: sceneRef.current?.getCameraState(),
    }),
    [url, fixedFrame, theme, settings, workspace, pcdVoxel, followFrame, desired, panels],
  );

  const buildConfigRef = useRef(buildConfig);
  buildConfigRef.current = buildConfig;

  const applyConfig = useCallback((cfg: LayoutConfig, reconnect: boolean) => {
    setUrl(cfg.url);
    if (reconnect && cfg.url !== connectedUrlRef.current) {
      connectedUrlRef.current = cfg.url;
      setActiveBridgeUrl(cfg.url);
      bridgeRef.current?.connect(cfg.url);
    }
    setTheme(cfg.theme);
    setSettings(cfg.settings);
    setWorkspace(cfg.workspace);
    setPcdVoxel(cfg.pcdVoxel);
    setFixedFrame(cfg.fixedFrame);
    setFollowFrame(cfg.followFrame);
    setDesired(
      new Map(
        cfg.activeTopics.map((t) => [
          t.topic,
          {
            schemaName: t.schemaName,
            ...(t.schemaName === "sensor_msgs/msg/PointCloud2"
              ? {
                  pointCloud:
                    t.pointCloud ?? {
                      ...DEFAULT_POINT_CLOUD_SETTINGS,
                      accumulate: t.accumulate ?? false,
                    },
                }
              : {}),
          },
        ]),
      ),
    );
    setPanels(cfg.panels.map((p) => ({
      id: nextPanelId.current++,
      kind: p.kind,
      state: p.state,
      sizePercent: p.sizePercent,
    })));
    if (cfg.camera) sceneRef.current?.setCameraState(cfg.camera);
  }, []);
  applyConfigRef.current = applyConfig;

  const saveConfig = useCallback(() => {
    downloadBlob(
      new Blob([serializeLayout(buildConfig())], { type: "application/json" }),
      "robviz.json",
    );
  }, [buildConfig]);

  const openConfigFile = useCallback(
    async (file: File) => {
      try {
        applyConfig(parseLayout(await file.text()), true);
        setLastError(undefined);
      } catch (err) {
        setLastError(err instanceof Error ? err.message : String(err));
      }
    },
    [applyConfig],
  );

  // 自动保存到 localStorage（debounce 1s，下次打开自动恢复）
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(LAYOUT_KEY, serializeLayout(buildConfig()));
      } catch {
        /* 存储不可用时忽略 */
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [ready, buildConfig]);

  // 关页前兜底保存（捕获最后的相机位姿）
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(LAYOUT_KEY, serializeLayout(buildConfigRef.current()));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("beforeunload", save);
    return () => window.removeEventListener("beforeunload", save);
  }, []);

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

  const onNavUp = useCallback(
    (e: React.PointerEvent) => {
      const start = navStartRef.current;
      navStartRef.current = null;
      setNavPreview(undefined);
      const tool = navTool;
      setNavTool(undefined);
      if (!start || !tool) return;
      const end = groundPoint(e) ?? start;
      const yaw = Math.atan2(end[1] - start[1], end[0] - start[0]);
      const bridge = bridgeRef.current!;
      const now = Date.now() / 1000;
      const header = {
        stamp: { sec: Math.floor(now), nanosec: Math.round((now % 1) * 1e9) },
        frame_id: fixedFrame,
      };
      const pose = {
        position: { x: start[0], y: start[1], z: 0 },
        orientation: yawQuat(yaw),
      };
      if (tool === "goal") {
        bridge.publish("/goal_pose", "geometry_msgs/msg/PoseStamped", { header, pose });
      } else {
        const covariance = new Array<number>(36).fill(0);
        covariance[0] = 0.25;
        covariance[7] = 0.25;
        covariance[35] = 0.068;
        bridge.publish("/initialpose", "geometry_msgs/msg/PoseWithCovarianceStamped", {
          header,
          pose: { pose, covariance },
        });
      }
    },
    [navTool, fixedFrame, groundPoint],
  );

  // ---- 面板坞 ----

  const addPanel = useCallback((kind: string) => {
    setPanels((prev) => [...prev, { id: nextPanelId.current++, kind }]);
  }, []);

  const removePanel = useCallback((id: number) => {
    setPanels((prev) => prev.filter((p) => p.id !== id));
  }, []);

  /** 面板内部状态快照上报（进配置文件） */
  const updatePanelState = useCallback((id: number, state: unknown) => {
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, state } : p)));
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
    setPanels((current) => current.map((panel) => ({ ...panel, sizePercent: undefined })));
  }, []);

  const dataTopics = topics
    .filter((t) => !TF_TOPICS.has(t.topic))
    .sort((a, b) => a.topic.localeCompare(b.topic));

  const allPluginPanelKinds = useMemo(
    () => new Set(plugins.flatMap((plugin) => (plugin.panels ?? []).map((panel) => `${plugin.id}:${panel.kind}`))),
    [],
  );
  const activePluginPanelKinds = useMemo(
    () => new Set(resolvedPlugins.panels.map((panel) => panel.kind)),
    [resolvedPlugins.panels],
  );
  const visiblePanels = panels.filter((panel) =>
    panel.kind === "image" || panel.kind === "plot" || !allPluginPanelKinds.has(panel.kind) || activePluginPanelKinds.has(panel.kind),
  );
  const dockDefaultLayout = useMemo(() => buildPanelLayout(visiblePanels), [visiblePanels]);

  const updateDockLayout = useCallback((layout: Record<string, number>) => {
    setPanels((current) => applyPanelLayout(current, layout));
  }, []);

  useEffect(() => {
    setGroupLayout(mainGroupRef.current, {
      center: 100 - workspace.sidebarPercent,
      sidebar: workspace.sidebarPercent,
    });
    if (visiblePanels.length > 0) {
      setGroupLayout(centerGroupRef.current, {
        viewport: 100 - workspace.dockPercent,
        dock: workspace.dockPercent,
      });
      setGroupLayout(dockGroupRef.current, dockDefaultLayout);
    }
  }, [workspace, visiblePanels.length, dockDefaultLayout, mainGroupRef, centerGroupRef, dockGroupRef]);

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
    };
  }, [ready, topics, fixedFrame, theme, settings.language]);

  return (
    <I18nProvider locale={settings.language}>
    <div className="app">
      <header className="topbar">
        <span className="brand">RobViz</span>
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
        </nav>
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
        <span className="spacer" />
        <button onClick={saveConfig} title={t("saveConfigHint")}>
          {t("saveConfig")}
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
        {mode === "3d" && (
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
          onClick={() => setMode("settings")}
          title={t("settings")}
          aria-label={t("settings")}
        >
          <Settings />
        </button>
      </header>

      <main className={`main mode-${mode}`}>
        <div className="workspace-3d" style={mode !== "3d" ? { display: "none" } : undefined}>
          <Group
            id="main-workspace"
            groupRef={mainGroupRef}
            className="main-resizable-group"
            orientation={isMobile ? "vertical" : "horizontal"}
            disabled={isMobile}
            defaultLayout={{ center: 100 - workspace.sidebarPercent, sidebar: workspace.sidebarPercent }}
            resizeTargetMinimumSize={{ fine: 6, coarse: 20 }}
            onLayoutChanged={(layout, meta) => {
              if (meta.isUserInteraction) setWorkspace((current) => ({
                ...current,
                sidebarPercent: layoutPercent(layout, "sidebar"),
              }));
            }}
          >
          <Panel id="center" minSize={isMobile ? 0 : WORKSPACE_PANEL_MIN_SIZE.mainCenter}>
          <div className="center">
          <Group
            id="center-workspace"
            groupRef={centerGroupRef}
            className="center-resizable-group"
            orientation="vertical"
            disabled={isMobile || visiblePanels.length === 0}
            defaultLayout={{ viewport: 100 - workspace.dockPercent, dock: workspace.dockPercent }}
            resizeTargetMinimumSize={{ fine: 6, coarse: 20 }}
            onLayoutChanged={(layout, meta) => {
              if (meta.isUserInteraction && "dock" in layout) setWorkspace((current) => ({
                ...current,
                dockPercent: layoutPercent(layout, "dock"),
              }));
            }}
          >
          <Panel id="viewport" minSize={isMobile ? 0 : WORKSPACE_PANEL_MIN_SIZE.viewport}>
          <div className="viewport" onDoubleClick={onViewportDoubleClick}>
            <canvas ref={canvasRef} />
            {/* Nav 工具条 */}
            <div className="nav-toolbar">
              <button
                className={navTool === "goal" ? "active" : ""}
                onClick={() => setNavTool(navTool === "goal" ? undefined : "goal")}
              >
                {t("navigationGoal")}
              </button>
              <button
                className={navTool === "initialpose" ? "active" : ""}
                onClick={() => setNavTool(navTool === "initialpose" ? undefined : "initialpose")}
              >
                {t("initialPose")}
              </button>
              <button onClick={() => sceneRef.current?.resetView()} title={t("resetViewHint")}>
                {t("resetView")}
              </button>
              <label className={`field follow-field ${followFrame ? "following" : ""}`}>
                {t("follow")}
                <select
                  value={followFrame ?? ""}
                  onChange={(e) => setFollowFrame(e.target.value || undefined)}
                >
                  <option value="">{t("off")}</option>
                  {frames.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
              {navTool && <span className="nav-hint">{t("navHint")}</span>}
            </div>
            {(pcd || pcdBusy) && (
              <div className="pcd-toolbar">
                {pcdBusy ? (
                  <span className="pcd-status">{pcdBusy}</span>
                ) : (
                  pcd && (
                    <>
                      <span className="pcd-status">
                        {pcd.name} · {t("pointsMillions", { count: (pcd.count / 1e6).toFixed(2) })}
                        {pcd.rawCount !== pcd.count &&
                          t("originalPoints", { count: (pcd.rawCount / 1e6).toFixed(2) })}
                      </span>
                      <button
                        className={pcdTool === "orbit" ? "active" : ""}
                        onClick={() => setPcdTool("orbit")}
                      >
                        {t("browsing")}
                      </button>
                      <button
                        className={pcdTool === "delete" ? "active" : ""}
                        onClick={() => setPcdTool("delete")}
                      >
                        {t("boxDelete")}
                      </button>
                      <button
                        className={pcdTool === "keep" ? "active" : ""}
                        onClick={() => setPcdTool("keep")}
                      >
                        {t("boxKeep")}
                      </button>
                      <button onClick={pcdUndo} disabled={pcd.undoDepth === 0}>
                        {t("undoCount", { count: pcd.undoDepth })}
                      </button>
                      <button onClick={pcdExport}>{t("export")}</button>
                      <button onClick={closePcd}>{t("close")}</button>
                    </>
                  )
                )}
              </div>
            )}
            {pcd && pcdTool !== "orbit" && !navTool && (
              <div
                className="select-overlay"
                onPointerDown={onSelectDown}
                onPointerMove={onSelectMove}
                onPointerUp={onSelectUp}
              >
                {selectRect && (
                  <div
                    className="select-rect"
                    style={{
                      left: selectRect.x,
                      top: selectRect.y,
                      width: selectRect.w,
                      height: selectRect.h,
                    }}
                  />
                )}
              </div>
            )}
            {navTool && (
              <div
                className="select-overlay nav-overlay"
                onPointerDown={onNavDown}
                onPointerMove={onNavMove}
                onPointerUp={onNavUp}
              >
                {navPreview && navPreview.len > 4 && (
                  <div
                    className="nav-arrow"
                    style={{
                      left: navPreview.x,
                      top: navPreview.y,
                      width: navPreview.len,
                      transform: `rotate(${navPreview.yawDeg}deg)`,
                    }}
                  />
                )}
              </div>
            )}
            <div className="hud">
              {sceneStats.brokenFrames.length > 0 && (
                <div className="warn">{t("tfBroken", { frames: sceneStats.brokenFrames.join(", ") })}</div>
              )}
              {streamStats && streamStats.lagMs > 200 && (
                <div className="warn">{t("networkLag", { ms: streamStats.lagMs })}</div>
              )}
              {streamStats && streamStats.totalHz > 0 && (
                <div>
                  {(streamStats.totalKbps / 1024).toFixed(1)} MB/s ·{" "}
                  {Math.round(streamStats.totalHz)} msg/s
                  {streamStats.totalDropsPerSec > 0 &&
                    ` · ${t("dropped", { count: Math.round(streamStats.totalDropsPerSec) })}`}
                  {` · ${t("lagStat", { ms: streamStats.lagMs })}`}
                </div>
              )}
              <div>
                render {sceneStats.renderHz}/s · {t("tfSmoothing", { ms: sceneStats.tfDelayMs })}
              </div>
            </div>
          </div>
          </Panel>

          {/* 面板坞：图像 / 曲线 */}
          {visiblePanels.length > 0 && ready && (
            <>
            <Separator className="resize-handle horizontal" />
            <Panel id="dock" minSize={isMobile ? 0 : WORKSPACE_PANEL_MIN_SIZE.dock} maxSize="70%">
            <div className="dock-scroll">
            <Group
              id="dock-workspace"
              groupRef={dockGroupRef}
              className="dock"
              defaultLayout={dockDefaultLayout}
              resizeTargetMinimumSize={{ fine: 6, coarse: 20 }}
              disabled={isMobile}
              onLayoutChanged={(layout, meta) => meta.isUserInteraction && updateDockLayout(layout)}
              style={{ minWidth: `${Math.max(1, visiblePanels.length) * 220}px` }}
            >
              {visiblePanels.map((p, index) => {
                const pluginPanel = resolvedPlugins.panels.find((pp) => pp.kind === p.kind);
                const name =
                  p.kind === "image"
                    ? t("imagePanel")
                    : p.kind === "plot"
                      ? t("plotPanel")
                      : (pluginPanel?.title ?? p.kind);
                return (
                  <Fragment key={p.id}>
                  {index > 0 && <Separator className="resize-handle vertical" />}
                  <Panel id={`dock-${p.id}`} minSize={WORKSPACE_PANEL_MIN_SIZE.dockPanel} defaultSize={`${p.sizePercent ?? 100 / visiblePanels.length}%`}>
                  <ErrorBoundary name={name} onReset={() => removePanel(p.id)}>
                    {p.kind === "image" ? (
                      <ImagePanel
                        bridge={bridgeRef.current!}
                        topics={topics}
                        initialTopic={(p.state as { topic?: string } | undefined)?.topic}
                        onTopicChange={(t) => updatePanelState(p.id, { topic: t })}
                        onClose={() => removePanel(p.id)}
                      />
                    ) : p.kind === "plot" ? (
                      <PlotPanel
                        bridge={bridgeRef.current!}
                        topics={topics}
                        theme={theme}
                        initialSeries={
                          (
                            p.state as
                              | { series?: Array<{ topic: string; field: string }> }
                              | undefined
                          )?.series
                        }
                        onSeriesChange={(series) => updatePanelState(p.id, { series })}
                        onClose={() => removePanel(p.id)}
                      />
                    ) : pluginPanel && pluginCtx ? (
                      <pluginPanel.component
                        ctx={pluginCtx}
                        state={p.state}
                        onStateChange={(s) => updatePanelState(p.id, s)}
                        onClose={() => removePanel(p.id)}
                      />
                    ) : (
                      <div className="panel">
                        <div className="panel-header">
                          <span className="panel-meta">{t("unknownPanel", { kind: p.kind })}</span>
                          <span className="spacer" />
                          <button className="panel-close" onClick={() => removePanel(p.id)}>
                            ×
                          </button>
                        </div>
                      </div>
                    )}
                  </ErrorBoundary>
                  </Panel>
                  </Fragment>
                );
              })}
            </Group>
            </div>
            </Panel>
            </>
          )}
          </Group>
        </div>
        </Panel>

          <Separator className="resize-handle vertical" />
          <Panel id="sidebar" minSize={isMobile ? 0 : WORKSPACE_PANEL_MIN_SIZE.sidebar} maxSize="50%">
          <aside className="sidebar">
            <CollapsibleSection title={t("topics")}>
              {dataTopics.length === 0 && (
                <p className="empty-hint">{t("noTopics")}</p>
              )}
              {dataTopics.map(({ topic, schemaName }) => {
                const displayable = schemaName in displayFactories;
                const isActive = desired.has(topic);
                const shortSchema = schemaName.split("/").pop();
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
                      <span className="schema">
                        {topicStat ? `${topicStat.hz.toFixed(0)} Hz` : shortSchema}
                      </span>
                    </button>
                    {isActive && schemaName === "sensor_msgs/msg/PointCloud2" && (() => {
                      const renderer = sceneRef.current?.getDisplay(topic);
                      const pointCloudRenderer = renderer instanceof PointCloudRenderer ? renderer : undefined;
                      return (
                        <PointCloudSettingsPanel
                          settings={desired.get(topic)?.pointCloud ?? DEFAULT_POINT_CLOUD_SETTINGS}
                          colorField={pointCloudRenderer?.colorField}
                          autoRange={pointCloudRenderer?.autoRange ?? [0, 1]}
                          onChange={(settings) => updatePointCloudSettings(topic, settings)}
                          onClear={() => {
                            pointCloudRenderer?.clear();
                            sceneRef.current?.invalidate();
                          }}
                        />
                      );
                    })()}
                  </div>
                );
              })}
              {lastError && <p className="error-line">{lastError}</p>}
            </CollapsibleSection>

            {ready && (
              <ErrorBoundary name={t("echoTopic")}>
                <EchoTopicSection bridge={bridgeRef.current!} topics={topics} />
              </ErrorBoundary>
            )}

            <CollapsibleSection title={t("panelsSection")}>
              <div className="side-row">
                <button onClick={() => addPanel("image")}>{t("addImage")}</button>
                <button onClick={() => addPanel("plot")}>{t("addPlot")}</button>
                {resolvedPlugins.panels.map((pp) => (
                  <button key={pp.kind} onClick={() => addPanel(pp.kind)}>
                    {t("addPluginPanel", { title: pp.title })}
                  </button>
                ))}
              </div>
            </CollapsibleSection>

            {ready && (
              <ErrorBoundary name={t("teleop")}>
                <TeleopSection bridge={bridgeRef.current!} />
              </ErrorBoundary>
            )}
            {ready && (
              <ErrorBoundary name={t("services")}>
                <ServiceSection bridge={bridgeRef.current!} services={services} />
              </ErrorBoundary>
            )}
            <ErrorBoundary name={t("tfTree")}>
              <TfTreeSection
                tree={tfTree}
                followFrame={followFrame}
                onFollow={(f) => setFollowFrame((prev) => (prev === f ? undefined : f))}
              />
            </ErrorBoundary>
            {/* 插件侧栏区块（各自隔离，崩溃不影响主体） */}
            {pluginCtx &&
              resolvedPlugins.sections.map((s) => (
                <ErrorBoundary key={s.id} name={s.title}>
                  <CollapsibleSection title={s.title}>
                    <s.component ctx={pluginCtx} />
                  </CollapsibleSection>
                </ErrorBoundary>
              ))}
          </aside>
          </Panel>
          </Group>
        </div>

        {mode === "map" && ready && (
          <ErrorBoundary name={t("mapEditor")}>
            <MapEditorPanel bridge={bridgeRef.current!} theme={theme} />
          </ErrorBoundary>
        )}
        {mode === "urdf" && ready && (
          <ErrorBoundary name={t("urdfEditor")}>
            <Suspense fallback={<div className="page-loading">{t("loadingUrdf")}</div>}>
              <UrdfEditorPage bridge={bridgeRef.current!} theme={theme} inspectorPercent={workspace.urdfInspectorPercent} isMobile={isMobile} onInspectorPercentChange={(urdfInspectorPercent: number) => setWorkspace((current) => ({ ...current, urdfInspectorPercent }))} />
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
            onThemeChange={setTheme}
            onPluginToggle={togglePlugin}
            onResetLayout={resetWorkspaceLayout}
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

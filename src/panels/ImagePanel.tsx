/** WebRTC image preview. Overlays are already part of the encoded video. */
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button, Select, Toolbar } from "@robviz/core";

import type { WorkerBridge } from "../bridge/WorkerBridge";
import type { TopicInfo } from "../core/FoxgloveConnection";
import { webRtcManager, type WebRtcStreamStats } from "../media/WebRtcStreamClient";
import { CollapsiblePanel } from "../app/CollapsiblePanel";
import { useI18n } from "../app/i18n";

export function ImagePanel({
  embedded = false,
  active = true,
  bridge,
  initialTopic,
  fixedTopic,
  mediaUrl: configuredMediaUrl,
  onTopicChange,
  onClose,
}: {
  embedded?: boolean;
  active?: boolean;
  bridge: WorkerBridge;
  topics: TopicInfo[];
  /** 配置恢复：初始选中的话题 */
  initialTopic?: string;
  /** 固定预览话题；设置后不显示可切换话题选择器。 */
  fixedTopic?: string;
  /** Legacy workspace field. Preview uses the gateway's raw source name. */
  initialPreferRaw?: boolean;
  /** Legacy workspace field. Preview now always uses WebRTC. */
  initialUseWebRtc?: boolean;
  mediaUrl?: string;
  /** 配置保存：话题或传输选择变化时上报 */
  onTopicChange?: (topic: string, preferRaw: boolean, useWebRtc: boolean) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const panelId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [topic, setTopic] = useState(fixedTopic ?? initialTopic?.replace(/\/compressed$/, "") ?? "");
  const [imageTopics, setImageTopics] = useState<TopicInfo[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [targetFps, setTargetFps] = useState(10);
  const targetFpsRef = useRef(targetFps);
  targetFpsRef.current = targetFps;
  const [webrtcStats, setWebRtcStats] = useState<WebRtcStreamStats | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [topic]);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(10, z * 1.25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.5, z * 0.8));
  }, []);

  const handleResetFit = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const lastGestureTimeRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (performance.now() - lastGestureTimeRef.current < 120 && e.ctrlKey) {
        return;
      }

      if (e.ctrlKey) {
        // Mac 捏合缩放
        const factor = Math.exp(-e.deltaY * 0.01);
        setZoom((z) => Math.max(0.5, Math.min(10, z * factor)));
      } else if (e.deltaMode === 0) {
        // 两指平移
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      } else {
        // 传统滚轮
        const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
        setZoom((z) => Math.max(0.5, Math.min(10, z * factor)));
      }
    };

    let gestureStartScale = 1;
    const handleGestureStart = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      lastGestureTimeRef.current = performance.now();
      gestureStartScale = 1;
    };
    const handleGestureChange = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      lastGestureTimeRef.current = performance.now();
      const ge = e as unknown as { scale?: number };
      const scale = ge.scale ?? 1;
      const factor = scale / gestureStartScale;
      gestureStartScale = scale;
      if (Math.abs(factor - 1) > 0.001) {
        setZoom((z) => Math.max(0.5, Math.min(10, z * factor)));
      }
    };
    const handleGestureEnd = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      lastGestureTimeRef.current = performance.now();
    };

    el.addEventListener("wheel", handleNativeWheel, { passive: false });
    el.addEventListener("gesturestart", handleGestureStart, { passive: false });
    el.addEventListener("gesturechange", handleGestureChange, { passive: false });
    el.addEventListener("gestureend", handleGestureEnd, { passive: false });

    return () => {
      el.removeEventListener("wheel", handleNativeWheel);
      el.removeEventListener("gesturestart", handleGestureStart);
      el.removeEventListener("gesturechange", handleGestureChange);
      el.removeEventListener("gestureend", handleGestureEnd);
    };
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [pan.x, pan.y]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  const sourceAvailable = imageTopics.some((item) => item.topic === topic);
  const mediaUrl = webRtcManager.deriveMediaUrl(
    bridge?.url || "ws://localhost:8765",
    configuredMediaUrl,
  );

  useEffect(() => {
    onTopicChange?.(topic, true, true);
    // onTopicChange 是 App 侧的快照记录回调，身份变化不需重跑
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  useEffect(() => {
    setImageTopics([]);
    if (!active || collapsed) return;
    return webRtcManager.discover(mediaUrl, setImageTopics);
  }, [active, collapsed, mediaUrl]);

  useEffect(() => {
    if (fixedTopic && fixedTopic !== topic) setTopic(fixedTopic);
    else if (!topic && imageTopics.length === 1) setTopic(imageTopics[0].topic);
  }, [fixedTopic, imageTopics, topic]);

  const shouldWatchGateway = Boolean(
    active && !collapsed && topic,
  );

  useEffect(() => {
    if (!shouldWatchGateway) return;
    const videoEl = videoRef.current;
    const unsub = webRtcManager.watch(
      topic,
      mediaUrl,
      panelId,
      targetFpsRef.current,
      (stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      },
      (stats) => {
        setWebRtcStats(stats);
      },
    );
    return () => {
      unsub();
      setWebRtcStats(null);
      streamRef.current = null;
      if (videoEl) {
        videoEl.srcObject = null;
      }
    };
  }, [mediaUrl, panelId, shouldWatchGateway, topic]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = streamRef.current;
  }, [sourceAvailable]);

  useEffect(() => {
    if (shouldWatchGateway) {
      webRtcManager.setFps(topic, mediaUrl, panelId, targetFps);
    }
  }, [mediaUrl, panelId, shouldWatchGateway, targetFps, topic]);

  const displayMeta = webrtcStats
    ? (webrtcStats.status === "streaming" || webrtcStats.status === "congested"
        ? `H.264 ${webrtcStats.width}×${webrtcStats.height} · ${webrtcStats.actualFps} FPS (${targetFps}) · ${webrtcStats.bitrateKbps} kbps · loss ${(webrtcStats.packetLoss * 100).toFixed(1)}% · RTT ${(webrtcStats.rtt * 1000).toFixed(0)} ms`
        : webrtcStats.status === "connecting"
        ? "WebRTC 连接中..."
        : webrtcStats.status === "error"
        ? webrtcStats.statusText || t("webrtcUnavailable")
        : "")
    : "";

  const header = (
    <>
        {fixedTopic ? (
          <span className="panel-meta" title={fixedTopic}>{fixedTopic}</span>
        ) : (
          <Select
            aria-label={t("chooseImageTopic")}
            value={sourceAvailable ? topic : ""}
            onChange={(e) => {
              setTopic(e.target.value);
            }}
          >
            <option value="" disabled>
              {topic && !sourceAvailable ? `${topic} · ${t("webrtcUnavailable")}` : t("chooseImageTopic")}
            </option>
            {imageTopics.map((t) => (
              <option key={t.topic} value={t.topic}>
                {t.topic}
              </option>
            ))}
          </Select>
        )}
        {topic && (
          <>
            <Select
              value={targetFps}
              title={t("targetFps")}
              onChange={(e) => {
                const fps = Number(e.target.value);
                setTargetFps(fps);
                if (active && !collapsed) {
                  webRtcManager.setFps(topic, mediaUrl, panelId, fps);
                }
              }}
              style={{ maxWidth: 80, marginLeft: 4 }}
            >
              <option value={5}>5 FPS</option>
              <option value={10}>10 FPS</option>
              <option value={15}>15 FPS</option>
              <option value={20}>20 FPS</option>
              <option value={30}>30 FPS</option>
            </Select>
          </>
        )}
        {topic && (
          <span className="panel-meta">
            WebRTC
          </span>
        )}
        {webrtcStats?.status === "error" && (
          <Button
            type="button"
            variant="danger"
            title="重新连接 WebRTC 流"
            onClick={() => webRtcManager.reconnect(topic, mediaUrl)}
          >
            重连
          </Button>
        )}
        <div className="panel-actions" style={{ display: "inline-flex", gap: 3, marginLeft: 4 }}>
          <Button
            type="button"
            className="panel-btn icon-action"
            title="放大"
            aria-label="放大"
            onClick={handleZoomIn}
          >
            <ZoomIn />
          </Button>
          <Button
            type="button"
            className="panel-btn icon-action"
            title="缩小"
            aria-label="缩小"
            onClick={handleZoomOut}
          >
            <ZoomOut />
          </Button>
          <Button
            type="button"
            className="panel-btn icon-action"
            title="自适应"
            aria-label="自适应"
            onClick={handleResetFit}
          >
            <Maximize2 />
          </Button>
        </div>
        <span className="panel-meta">{displayMeta}</span>
    </>
  );
  const content = (
      <div
        className="panel-body image-body"
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          overflow: "hidden",
          position: "relative",
          touchAction: "none",
        }}
      >
        <div
          className="image-transform-layer"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: isDraggingRef.current ? "grabbing" : "grab",
          }}
        >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
                background: "#000",
                pointerEvents: "none",
              }}
            />
        </div>
        {topic && (!sourceAvailable || webrtcStats?.status === "error") && (
          <div role="status" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "var(--canvas)", color: "var(--text-muted)", pointerEvents: "none" }}>
            {webrtcStats?.statusText || "等待视频画面..."}
          </div>
        )}
      </div>
  );

  if (embedded) {
    return (
      <div className="panel dock-panel-content">
        <Toolbar className="panel-header">{header}</Toolbar>
        <div className="panel-content">{content}</div>
      </div>
    );
  }

  return (
    <CollapsiblePanel
      title={t("imagePanel")}
      onClose={onClose}
      onCollapsedChange={setCollapsed}
      header={header}
    >
      {content}
    </CollapsiblePanel>
  );
}

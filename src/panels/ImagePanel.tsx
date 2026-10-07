/**
 * 图像面板：CompressedImage（jpeg/png → createImageBitmap）与
 * raw Image（rgb8/bgr8/mono8/mono16/16UC1/32FC1，深度图 turbo 上色）。
 * 悬停显示像素坐标 + 值（深度显示米数），视觉调参用。
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";

import type { WorkerBridge } from "../bridge/WorkerBridge";
import type { TopicInfo } from "../core/FoxgloveConnection";
import { requiresRawImage } from "../core/image";
import { preferredImageTopic, sortedImageTopics } from "../core/imageTopics";
import { webRtcManager, type WebRtcStreamStats } from "../media/WebRtcStreamClient";
import { turbo } from "../renderers/colormap";
import type { MessagePayload } from "../worker/protocol";
import { CollapsiblePanel } from "../app/CollapsiblePanel";
import { useI18n } from "../app/i18n";

const IMAGE_MAX_FREQUENCY = 10;

interface HoverInfo {
  x: number;
  y: number;
  text: string;
}

interface RawFrame {
  width: number;
  height: number;
  encoding: string;
  /** Worker 归一化后的紧凑小端像素（拷贝，供悬停取值） */
  data: Uint8Array;
}

/** raw 编码 → RGBA。深度类编码返回 [rgba, min, max] 供 HUD */
function rawToRgba(frame: RawFrame): { rgba: Uint8ClampedArray; range?: [number, number] } {
  const { width, height, encoding, data } = frame;
  const n = width * height;
  const rgba = new Uint8ClampedArray(n * 4);

  if (encoding === "rgb8" || encoding === "bgr8") {
    const rOff = encoding === "rgb8" ? 0 : 2;
    for (let i = 0; i < n; i++) {
      rgba[i * 4] = data[i * 3 + rOff];
      rgba[i * 4 + 1] = data[i * 3 + 1];
      rgba[i * 4 + 2] = data[i * 3 + 2 - rOff];
      rgba[i * 4 + 3] = 255;
    }
    return { rgba };
  }
  if (encoding === "rgba8" || encoding === "bgra8") {
    const rOff = encoding === "rgba8" ? 0 : 2;
    for (let i = 0; i < n; i++) {
      rgba[i * 4] = data[i * 4 + rOff];
      rgba[i * 4 + 1] = data[i * 4 + 1];
      rgba[i * 4 + 2] = data[i * 4 + 2 - rOff];
      rgba[i * 4 + 3] = 255;
    }
    return { rgba };
  }
  if (encoding === "mono8" || encoding === "8UC1") {
    for (let i = 0; i < n; i++) {
      const v = data[i];
      rgba[i * 4] = v;
      rgba[i * 4 + 1] = v;
      rgba[i * 4 + 2] = v;
      rgba[i * 4 + 3] = 255;
    }
    return { rgba };
  }

  // 深度类：16UC1（毫米）/ mono16 / 32FC1（米）→ turbo
  let values: Float32Array | Uint16Array;
  if (encoding === "32FC1") {
    values = new Float32Array(data.buffer.slice(data.byteOffset, data.byteOffset + n * 4));
  } else if (encoding === "16UC1" || encoding === "mono16") {
    values = new Uint16Array(data.buffer.slice(data.byteOffset, data.byteOffset + n * 2));
  } else {
    // 未知编码：显示为灰噪
    for (let i = 0; i < n; i++) rgba[i * 4 + 3] = 255;
    return { rgba };
  }
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < n; i += 7) {
    const v = values[i];
    if (!Number.isFinite(v) || v <= 0) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!(min < max)) {
    min = 0;
    max = 1;
  }
  const inv = 1 / (max - min);
  for (let i = 0; i < n; i++) {
    const v = values[i];
    if (!Number.isFinite(v) || v <= 0) {
      rgba[i * 4 + 3] = 255;
      continue;
    }
    const [r, g, b] = turbo((v - min) * inv);
    rgba[i * 4] = r * 255;
    rgba[i * 4 + 1] = g * 255;
    rgba[i * 4 + 2] = b * 255;
    rgba[i * 4 + 3] = 255;
  }
  return { rgba, range: [min, max] };
}

function pixelText(frame: RawFrame, px: number, py: number): string {
  const { width, encoding, data } = frame;
  const i = py * width + px;
  if (encoding === "32FC1") {
    const v = new DataView(data.buffer, data.byteOffset).getFloat32(i * 4, true);
    return `${v.toFixed(3)} m`;
  }
  if (encoding === "16UC1" || encoding === "mono16") {
    const v = new DataView(data.buffer, data.byteOffset).getUint16(i * 2, true);
    return `${v} (${(v / 1000).toFixed(3)} m)`;
  }
  if (encoding === "rgb8" || encoding === "bgr8") {
    const rOff = encoding === "rgb8" ? 0 : 2;
    return `RGB(${data[i * 3 + rOff]}, ${data[i * 3 + 1]}, ${data[i * 3 + 2 - rOff]})`;
  }
  if (encoding === "mono8" || encoding === "8UC1") return `${data[i]}`;
  return "";
}

export function ImagePanel({
  embedded = false,
  active = true,
  bridge,
  topics,
  initialTopic,
  fixedTopic,
  initialPreferRaw = false,
  initialUseWebRtc = true,
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
  /** 配置恢复：保留 Raw 话题，不等于选择 Raw 传输 */
  initialPreferRaw?: boolean;
  /** 配置恢复：选择 WebRTC 或 Raw 渲染/传输 */
  initialUseWebRtc?: boolean;
  mediaUrl?: string;
  /** 配置保存：话题或传输选择变化时上报 */
  onTopicChange?: (topic: string, preferRaw: boolean, useWebRtc: boolean) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const panelId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<RawFrame>(null);
  const preferRawRef = useRef(initialPreferRaw);
  const [topic, setTopic] = useState(fixedTopic ?? initialTopic ?? "");
  const [collapsed, setCollapsed] = useState(false);
  const [hover, setHover] = useState<HoverInfo>();
  const [meta, setMeta] = useState<string>("");
  const [targetFps, setTargetFps] = useState(10);
  const targetFpsRef = useRef(targetFps);
  targetFpsRef.current = targetFps;
  const [useWebRtc, setUseWebRtc] = useState(initialUseWebRtc);
  const [webrtcStats, setWebRtcStats] = useState<WebRtcStreamStats | null>(null);

  const isImageTopic = topics.some(
    (cand) => cand.topic === topic && cand.schemaName === "sensor_msgs/msg/Image",
  );
  const activeWebRtc = useWebRtc && isImageTopic;
  const mediaUrl = webRtcManager.deriveMediaUrl(
    bridge.url || "ws://localhost:8765",
    configuredMediaUrl,
  );

  useEffect(() => {
    onTopicChange?.(topic, preferRawRef.current, useWebRtc);
    // onTopicChange 是 App 侧的快照记录回调，身份变化不需重跑
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, useWebRtc]);

  const imageTopics = sortedImageTopics(topics);

  useEffect(() => {
    const preferred = fixedTopic ?? preferredImageTopic(
      topics,
      topic,
      initialTopic,
      preferRawRef.current,
    );
    if (preferred !== topic) setTopic(preferred);
  }, [fixedTopic, initialTopic, topic, topics]);

  useEffect(() => {
    if (!active || !activeWebRtc || !topic || collapsed) return;
    const videoEl = videoRef.current;
    const unsub = webRtcManager.watch(
      topic,
      mediaUrl,
      panelId,
      targetFpsRef.current,
      (stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      },
      (stats) => {
        setWebRtcStats(stats);
        if (stats.sourceEncoding && requiresRawImage(stats.sourceEncoding)) {
          setUseWebRtc(false);
        }
      },
    );
    return () => {
      unsub();
      setWebRtcStats(null);
      if (videoEl) {
        videoEl.srcObject = null;
      }
    };
  }, [active, activeWebRtc, collapsed, mediaUrl, panelId, topic]);

  useEffect(() => {
    if (active && activeWebRtc && topic && !collapsed) {
      webRtcManager.setFps(topic, mediaUrl, panelId, targetFps);
    }
  }, [active, activeWebRtc, collapsed, mediaUrl, panelId, targetFps, topic]);

  useEffect(() => {
    if (!active || activeWebRtc || !topic || collapsed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const unsub = bridge.subscribe(topic, (payload: MessagePayload) => {
      if (payload.kind === "compressed_image") {
        frameRef.current = null; // 压缩图不支持逐像素取值
        void createImageBitmap(new Blob([payload.data as unknown as BlobPart])).then((bmp) => {
          canvas.width = bmp.width;
          canvas.height = bmp.height;
          ctx.drawImage(bmp, 0, 0);
          bmp.close();
          setMeta(`${payload.format} ${canvas.width}×${canvas.height}`);
        });
      } else if (payload.kind === "image") {
        const frame: RawFrame = {
          width: payload.width,
          height: payload.height,
          encoding: payload.encoding,
          data: new Uint8Array(payload.data), // 拷贝（缓冲即将回收）
        };
        frameRef.current = frame;
        const { rgba, range } = rawToRgba(frame);
        canvas.width = frame.width;
        canvas.height = frame.height;
        ctx.putImageData(
          new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, frame.width, frame.height),
          0,
          0,
        );
        setMeta(
          `${frame.encoding} ${frame.width}×${frame.height}` +
            (range ? ` · ${range[0].toFixed(2)}~${range[1].toFixed(2)}` : ""),
        );
      }
    }, { maxFrequency: IMAGE_MAX_FREQUENCY });
    return () => {
      unsub();
      frameRef.current = null;
    };
  }, [active, activeWebRtc, bridge, collapsed, topic]);

  const onMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const frame = frameRef.current;
    const canvas = canvasRef.current!;
    if (!frame) {
      setHover(undefined);
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const px = Math.floor(((e.clientX - rect.left) / rect.width) * frame.width);
    const py = Math.floor(((e.clientY - rect.top) / rect.height) * frame.height);
    if (px < 0 || py < 0 || px >= frame.width || py >= frame.height) {
      setHover(undefined);
      return;
    }
    setHover({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      text: `(${px}, ${py}) ${pixelText(frame, px, py)}`,
    });
  }, []);

  const displayMeta = activeWebRtc && webrtcStats
    ? (webrtcStats.status === "streaming" || webrtcStats.status === "congested"
        ? `H.264 ${webrtcStats.width}×${webrtcStats.height} · ${webrtcStats.actualFps} FPS (${targetFps}) · ${webrtcStats.bitrateKbps} kbps · loss ${(webrtcStats.packetLoss * 100).toFixed(1)}% · RTT ${(webrtcStats.rtt * 1000).toFixed(0)} ms`
        : webrtcStats.status === "connecting"
        ? "WebRTC 连接中..."
        : webrtcStats.status === "error"
        ? webrtcStats.statusText || t("webrtcUnavailable")
        : "")
    : meta;

  const header = (
    <>
        {fixedTopic ? (
          <span className="panel-meta" title={fixedTopic}>{fixedTopic}</span>
        ) : (
          <select
            value={topic}
            onChange={(e) => {
              preferRawRef.current = topics.some(
                (candidate) =>
                  candidate.topic === e.target.value &&
                  candidate.schemaName === "sensor_msgs/msg/Image",
              );
              setTopic(e.target.value);
            }}
          >
            <option value="">{t("chooseImageTopic")}</option>
            {imageTopics.map((t) => (
              <option key={t.topic} value={t.topic}>
                {t.topic}
              </option>
            ))}
          </select>
        )}
        {isImageTopic && (
          <>
            <select
              value={targetFps}
              title={t("targetFps")}
              onChange={(e) => {
                const fps = Number(e.target.value);
                setTargetFps(fps);
                if (active && activeWebRtc && !collapsed) {
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
            </select>
            <button
              type="button"
              className={`panel-btn ${activeWebRtc ? "active" : ""}`}
              style={{
                fontSize: 11,
                padding: "2px 6px",
                marginLeft: 4,
                background: activeWebRtc ? "#0284c7" : "#334155",
                color: "#fff",
                border: "none",
                borderRadius: 3,
                cursor: "pointer",
              }}
              title="切换 WebRTC / Raw 渲染"
              onClick={() => setUseWebRtc(!useWebRtc)}
            >
              {activeWebRtc ? "WebRTC" : "Raw"}
            </button>
          </>
        )}
        <span className="panel-meta">{displayMeta}</span>
    </>
  );
  const content = (
      <div className="panel-body image-body">
        {activeWebRtc ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", background: "#000" }}
          />
        ) : (
          <canvas ref={canvasRef} onMouseMove={onMove} onMouseLeave={() => setHover(undefined)} />
        )}
        {hover && !activeWebRtc && (
          <div className="pixel-tip" style={{ left: hover.x + 12, top: hover.y + 12 }}>
            {hover.text}
          </div>
        )}
      </div>
  );

  if (embedded) {
    return (
      <div className="panel dock-panel-content">
        <div className="panel-header">{header}</div>
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

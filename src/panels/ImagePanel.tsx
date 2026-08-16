/**
 * 图像面板：CompressedImage（jpeg/png → createImageBitmap）与
 * raw Image（rgb8/bgr8/mono8/mono16/16UC1/32FC1，深度图 turbo 上色）。
 * 悬停显示像素坐标 + 值（深度显示米数），视觉调参用。
 */
import { useCallback, useEffect, useRef, useState } from "react";

import type { WorkerBridge } from "../bridge/WorkerBridge";
import type { TopicInfo } from "../core/FoxgloveConnection";
import { turbo } from "../renderers/colormap";
import type { MessagePayload } from "../worker/protocol";
import { CollapsiblePanel } from "../app/CollapsiblePanel";
import { useI18n } from "../app/i18n";

const IMAGE_SCHEMAS = new Set(["sensor_msgs/msg/Image", "sensor_msgs/msg/CompressedImage"]);
const IMAGE_MAX_FREQUENCY = 5;

interface HoverInfo {
  x: number;
  y: number;
  text: string;
}

interface RawFrame {
  width: number;
  height: number;
  encoding: string;
  /** 原始像素（拷贝，供悬停取值） */
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
  bridge,
  topics,
  initialTopic,
  onTopicChange,
  onClose,
}: {
  embedded?: boolean;
  bridge: WorkerBridge;
  topics: TopicInfo[];
  /** 配置恢复：初始选中的话题 */
  initialTopic?: string;
  /** 配置保存：话题选择变化时上报 */
  onTopicChange?: (topic: string) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<RawFrame>(null);
  const [topic, setTopic] = useState(initialTopic ?? "");
  const [collapsed, setCollapsed] = useState(false);
  const [hover, setHover] = useState<HoverInfo>();
  const [meta, setMeta] = useState<string>("");

  useEffect(() => {
    onTopicChange?.(topic);
    // onTopicChange 是 App 侧的快照记录回调，身份变化不需重跑
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  const imageTopics = topics.filter((t) => IMAGE_SCHEMAS.has(t.schemaName));

  useEffect(() => {
    if (!topic || collapsed) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const unsub = bridge.subscribe(topic, (payload: MessagePayload) => {
      if (payload.kind === "compressed_image") {
        // 缓冲会被回收：立即拷贝再异步解码
        const bytes = new Uint8Array(payload.data);
        frameRef.current = null; // 压缩图不支持逐像素取值
        void createImageBitmap(new Blob([bytes as unknown as BlobPart])).then((bmp) => {
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
  }, [bridge, collapsed, topic]);

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

  const header = (
    <>
        <select value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">{t("chooseImageTopic")}</option>
          {imageTopics.map((t) => (
            <option key={t.topic} value={t.topic}>
              {t.topic}
            </option>
          ))}
        </select>
        <span className="panel-meta">{meta}</span>
    </>
  );
  const content = (
      <div className="panel-body image-body">
        <canvas ref={canvasRef} onMouseMove={onMove} onMouseLeave={() => setHover(undefined)} />
        {hover && (
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

/**
 * 图像采集插件。提供顶栏相机原始图像实时预览与单张无损 PNG 采集页面。
 */
import { lazy, Suspense } from "react";

import type { PluginPageProps, RobvizPlugin } from "../types";

const ImageCapturePage = lazy(() =>
  import("../../panels/ImageCapturePage").then((m) => ({ default: m.ImageCapturePage })),
);

function ImageCapturePageWrapper({
  ctx,
  bridgeUrl,
  mediaUrl,
  fontScale,
}: PluginPageProps) {
  return (
    <Suspense fallback={<div className="page-loading">{ctx.locale === "en" ? "Image Capture" : "图像采集"}</div>}>
      <ImageCapturePage
        bridge={ctx.bridge}
        topics={ctx.topics}
        active={ctx.active}
        bridgeUrl={bridgeUrl ?? "ws://localhost:8765"}
        mediaUrl={mediaUrl}
        connectionState={ctx.connectionState}
        theme={ctx.theme}
        fontScale={fontScale}
      />
    </Suspense>
  );
}

const plugin: RobvizPlugin = {
  id: "image-capture",
  name: "图像采集 (Image Capture)",
  pages: [
    {
      id: "main",
      legacyMode: "capture",
      title: (ctx) => (ctx.locale === "en" ? "Image Capture" : "图像采集"),
      component: ImageCapturePageWrapper,
    },
  ],
};

export default plugin;

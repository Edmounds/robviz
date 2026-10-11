/**
 * URDF 模型编辑插件。提供顶栏 URDF 模型与 XML 编辑器页面。
 */
import { lazy, Suspense } from "react";

import type { PluginPageProps, RobvizPlugin } from "../types";

const UrdfEditorPage = lazy(() => import("../../panels/UrdfEditorPage"));

function UrdfEditorPageWrapper({ ctx, isMobile }: PluginPageProps) {
  const stored = ctx.pluginStates["urdf-editor"] as { inspectorPercent?: number } | undefined;
  const inspectorPercent =
    typeof stored?.inspectorPercent === "number" && stored.inspectorPercent > 0 && stored.inspectorPercent <= 100
      ? stored.inspectorPercent
      : 35;

  const handlePercentChange = (percent: number) => {
    ctx.onPluginStateChange("urdf-editor", { inspectorPercent: percent });
  };

  return (
    <Suspense fallback={<div className="page-loading">{ctx.locale === "en" ? "Loading URDF editor..." : "正在载入 URDF 编辑器..."}</div>}>
      <UrdfEditorPage
        bridge={ctx.bridge}
        theme={ctx.theme}
        inspectorPercent={inspectorPercent}
        onInspectorPercentChange={handlePercentChange}
        isMobile={isMobile}
      />
    </Suspense>
  );
}

const plugin: RobvizPlugin = {
  id: "urdf-editor",
  name: "URDF 编辑 (URDF Editor)",
  pages: [
    {
      id: "main",
      legacyMode: "urdf",
      title: (ctx) => (ctx.locale === "en" ? "URDF Editor" : "URDF 编辑"),
      component: UrdfEditorPageWrapper,
    },
  ],
};

export default plugin;

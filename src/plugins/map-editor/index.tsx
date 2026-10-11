/**
 * 2D 地图编辑插件。提供顶栏地图编辑页面。
 */
import { lazy, Suspense } from "react";

import type { PluginPageProps, RobvizPlugin } from "../types";

const MapEditorPanel = lazy(() =>
  import("../../panels/MapEditorPanel").then((m) => ({ default: m.MapEditorPanel })),
);

function MapEditorPageWrapper({ ctx }: PluginPageProps) {
  return (
    <Suspense fallback={null}>
      <MapEditorPanel bridge={ctx.bridge} theme={ctx.theme} />
    </Suspense>
  );
}

const plugin: RobvizPlugin = {
  id: "map-editor",
  name: "地图编辑 (Map Editor)",
  pages: [
    {
      id: "main",
      legacyMode: "map",
      title: (ctx) => (ctx.locale === "en" ? "Map Editor" : "地图编辑"),
      component: MapEditorPageWrapper,
    },
  ],
};

export default plugin;

/**
 * 航点编辑插件。提供顶栏航点与 YAML 编辑器页面。
 */
import { lazy, Suspense } from "react";

import type { PluginPageProps, RobvizPlugin } from "../types";

const WaypointsEditorPage = lazy(() =>
  import("../../panels/WaypointsEditorPage").then((m) => ({ default: m.WaypointsEditorPage })),
);

function WaypointsEditorPageWrapper({ ctx, fontScale }: PluginPageProps) {
  return (
    <Suspense fallback={<div className="page-loading">{ctx.locale === "en" ? "Waypoints Editor" : "航点编辑"}</div>}>
      <WaypointsEditorPage fontScale={fontScale} />
    </Suspense>
  );
}

const plugin: RobvizPlugin = {
  id: "waypoints-editor",
  name: "航点编辑 (Waypoints Editor)",
  pages: [
    {
      id: "main",
      legacyMode: "waypoints",
      title: (ctx) => (ctx.locale === "en" ? "Waypoints Editor" : "航点编辑"),
      component: WaypointsEditorPageWrapper,
    },
  ],
};

export default plugin;

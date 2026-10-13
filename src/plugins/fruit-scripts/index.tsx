import { lazy, Suspense } from "react";
import type { PluginPageProps, RobvizPlugin } from "../types";

const ScriptControlPage = lazy(() => import("./ScriptControlPage"));

function Page(props: PluginPageProps) {
  return <Suspense fallback={<div className="page-loading">{props.ctx.locale === "en" ? "Loading scripts…" : "正在载入脚本控制…"}</div>}>
    <ScriptControlPage {...props} />
  </Suspense>;
}

const plugin: RobvizPlugin = {
  id: "fruit-scripts",
  name: "脚本控制 (Fruit Scripts)",
  pages: [{ id: "main", title: (ctx) => ctx.locale === "en" ? "Scripts" : "脚本控制", component: Page }],
  // The host deduplicates this shared service ID with the arm plugin.
  services: [{ id: "runtime", label: "机器人运行管理", defaultPort: 8001, protocol: "http",
    description: "复用机械臂与脚本任务运行管理 API" }],
};

export default plugin;

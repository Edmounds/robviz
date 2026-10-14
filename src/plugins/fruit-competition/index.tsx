import { lazy, Suspense } from "react";
import type { PluginPageProps, RobvizPlugin } from "../types";

const CompetitionPage = lazy(() => import("./CompetitionPage"));

function Page(props: PluginPageProps) {
  return <Suspense fallback={<div className="page-loading">正在载入正式比赛…</div>}><CompetitionPage {...props} /></Suspense>;
}

const plugin: RobvizPlugin = {
  id: "fruit-competition",
  name: "正式比赛 (Fruit Competition)",
  pages: [{ id: "main", title: (ctx) => ctx.locale === "en" ? "Competition" : "正式比赛", component: Page }],
  services: [
    { id: "runtime", label: "机器人运行管理", defaultPort: 8001, protocol: "http", description: "比赛启动、状态与日志" },
    { id: "video", label: "相机视频", defaultPort: 8787, protocol: "http", description: "相机图像桥" },
  ],
};

export default plugin;

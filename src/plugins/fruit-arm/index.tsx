import { lazy, Suspense } from "react";
import type { PluginPageProps, RobvizPlugin } from "../types";

const FruitArmPage = lazy(() => import("./FruitArmPage"));

function ArmPage(props: PluginPageProps) {
  return <Suspense fallback={<div className="page-loading">{props.ctx.locale === "en" ? "Loading arm…" : "正在载入机械臂…"}</div>}>
    <FruitArmPage {...props} />
  </Suspense>;
}

const plugin: RobvizPlugin = {
  id: "fruit-arm",
  name: "机械臂 (Fruit Arm)",
  pages: [{ id: "main", title: (ctx) => ctx.locale === "en" ? "Arm" : "机械臂", component: ArmPage }],
};

export default plugin;

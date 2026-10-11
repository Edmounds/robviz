/**
 * 3D 视图插件。将 3D 显示作为可配置的插件板块管理。
 */
import type { RobvizPlugin } from "../types";

const plugin: RobvizPlugin = {
  id: "view-3d",
  name: "3D 视图 (3D View)",
  panels: [
    {
      builtinKind: "3d",
      title: (ctx) => (ctx.locale === "en" ? "3D View" : "3D 视图"),
    },
  ],
};

export default plugin;

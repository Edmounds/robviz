import { createRoot } from "react-dom/client";

import App from "./app/App";
import { ErrorBoundary } from "./app/ErrorBoundary";
import { APP_CONFIG_STORAGE_KEY, parseAppConfig } from "./core/appConfig";
import { loadInstalledPlugins } from "./plugins/loader";
import { registerInstalledPlugins } from "./plugins/registry";
import "./app/app.css";
import "./ui/ui.css";

// 不用 StrictMode：双挂载会重复创建 Worker 与 WebGL 上下文，开发期噪音大于收益
// 顶层兜底边界：面板级边界都失守时至少给出可读错误而非白屏
const root = createRoot(document.getElementById("root")!);
root.render(<p role="status" className="rv-empty">正在加载插件 / Loading plugins…</p>);

async function start() {
  let disabled: string[] = [];
  try {
    const stored = localStorage.getItem(APP_CONFIG_STORAGE_KEY);
    if (stored) {
      const parsed = parseAppConfig(stored);
      disabled = parsed.settings.disabledPluginIds;
      const backupKey = `${APP_CONFIG_STORAGE_KEY}.before-plugin-split`;
      if (!localStorage.getItem(backupKey)) localStorage.setItem(backupKey, stored);
    }
  } catch (error) {
    console.warn("[plugins] 无法读取插件启停配置:", error);
  }
  registerInstalledPlugins(await loadInstalledPlugins(new URL("./plugins/", document.baseURI), disabled));
  root.render(
    <ErrorBoundary name="RobViz" onReset={() => window.location.reload()}>
      <App />
    </ErrorBoundary>,
  );
}

void start();

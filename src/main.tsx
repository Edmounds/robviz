import { createRoot } from "react-dom/client";

import App from "./app/App";
import { ErrorBoundary } from "./app/ErrorBoundary";
import "./app/app.css";

// 不用 StrictMode：双挂载会重复创建 Worker 与 WebGL 上下文，开发期噪音大于收益
// 顶层兜底边界：面板级边界都失守时至少给出可读错误而非白屏
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary name="RobViz" onReset={() => window.location.reload()}>
    <App />
  </ErrorBoundary>,
);

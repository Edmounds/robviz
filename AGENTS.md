# AGENTS.md

## Mock 生命周期

- `npm run mock` 只在明确需要手动联调或浏览器验证时按需启动，默认保持关闭。
- 启动 mock 后只在当前验证期间运行；验证或任务结束前必须停止，不得将它留在后台，也不得长期占用 `ws://localhost:8765`。
- 手动关闭时，在运行 `npm run mock` 的终端按 `Ctrl-C`；若终端不可用，先确认占用 8765 端口的进程属于本仓库的 `mock/server.ts`，再结束该进程及其 `npm run mock`/`tsx` 子进程。
- 测试中通过 `startMockServer` 内嵌启动的实例由测试生命周期管理，不作为长期后台服务运行。

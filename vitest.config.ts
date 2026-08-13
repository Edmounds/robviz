import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 集成测试要等模拟服务器的低频话题（/map 2s 一发）
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});

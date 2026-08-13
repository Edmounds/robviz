---
name: robviz-plugin
description: 为 RobViz 编写插件（3D 显示器、面板坞面板、侧栏区块）。当用户要求"写一个插件"、"加一个自定义面板/显示器/侧栏功能"、扩展 RobViz 功能，或提到 src/plugins 目录时使用。
---

# RobViz 插件开发

## 流程

1. **先读完整契约**：[docs/04-plugin-guide.md](../../../docs/04-plugin-guide.md)
   （PluginContext 能力、三类扩展点、状态持久化、规则约定都在里面）。
2. 生成骨架：

```bash
npm run plugin:new <id>    # id 小写中划线，生成 src/plugins/<id>/index.tsx
```

3. 编辑 `src/plugins/<id>/index.tsx` 实现功能。参照可运行示例
   [src/plugins/example-odom-hud/index.tsx](../../../src/plugins/example-odom-hud/index.tsx)。
4. 验证：

```bash
npm run lint && npx tsc -b --noEmit && npm test
```

## 关键约束（违反会被 review 打回）

- 数据只走 `ctx.bridge`（subscribe/publish/callService），不自己开 WebSocket。
- 不改 `src/app/App.tsx` 等宿主代码，插件代码全部在自己目录内。
- 订阅在 `useEffect` cleanup 中取消。
- UI 用现有 CSS 类与设计令牌（`side-row`、`panel-header`、`var(--foreground)`），
  不硬编码黑白色，深浅主题都要可读。
- 面板状态走 `state` / `onStateChange`（可 JSON 序列化），自动进配置文件。

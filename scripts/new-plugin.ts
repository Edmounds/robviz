/**
 * 插件脚手架：npm run plugin:new <id>
 * 生成 src/plugins/<id>/index.tsx 骨架（单实例停靠区块形态，最易上手；
 * 面板/3D 显示器形态见 docs/04-plugin-guide.md）。
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const id = process.argv[2];
if (!id || !/^[a-z][a-z0-9-]*$/.test(id)) {
  console.error("用法: npm run plugin:new <id>   （id 小写字母开头，可含数字与中划线）");
  process.exit(1);
}

const dir = join("src", "plugins", id);
if (existsSync(dir)) {
  console.error(`已存在: ${dir}`);
  process.exit(1);
}

const template = `/**
 * ${id} 插件。开发指南：docs/04-plugin-guide.md
 */
import { useEffect, useState } from "react";

import type { PluginSectionProps, RobvizPlugin } from "../types";

function Section({ ctx }: PluginSectionProps) {
  const [latest, setLatest] = useState<string>();

  // 示例：订阅一个话题（换成你需要的）
  useEffect(() => {
    const unsub = ctx.bridge.subscribe("/odom", (payload) => {
      if (payload.kind !== "raw") return;
      setLatest(JSON.stringify(payload.message).slice(0, 80));
    });
    return unsub;
  }, [ctx.bridge]);

  return (
    <div className="side-row">
      <span className="side-label">
        {latest ?? (ctx.locale === "en" ? "Waiting for messages..." : "等待消息...")}
      </span>
    </div>
  );
}

const plugin: RobvizPlugin = {
  id: "${id}",
  name: "${id}",
  sections: [{ id: "main", title: "${id}", component: Section }],
  // panels: [...]   可多开停靠面板（内容无需自带标题栏）
  // displays: [...] 3D 显示器
};

export default plugin;
`;

mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "index.tsx"), template);
console.log(`已创建 ${dir}/index.tsx`);
console.log("下一步：编辑实现功能，然后 npm run lint && npx tsc -b --noEmit && npm test");

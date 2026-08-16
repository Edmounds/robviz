import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { WorkerBridge } from "../../src/bridge/WorkerBridge";
import type { TopicInfo } from "../../src/core/FoxgloveConnection";
import { I18nProvider } from "../../src/app/i18n";
import { EchoTopicSection } from "../../src/panels/EchoTopicSection";

const topics: TopicInfo[] = [
  { topic: "/odom", schemaName: "nav_msgs/msg/Odometry" },
  { topic: "/scan", schemaName: "sensor_msgs/msg/LaserScan" },
];

describe("EchoTopicSection", () => {
  it("默认显示话题选择框并等待用户选择", () => {
    const html = renderToStaticMarkup(
      <I18nProvider locale="zh-CN">
        <EchoTopicSection bridge={{} as WorkerBridge} topics={topics} />
      </I18nProvider>,
    );

    expect(html).toContain("Echo Topic");
    expect(html.match(/<select/g)?.length).toBe(1);
    expect(html).toContain("选择要 Echo 的话题...");
    expect(html).toContain("/odom (Odometry)");
    expect(html).toContain("/scan (LaserScan)");
    expect(html).toContain("选择话题后等待数据");
    expect(html).toContain("收起Echo Topic");
  });
});

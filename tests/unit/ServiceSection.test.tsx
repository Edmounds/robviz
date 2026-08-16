import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ServiceInfo } from "../../src/core/FoxgloveConnection";
import { ServiceSection } from "../../src/panels/ServiceSection";
import { I18nProvider } from "../../src/app/i18n";
import type { WorkerBridge } from "../../src/bridge/WorkerBridge";

const services: ServiceInfo[] = [
  {
    name: "/enable",
    type: "std_srvs/srv/SetBool",
    requestSchema: "bool data",
    responseSchema: "bool success\nstring message",
  },
  {
    name: "/reset",
    type: "std_srvs/srv/Trigger",
    requestSchema: "",
    responseSchema: "bool success\nstring message",
  },
];

describe("ServiceSection", () => {
  it("把服务渲染为单个选择框，初始不展开任何请求表单", () => {
    const html = renderToStaticMarkup(
      <I18nProvider locale="zh-CN">
        <ServiceSection bridge={{} as WorkerBridge} services={services} />
      </I18nProvider>,
    );

    expect(html.match(/<select/g)?.length).toBe(1);
    expect(html).toContain('value=""');
    expect(html).toContain("选择服务...");
    expect(html).toContain("/enable (SetBool)");
    expect(html).toContain("/reset (Trigger)");
    expect(html).not.toContain("topic-row");
    expect(html).not.toContain("service-form");
  });
});

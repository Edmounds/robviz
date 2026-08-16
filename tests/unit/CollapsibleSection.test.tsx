import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CollapsibleSection } from "../../src/app/CollapsibleSection";
import { I18nProvider } from "../../src/app/i18n";

describe("CollapsibleSection", () => {
  it("默认展开内容并提供收起按钮", () => {
    const html = renderToStaticMarkup(
      <I18nProvider locale="zh-CN">
        <CollapsibleSection title="服务">
          <span>service content</span>
        </CollapsibleSection>
      </I18nProvider>,
    );

    expect(html).toContain("service content");
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-label="收起服务"');
  });

  it("折叠后只保留标题行并可重新展开", () => {
    const html = renderToStaticMarkup(
      <I18nProvider locale="zh-CN">
        <CollapsibleSection title="服务" defaultCollapsed>
          <span>service content</span>
        </CollapsibleSection>
      </I18nProvider>,
    );

    expect(html).toContain("服务");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="展开服务"');
    expect(html).toContain("hidden");
  });
});

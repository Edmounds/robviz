import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CollapsiblePanel } from "../../src/app/CollapsiblePanel";
import { I18nProvider } from "../../src/app/i18n";

describe("CollapsiblePanel", () => {
  it("展开时显示工具和内容", () => {
    const html = renderToStaticMarkup(
      <I18nProvider locale="zh-CN">
        <CollapsiblePanel title="曲线面板" header={<button>添加</button>} onClose={() => {}}>
          <span>plot content</span>
        </CollapsiblePanel>
      </I18nProvider>,
    );

    expect(html).toContain("添加");
    expect(html).toContain("plot content");
    expect(html).toContain('aria-label="收起曲线面板"');
  });

  it("折叠后仅显示面板名称和展开按钮", () => {
    const html = renderToStaticMarkup(
      <I18nProvider locale="zh-CN">
        <CollapsiblePanel
          title="曲线面板"
          header={<button>添加</button>}
          defaultCollapsed
          onClose={() => {}}
        >
          <span>plot content</span>
        </CollapsiblePanel>
      </I18nProvider>,
    );

    expect(html).toContain("曲线面板");
    expect(html).not.toContain(">添加</button>");
    expect(html).toContain('aria-label="展开曲线面板"');
    expect(html).toContain("hidden");
  });
});

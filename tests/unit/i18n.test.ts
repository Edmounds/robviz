import { describe, expect, it } from "vitest";

import { translate } from "../../src/app/i18n";

describe("i18n", () => {
  it("按 locale 翻译并替换参数", () => {
    expect(translate("zh-CN", "undoCount", { count: 3 })).toBe("撤销 (3)");
    expect(translate("en", "undoCount", { count: 3 })).toBe("Undo (3)");
  });

  it("无话题时不提示启动本地服务", () => {
    expect(translate("zh-CN", "noTopics")).toBe("暂无话题");
    expect(translate("en", "noTopics")).toBe("No topics");
  });

  it("中文界面将 Echo Topic 显示为话题输出", () => {
    expect(translate("zh-CN", "echoTopic")).toBe("话题输出");
  });
});

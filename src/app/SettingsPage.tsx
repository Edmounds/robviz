import { Box, Languages, Plug, RotateCcw } from "lucide-react";

import type { LayoutConfig } from "../core/layoutConfig";
import type { RobvizPlugin } from "../plugins/types";
import type { Theme } from "../renderers/sceneTheme";
import { useI18n } from "./i18n";

type Settings = LayoutConfig["settings"];
type SettingsTab = "general" | "3d" | "plugins";

export function SettingsPage({
  tab,
  settings,
  theme,
  plugins,
  onTabChange,
  onSettingsChange,
  onThemeChange,
  onPluginToggle,
  onResetLayout,
}: {
  tab: SettingsTab;
  settings: Settings;
  theme: Theme;
  plugins: RobvizPlugin[];
  onTabChange: (tab: SettingsTab) => void;
  onSettingsChange: (settings: Settings) => void;
  onThemeChange: (theme: Theme) => void;
  onPluginToggle: (pluginId: string, enabled: boolean) => void;
  onResetLayout: () => void;
}) {
  const { t } = useI18n();
  const disabled = new Set(settings.disabledPluginIds);

  return (
    <section className="settings-page">
      <nav className="settings-nav" aria-label={t("settings")}>
        <button className={tab === "general" ? "active" : ""} onClick={() => onTabChange("general")}>
          <Languages /> {t("general")}
        </button>
        <button className={tab === "3d" ? "active" : ""} onClick={() => onTabChange("3d")}>
          <Box /> {t("threeD")}
        </button>
        <button className={tab === "plugins" ? "active" : ""} onClick={() => onTabChange("plugins")}>
          <Plug /> {t("plugins")}
        </button>
      </nav>

      <div className="settings-content">
        <h1>{tab === "general" ? t("general") : tab === "3d" ? t("threeD") : t("plugins")}</h1>

        {tab === "general" && (
          <>
            <section className="settings-section">
              <h2>{t("language")}</h2>
              <label className="settings-row">
                <span>{t("language")}</span>
                <select
                  value={settings.language}
                  onChange={(event) => onSettingsChange({
                    ...settings,
                    language: event.target.value as Settings["language"],
                  })}
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="en">English</option>
                </select>
              </label>
            </section>
            <section className="settings-section">
              <h2>{t("appearance")}</h2>
              <div className="settings-row">
                <span>{t("theme")}</span>
                <div className="segmented-control">
                  <button className={theme === "dark" ? "active" : ""} onClick={() => onThemeChange("dark")}>
                    {t("dark")}
                  </button>
                  <button className={theme === "light" ? "active" : ""} onClick={() => onThemeChange("light")}>
                    {t("light")}
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {tab === "3d" && (
          <>
            <section className="settings-section">
              <h2>{t("scene")}</h2>
              <label className="settings-row settings-toggle">
                <span><strong>{t("ground")}</strong><small>{t("groundHint")}</small></span>
                <input
                  type="checkbox"
                  checked={settings.groundVisible}
                  onChange={(event) => onSettingsChange({ ...settings, groundVisible: event.target.checked })}
                />
              </label>
              <label className="settings-row settings-slider">
                <span>{t("axesWidth")}</span>
                <input
                  type="range"
                  min={1}
                  max={6}
                  step={0.5}
                  value={settings.tfAxesLineWidth}
                  onChange={(event) => onSettingsChange({
                    ...settings,
                    tfAxesLineWidth: Number(event.target.value),
                  })}
                />
                <output>{settings.tfAxesLineWidth.toFixed(1)} px</output>
              </label>
            </section>
            <section className="settings-section">
              <h2>{t("layout")}</h2>
              <button className="settings-command" onClick={onResetLayout}><RotateCcw /> {t("resetLayout")}</button>
            </section>
          </>
        )}

        {tab === "plugins" && (
          <section className="settings-section plugin-settings">
            <p className="settings-hint">{t("pluginBundledHint")}</p>
            {plugins.map((plugin) => {
              const enabled = !disabled.has(plugin.id);
              return (
                <label className="plugin-setting-row" key={plugin.id}>
                  <span className="plugin-setting-copy">
                    <strong>{plugin.name}</strong>
                    <code>{plugin.id}</code>
                    <small>{t("pluginExtensions", {
                      panels: plugin.panels?.length ?? 0,
                      sections: plugin.sections?.length ?? 0,
                      displays: plugin.displays?.length ?? 0,
                      tools: plugin.viewportTools?.length ?? 0,
                    })}</small>
                  </span>
                  <span className="plugin-setting-toggle">
                    {enabled ? t("enabled") : t("disabled")}
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(event) => onPluginToggle(plugin.id, event.target.checked)}
                    />
                  </span>
                </label>
              );
            })}
          </section>
        )}
      </div>
    </section>
  );
}

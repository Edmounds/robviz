import { Box, Image, Languages, Plug, RotateCcw, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { WorkerBridge } from "../bridge/WorkerBridge";
import type { LayoutConfig } from "../core/layoutConfig";
import {
  applyImageSettings,
  fetchImageSettings,
  saveImageSettingsDefaults,
  type ImageSettings,
  type ImageStreamSettings,
} from "../core/waypointApi";
import type { RobvizPlugin } from "../plugins/types";
import type { Theme } from "../renderers/sceneTheme";
import { useI18n } from "./i18n";

type Settings = LayoutConfig["settings"];
export type SettingsTab = "general" | "3d" | "images" | "plugins";

function updateStream(
  settings: ImageSettings,
  streamName: "rgb" | "depth",
  patch: Partial<ImageStreamSettings>,
): ImageSettings {
  return { ...settings, [streamName]: { ...settings[streamName], ...patch } };
}

function ImageStreamSettingsForm({
  name,
  value,
  locale,
  onChange,
}: {
  name: "rgb" | "depth";
  value: ImageStreamSettings;
  locale: "zh-CN" | "en";
  onChange: (patch: Partial<ImageStreamSettings>) => void;
}) {
  const isEn = locale === "en";
  return (
    <section className="settings-section image-settings-stream">
      <h2>{name === "rgb" ? "RGB" : (isEn ? "Native Depth" : "原始深度")}</h2>
      <label className="settings-row settings-slider">
        <span>{isEn ? "Bandwidth" : "带宽"}</span>
        <input
          type="number"
          min={0.01}
          max={1000}
          step={0.05}
          value={value.bandwidth_mbps}
          onChange={(event) => onChange({ bandwidth_mbps: Number(event.target.value) })}
        />
        <output>Mbps</output>
      </label>
      <label className="settings-row settings-toggle">
        <span><strong>{isEn ? "Automatic JPEG quality" : "自动 JPEG 质量"}</strong><small>{isEn ? "Reduce quality before dropping frames" : "先降低质量，再丢帧"}</small></span>
        <input type="checkbox" checked={value.auto_quality} onChange={(event) => onChange({ auto_quality: event.target.checked })} />
      </label>
      <label className="settings-row settings-slider">
        <span>{isEn ? "JPEG quality" : "JPEG 质量"}</span>
        <input
          type="range"
          min={30}
          max={95}
          step={1}
          value={value.quality}
          onChange={(event) => onChange({ quality: Number(event.target.value) })}
        />
        <output>{value.quality}</output>
      </label>
      <div className="settings-grid-row">
        <label><span>{isEn ? "Width" : "宽度"}</span><input type="number" min={64} max={3840} step={1} value={value.width} onChange={(event) => onChange({ width: Number(event.target.value) })} /></label>
        <label><span>{isEn ? "Height" : "高度"}</span><input type="number" min={48} max={2160} step={1} value={value.height} onChange={(event) => onChange({ height: Number(event.target.value) })} /></label>
        <label><span>FPS</span><input type="number" min={0.1} max={60} step={0.5} value={value.max_fps} onChange={(event) => onChange({ max_fps: Number(event.target.value) })} /></label>
      </div>
    </section>
  );
}

function ImageTransportSettings({
  bridge,
  connectionState,
}: {
  bridge: WorkerBridge;
  connectionState: "connecting" | "open" | "closed";
}) {
  const { locale } = useI18n();
  const isEn = locale === "en";
  const [settings, setSettings] = useState<ImageSettings>();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string }>();

  const reloadRos = useCallback(async (version: number) => {
    if (connectionState !== "open") {
      throw new Error(isEn ? "Connect to ROS before applying image settings" : "应用图像配置前请先连接 ROS");
    }
    const response = await bridge.callService("/fruit_robviz_bridge/reload_image_settings", {});
    const result = response as { success?: unknown; message?: unknown };
    if (result.success !== true) {
      throw new Error(typeof result.message === "string" ? result.message : `ROS reload rejected version ${version}`);
    }
    return typeof result.message === "string" ? result.message : `applied version ${version}`;
  }, [bridge, connectionState, isEn]);

  useEffect(() => {
    let cancelled = false;
    void fetchImageSettings()
      .then((response) => {
        if (!cancelled) setSettings(response.settings);
      })
      .catch((error) => {
        if (!cancelled) setStatus({ kind: "error", text: error instanceof Error ? error.message : String(error) });
      });
    return () => { cancelled = true; };
  }, []);

  const apply = useCallback(async () => {
    if (!settings || busy) return;
    setBusy(true);
    setStatus(undefined);
    try {
      const response = await applyImageSettings(settings);
      setSettings(response.settings);
      const message = await reloadRos(response.version);
      setStatus({ kind: "ok", text: isEn ? `Applied: ${message}` : `已生效：${message}` });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  }, [busy, isEn, reloadRos, settings]);

  const saveDefaults = useCallback(async () => {
    if (!settings || busy) return;
    setBusy(true);
    setStatus(undefined);
    try {
      const response = await saveImageSettingsDefaults(settings);
      setSettings(response.settings);
      const message = await reloadRos(response.version);
      setStatus({ kind: "ok", text: isEn ? `Default saved and applied: ${message}` : `默认已保存并生效：${message}` });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  }, [busy, isEn, reloadRos, settings]);

  return (
    <div className="settings-image-transport">
      <p className="settings-hint">{isEn ? "These settings control the bounded compressed previews. Changes require a successful ROS reload." : "这些设置控制有界的压缩预览。配置只有在 ROS 重载成功后才算生效。"}</p>
      {settings ? (
        <>
          <ImageStreamSettingsForm name="rgb" value={settings.rgb} locale={locale} onChange={(patch) => setSettings((current) => current && updateStream(current, "rgb", patch))} />
          <ImageStreamSettingsForm name="depth" value={settings.depth} locale={locale} onChange={(patch) => setSettings((current) => current && updateStream(current, "depth", patch))} />
          <div className="settings-actions">
            <button className="settings-command" onClick={() => void apply()} disabled={busy}><RotateCcw /> {isEn ? "Apply" : "应用"}</button>
            <button className="settings-command" onClick={() => void saveDefaults()} disabled={busy}><Save /> {isEn ? "Save as default" : "保存为默认"}</button>
            <span className="settings-version">v{settings.version} · {connectionState}</span>
          </div>
          {status && <p className={`settings-feedback ${status.kind}`}>{status.text}</p>}
        </>
      ) : (
        <p className="empty-hint">{isEn ? "Loading image settings..." : "正在加载图像配置..."}</p>
      )}
    </div>
  );
}

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
  bridge,
  connectionState,
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
  bridge: WorkerBridge;
  connectionState: "connecting" | "open" | "closed";
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
        <button className={tab === "images" ? "active" : ""} onClick={() => onTabChange("images")}>
          <Image /> {t("imageSettings")}
        </button>
        <button className={tab === "plugins" ? "active" : ""} onClick={() => onTabChange("plugins")}>
          <Plug /> {t("plugins")}
        </button>
      </nav>

      <div className="settings-content">
        <h1>{tab === "general" ? t("general") : tab === "3d" ? t("threeD") : tab === "images" ? t("imageSettings") : t("plugins")}</h1>

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

        {tab === "images" && <ImageTransportSettings bridge={bridge} connectionState={connectionState} />}

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

import { Box, Globe, Image, Languages, Plug, RotateCcw, Save } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { WorkerBridge } from "../bridge/WorkerBridge";
import type {
  NetworkServiceOverride,
  RobotSessionConfig,
} from "../core/appConfig";
import {
  CORE_NETWORK_SERVICES,
  resolveBaseHost,
  resolveServiceUrl,
} from "../core/appConfig";
import type { LayoutConfig } from "../core/layoutConfig";
import {
  applyImageSettings,
  fetchImageSettings,
  saveImageSettingsDefaults,
  type ImageSettings,
  type ImageStreamSettings,
} from "../core/waypointApi";
import type { PluginServiceDefinition, RobvizPlugin } from "../plugins/types";
import type { Theme } from "../renderers/sceneTheme";
import { useI18n } from "./i18n";
import { NumberInput, validateInputs } from "./EditableInput";

type Settings = LayoutConfig["settings"];
export type SettingsTab = "general" | "3d" | "images" | "plugins" | "network";

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

      <div className="settings-row">
        <span>{isEn ? "Transport Mode" : "传输模式"}</span>
        <strong>WebRTC (H.264)</strong>
      </div>

      <label className="settings-row settings-slider">
        <span>{isEn ? "Bandwidth Budget" : "带宽预算"}</span>
        <NumberInput
          min={0.1}
          max={1000}
          step="any"
          value={value.bandwidth_mbps}
          onValueChange={(value) => { if (value !== undefined) onChange({ bandwidth_mbps: value }); }}
        />
        <output>Mbps</output>
      </label>

      <label className="settings-row settings-slider">
        <span>{isEn ? "Max Frame Rate" : "帧率上限"}</span>
        <NumberInput
          min={1}
          max={60}
          step={1}
          value={value.max_fps}
          onValueChange={(value) => { if (value !== undefined) onChange({ max_fps: value }); }}
        />
        <output>FPS</output>
      </label>

        <label className="settings-row settings-slider">
          <span>{isEn ? "Target Bitrate" : "目标码率"}</span>
          <NumberInput
            min={0.1}
            max={value.bandwidth_mbps}
            step={0.1}
            value={value.target_bitrate_mbps}
            onValueChange={(value) => { if (value !== undefined) onChange({ target_bitrate_mbps: value }); }}
          />
          <output>Mbps</output>
        </label>
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
  const fields = useRef<HTMLDivElement>(null);

  const reloadRos = useCallback(async (version: number, session: string) => {
    if (connectionState !== "open") {
      throw new Error(isEn ? "Connect to ROS before applying image settings" : "应用图像配置前请先连接 ROS");
    }
    const response = await bridge.callService("/fruit_robviz_bridge/reload_image_settings", {});
    const result = response as { success?: unknown; message?: unknown };
    const message = typeof result.message === "string" ? result.message : "";
    if (result.success !== true) {
      throw new Error(message || `ROS reload rejected version ${version}`);
    }
    let confirmed: { version?: unknown; session?: unknown };
    try {
      confirmed = JSON.parse(message);
    } catch {
      throw new Error(`Invalid ROS reload confirmation: ${message}`);
    }
    if (confirmed?.version !== version || confirmed?.session !== session) {
      throw new Error(
        isEn
          ? `ROS reload confirmed unexpected version: ${message}`
          : `ROS 重载返回的版本不匹配：${message}`,
      );
    }
    return message;
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
    if (!validateInputs(fields.current)) return;
    if (!settings || busy) return;
    setBusy(true);
    setStatus(undefined);
    try {
      const response = await applyImageSettings(settings);
      setSettings(response.settings);
      const message = await reloadRos(response.version, response.settings.session);
      setStatus({ kind: "ok", text: isEn ? `Applied: ${message}` : `已生效：${message}` });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  }, [busy, isEn, reloadRos, settings]);

  const saveDefaults = useCallback(async () => {
    if (!validateInputs(fields.current)) return;
    if (!settings || busy) return;
    setBusy(true);
    setStatus(undefined);
    try {
      const response = await saveImageSettingsDefaults(settings);
      setSettings(response.settings);
      const message = await reloadRos(response.version, response.settings.session);
      setStatus({ kind: "ok", text: isEn ? `Default saved and applied: ${message}` : `默认已保存并生效：${message}` });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  }, [busy, isEn, reloadRos, settings]);

  return (
    <div className="settings-image-transport" ref={fields}>
      <p className="settings-hint">{isEn ? "These settings control WebRTC previews. Changes require a successful ROS reload." : "这些设置控制 WebRTC 预览。配置只有在 ROS 重载成功后才算生效。"}</p>
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

function NetworkSettingsSection({
  session,
  services,
  onSessionChange,
}: {
  session: RobotSessionConfig;
  services: PluginServiceDefinition[];
  onSessionChange: (session: RobotSessionConfig) => void;
}) {
  const { t } = useI18n();
  const baseHost = resolveBaseHost(session.url);

  const updateOverride = (serviceId: string, patch: Partial<NetworkServiceOverride>) => {
    const currentOverrides = session.networkOverrides ?? {};
    const existing = currentOverrides[serviceId] ?? {};
    const updated = { ...existing, ...patch };
    if (!updated.host?.trim()) delete updated.host;
    if (updated.port === undefined || isNaN(updated.port) || updated.port <= 0) delete updated.port;
    if (!updated.url?.trim()) delete updated.url;

    const nextOverrides = { ...currentOverrides };
    if (Object.keys(updated).length === 0) {
      delete nextOverrides[serviceId];
    } else {
      nextOverrides[serviceId] = updated;
    }
    onSessionChange({ ...session, networkOverrides: nextOverrides });
  };

  const clearOverride = (serviceId: string) => {
    if (!session.networkOverrides?.[serviceId]) return;
    const nextOverrides = { ...session.networkOverrides };
    delete nextOverrides[serviceId];
    onSessionChange({ ...session, networkOverrides: nextOverrides });
  };

  return (
    <div className="settings-network">
      <div className="network-base-card">
        <div>
          <span>{t("baseRobotHost")}: </span>
          <strong>{baseHost}</strong>
        </div>
        <small>({t("derivedFromSessionUrl")}: <code>{session.url}</code>)</small>
      </div>
      <p className="settings-hint">{t("networkHint")}</p>

      <div className="network-services-list">
        {services.map((service) => {
          const override = session.networkOverrides?.[service.id];
          const hasOverride = !!override && (override.port !== undefined || !!override.host || !!override.url);
          const effectiveUrl = resolveServiceUrl(service, session);

          return (
            <div key={service.id} className="network-service-card">
              <div className="network-service-main">
                <div className="network-service-title">
                  <strong>{service.label}</strong>
                  <span className="network-tag">{service.protocol.toUpperCase()}</span>
                  <span className="network-port-tag">:{service.defaultPort}</span>
                </div>
                {service.description && (
                  <p className="network-service-desc">{service.description}</p>
                )}
                <div className="network-effective">
                  <span>{t("effectiveTarget")}: </span>
                  <code>{effectiveUrl}</code>
                </div>
              </div>

              <div className="network-service-inputs">
                <label className="network-input-group">
                  <span>{t("hostOverride")}</span>
                  <input
                    type="text"
                    placeholder={baseHost}
                    value={override?.host ?? ""}
                    onChange={(e) => updateOverride(service.id, { host: e.target.value })}
                  />
                </label>
                <label className="network-input-group">
                  <span>{t("portOverride")}</span>
                  <NumberInput
                    required={false}
                    min={1}
                    max={65535}
                    placeholder={String(service.defaultPort)}
                    value={override?.port}
                    onValueChange={(value) => updateOverride(service.id, {
                      port: value,
                    })}
                  />
                </label>
                {hasOverride && (
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => clearOverride(service.id)}
                    title={t("resetToDefault")}
                  >
                    <RotateCcw style={{ width: 12, height: 12 }} />
                    <span>{t("resetToDefault")}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SettingsPage({
  tab,
  settings,
  session,
  networkServices,
  onSessionChange,
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
  session?: RobotSessionConfig;
  networkServices?: PluginServiceDefinition[];
  onSessionChange?: (session: RobotSessionConfig) => void;
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
        <button className={tab === "network" ? "active" : ""} onClick={() => onTabChange("network")}>
          <Globe /> {t("network")}
        </button>
      </nav>

      <div className="settings-content">
        <h1>
          {tab === "general"
            ? t("general")
            : tab === "3d"
              ? t("threeD")
              : tab === "images"
                ? t("imageSettings")
                : tab === "network"
                  ? t("networkSettings")
                  : t("plugins")}
        </h1>

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
              <label className="settings-row settings-slider">
                <span>{t("fontScale")}</span>
                <input
                  type="range"
                  min={0.75}
                  max={1.5}
                  step={0.05}
                  value={settings.fontScale}
                  onChange={(event) =>
                    onSettingsChange({
                      ...settings,
                      fontScale: Math.round(Number(event.target.value) * 100) / 100,
                    })
                  }
                />
                <output>{Math.round(settings.fontScale * 100)}%</output>
                {settings.fontScale !== 1 && (
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => onSettingsChange({ ...settings, fontScale: 1 })}
                    title={t("resetFontScale")}
                    style={{ marginLeft: 8 }}
                  >
                    <RotateCcw style={{ width: 12, height: 12 }} />
                  </button>
                )}
              </label>
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
                      pages: plugin.pages?.length ?? 0,
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

        {tab === "network" && session && onSessionChange && (
          <NetworkSettingsSection
            session={session}
            services={networkServices ?? CORE_NETWORK_SERVICES}
            onSessionChange={onSessionChange}
          />
        )}
      </div>
    </section>
  );
}

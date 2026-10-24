import { Box, Globe, Languages, Plug, RotateCcw } from "lucide-react";
import type { NetworkServiceOverride, RobotSessionConfig } from "../core/appConfig";
import { CORE_NETWORK_SERVICES, resolveBaseHost, resolveServiceUrl } from "../core/appConfig";
import type { LayoutConfig } from "../core/layoutConfig";
import type { PluginContext, PluginServiceDefinition, RobvizPlugin } from "../plugins/types";
import type { Theme } from "../renderers/sceneTheme";
import { useI18n } from "./i18n";
import { NumberInput } from "./EditableInput";
import { ErrorBoundary } from "./ErrorBoundary";
import { PluginPackages } from "./PluginPackages";

type Settings = LayoutConfig["settings"];
export type SettingsTab = string;

function NetworkSettingsSection({ session, services, onSessionChange }: {
  session: RobotSessionConfig;
  services: PluginServiceDefinition[];
  onSessionChange: (session: RobotSessionConfig) => void;
}) {
  const { t } = useI18n();
  const baseHost = resolveBaseHost(session.url);
  const updateOverride = (serviceId: string, patch: Partial<NetworkServiceOverride>) => {
    const currentOverrides = session.networkOverrides ?? {};
    const updated = { ...(currentOverrides[serviceId] ?? {}), ...patch };
    if (!updated.host?.trim()) delete updated.host;
    if (updated.port === undefined || isNaN(updated.port) || updated.port <= 0) delete updated.port;
    if (!updated.url?.trim()) delete updated.url;
    const nextOverrides = { ...currentOverrides };
    if (Object.keys(updated).length === 0) delete nextOverrides[serviceId];
    else nextOverrides[serviceId] = updated;
    onSessionChange({ ...session, networkOverrides: nextOverrides });
  };
  const clearOverride = (serviceId: string) => {
    if (!session.networkOverrides?.[serviceId]) return;
    const nextOverrides = { ...session.networkOverrides };
    delete nextOverrides[serviceId];
    onSessionChange({ ...session, networkOverrides: nextOverrides });
  };
  return <div className="settings-network">
    <div className="network-base-card">
      <div><span>{t("baseRobotHost")}: </span><strong>{baseHost}</strong></div>
      <small>({t("derivedFromSessionUrl")}: <code>{session.url}</code>)</small>
    </div>
    <p className="settings-hint">{t("networkHint")}</p>
    <div className="network-services-list">
      {services.map((service) => {
        const override = session.networkOverrides?.[service.id];
        const hasOverride = !!override && (override.port !== undefined || !!override.host || !!override.url);
        return <div key={service.id} className="network-service-card">
          <div className="network-service-main">
            <div className="network-service-title">
              <strong>{service.label}</strong><span className="network-tag">{service.protocol.toUpperCase()}</span>
              <span className="network-port-tag">:{service.defaultPort}</span>
            </div>
            {service.description && <p className="network-service-desc">{service.description}</p>}
            <div className="network-effective"><span>{t("effectiveTarget")}: </span><code>{resolveServiceUrl(service, session)}</code></div>
          </div>
          <div className="network-service-inputs">
            <label className="network-input-group"><span>{t("hostOverride")}</span>
              <input type="text" placeholder={baseHost} value={override?.host ?? ""} onChange={(event) => updateOverride(service.id, { host: event.target.value })} />
            </label>
            <label className="network-input-group"><span>{t("portOverride")}</span>
              <NumberInput required={false} min={1} max={65535} placeholder={String(service.defaultPort)} value={override?.port}
                onValueChange={(value) => updateOverride(service.id, { port: value })} />
            </label>
            {hasOverride && <button type="button" className="chip-btn" onClick={() => clearOverride(service.id)} title={t("resetToDefault")}>
              <RotateCcw style={{ width: 12, height: 12 }} /><span>{t("resetToDefault")}</span>
            </button>}
          </div>
        </div>;
      })}
    </div>
  </div>;
}

export function SettingsPage({ tab, settings, session, networkServices, onSessionChange, theme, plugins,
  onTabChange, onSettingsChange, onThemeChange, onPluginToggle, onResetLayout, ctx }: {
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
  ctx: PluginContext;
}) {
  const { t } = useI18n();
  const disabled = new Set(settings.disabledPluginIds);
  const extensions = plugins.filter((plugin) => !disabled.has(plugin.id)).flatMap((plugin) => (plugin.settings ?? []).map((section) => ({
    ...section, id: `${plugin.id}:${section.id}`,
    label: typeof section.title === "function" ? section.title(ctx) : section.title,
  })));
  const extension = extensions.find((section) => section.id === tab);
  return <section className="settings-page">
    <nav className="settings-nav" aria-label={t("settings")}>
      <button className={tab === "general" ? "active" : ""} onClick={() => onTabChange("general")}><Languages /> {t("general")}</button>
      <button className={tab === "3d" ? "active" : ""} onClick={() => onTabChange("3d")}><Box /> {t("threeD")}</button>
      {extensions.map((section) => <button key={section.id} className={tab === section.id ? "active" : ""} onClick={() => onTabChange(section.id)}><Plug /> {section.label}</button>)}
      <button className={tab === "plugins" ? "active" : ""} onClick={() => onTabChange("plugins")}><Plug /> {t("plugins")}</button>
      <button className={tab === "network" ? "active" : ""} onClick={() => onTabChange("network")}><Globe /> {t("network")}</button>
    </nav>
    <div className="settings-content">
      <h1>{extension?.label ?? (tab === "general" ? t("general") : tab === "3d" ? t("threeD") : tab === "network" ? t("networkSettings") : t("plugins"))}</h1>
      {tab === "general" && <>
        <section className="settings-section">
          <h2>{t("language")}</h2>
          <label className="settings-row"><span>{t("language")}</span>
            <select value={settings.language} onChange={(event) => onSettingsChange({ ...settings, language: event.target.value as Settings["language"] })}>
              <option value="zh-CN">简体中文</option><option value="en">English</option>
            </select>
          </label>
        </section>
        <section className="settings-section">
          <h2>{t("appearance")}</h2>
          <div className="settings-row"><span>{t("theme")}</span><div className="segmented-control">
            <button className={theme === "dark" ? "active" : ""} onClick={() => onThemeChange("dark")}>{t("dark")}</button>
            <button className={theme === "light" ? "active" : ""} onClick={() => onThemeChange("light")}>{t("light")}</button>
          </div></div>
          <label className="settings-row settings-slider"><span>{t("fontScale")}</span>
            <input type="range" min={.75} max={1.5} step={.05} value={settings.fontScale}
              onChange={(event) => onSettingsChange({ ...settings, fontScale: Math.round(Number(event.target.value) * 100) / 100 })} />
            <output>{Math.round(settings.fontScale * 100)}%</output>
            {settings.fontScale !== 1 && <button type="button" className="chip-btn" onClick={() => onSettingsChange({ ...settings, fontScale: 1 })} title={t("resetFontScale")} style={{ marginLeft: 8 }}><RotateCcw style={{ width: 12, height: 12 }} /></button>}
          </label>
        </section>
      </>}
      {tab === "3d" && <>
        <section className="settings-section">
          <h2>{t("scene")}</h2>
          <label className="settings-row settings-toggle"><span><strong>{t("ground")}</strong><small>{t("groundHint")}</small></span>
            <input type="checkbox" checked={settings.groundVisible} onChange={(event) => onSettingsChange({ ...settings, groundVisible: event.target.checked })} />
          </label>
          <label className="settings-row settings-slider"><span>{t("axesWidth")}</span>
            <input type="range" min={1} max={6} step={.5} value={settings.tfAxesLineWidth} onChange={(event) => onSettingsChange({ ...settings, tfAxesLineWidth: Number(event.target.value) })} />
            <output>{settings.tfAxesLineWidth.toFixed(1)} px</output>
          </label>
        </section>
        <section className="settings-section"><h2>{t("layout")}</h2><button className="settings-command" onClick={onResetLayout}><RotateCcw /> {t("resetLayout")}</button></section>
      </>}
      {extension && <ErrorBoundary key={extension.id} name={extension.id}><extension.component ctx={ctx} /></ErrorBoundary>}
      {tab === "plugins" && <section className="settings-section plugin-settings">
        <PluginPackages />
        <p className="settings-hint">{t("pluginBundledHint")}</p>
        {plugins.map((plugin) => {
          const enabled = !disabled.has(plugin.id);
          return <label className="plugin-setting-row" key={plugin.id}>
            <span className="plugin-setting-copy"><strong>{plugin.name}</strong><code>{plugin.id}</code>
              <small>{t("pluginExtensions", { pages: plugin.pages?.length ?? 0, panels: plugin.panels?.length ?? 0,
                sections: plugin.sections?.length ?? 0, displays: plugin.displays?.length ?? 0, tools: plugin.viewportTools?.length ?? 0 })}</small>
            </span>
            <span className="plugin-setting-toggle">{enabled ? t("enabled") : t("disabled")}
              <input type="checkbox" checked={enabled} onChange={(event) => onPluginToggle(plugin.id, event.target.checked)} />
            </span>
          </label>;
        })}
      </section>}
      {tab === "network" && session && onSessionChange && <NetworkSettingsSection session={session} services={networkServices ?? CORE_NETWORK_SERVICES} onSessionChange={onSessionChange} />}
    </div>
  </section>;
}

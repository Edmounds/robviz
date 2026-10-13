import { Eraser } from "lucide-react";

import type { PointCloudSettings } from "../core/layoutConfig";
import { useI18n } from "../app/i18n";
import { NumberInput } from "../app/EditableInput";

export function PointCloudSettingsPanel({
  settings,
  colorField,
  autoRange,
  onChange,
  onClear,
}: {
  settings: PointCloudSettings;
  colorField?: string;
  autoRange: [number, number];
  onChange: (settings: PointCloudSettings) => void;
  onClear: () => void;
}) {
  const { t } = useI18n();
  const patch = (next: Partial<PointCloudSettings>) => onChange({ ...settings, ...next });
  const manualRange = settings.rangeMode === "manual";

  return (
    <details className="cloud-settings">
      <summary>{t("pointCloudSettings")}</summary>
      <label className="cloud-control">
        <span>{t("pointSize")} <output>{settings.pointSize.toFixed(1)} px</output></span>
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          value={settings.pointSize}
          onChange={(event) => patch({ pointSize: Number(event.target.value) })}
        />
      </label>
      <label className="cloud-control">
        <span>{t("opacity")} <output>{Math.round(settings.opacity * 100)}%</output></span>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={settings.opacity}
          onChange={(event) => patch({ opacity: Number(event.target.value) })}
        />
      </label>
      <label className="cloud-select-row">
        <span>{t("coloring")}</span>
        <select
          value={settings.colorMode}
          onChange={(event) => patch({ colorMode: event.target.value as PointCloudSettings["colorMode"] })}
        >
          <option value="field">{t("field")}{colorField ? ` (${colorField})` : ""}</option>
          <option value="height">{t("heightZ")}</option>
          <option value="flat">{t("solid")}</option>
        </select>
      </label>
      {settings.colorMode === "flat" ? (
        <label className="cloud-select-row">
          <span>{t("color")}</span>
          <input
            className="color-swatch"
            type="color"
            value={settings.flatColor}
            onChange={(event) => patch({ flatColor: event.target.value })}
          />
        </label>
      ) : (
        <>
          <label className="cloud-select-row">
            <span>{t("colorRange")}</span>
            <select
              value={settings.rangeMode}
              onChange={(event) => {
                const rangeMode = event.target.value as PointCloudSettings["rangeMode"];
                patch(
                  rangeMode === "manual"
                    ? { rangeMode, rangeMin: autoRange[0], rangeMax: autoRange[1] }
                    : { rangeMode, rangeMin: undefined, rangeMax: undefined },
                );
              }}
            >
              <option value="auto">{t("auto")}</option>
              <option value="manual">{t("manual")}</option>
            </select>
          </label>
          {manualRange && (
            <div className="cloud-range-row">
              <NumberInput
                step="any"
                aria-label={t("rangeMin")}
                value={settings.rangeMin ?? autoRange[0]}
                onValueChange={(value) => { if (value !== undefined) patch({ rangeMin: value }); }}
              />
              <span>{t("to")}</span>
              <NumberInput
                step="any"
                aria-label={t("rangeMax")}
                value={settings.rangeMax ?? autoRange[1]}
                onValueChange={(value) => { if (value !== undefined) patch({ rangeMax: value }); }}
              />
            </div>
          )}
        </>
      )}
      <div className="cloud-actions">
        <label className="sub-option compact">
          <input
            type="checkbox"
            checked={settings.accumulate}
            onChange={(event) => patch({ accumulate: event.target.checked })}
          />
          {t("accumulate")}
        </label>
        <button type="button" onClick={onClear} title={t("clearAccumulated")}><Eraser /> {t("clear")}</button>
      </div>
    </details>
  );
}

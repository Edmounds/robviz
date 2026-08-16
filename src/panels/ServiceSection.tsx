import { Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import type { WorkerBridge } from "../bridge/WorkerBridge";
import type { ServiceInfo } from "../core/FoxgloveConnection";
import { defaultsFromSchema } from "../core/msgDefaults";
import {
  defaultServiceFieldValue,
  describeServiceSchema,
  setServiceValue,
  type ServiceField,
} from "../core/serviceSchema";
import { CollapsibleSection } from "../app/CollapsibleSection";
import { useI18n } from "../app/i18n";

type ValuePath = readonly (string | number)[];

function valueAt(root: unknown, path: ValuePath): unknown {
  let current = root;
  for (const key of path) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string | number, unknown>)[key];
  }
  return current;
}

function ScalarInput({
  field,
  value,
  disabled,
  onChange,
}: {
  field: ServiceField;
  value: unknown;
  disabled: boolean;
  onChange: (value: unknown) => void;
}) {
  if (field.kind === "boolean") {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    );
  }
  return (
    <input
      type={field.kind === "number" ? "number" : "text"}
      value={field.kind === "number" ? Number(value ?? 0) : String(value ?? "")}
      disabled={disabled}
      step={field.kind === "number" ? "any" : undefined}
      onChange={(event) =>
        onChange(field.kind === "number" ? Number(event.target.value) : event.target.value)
      }
    />
  );
}

function ServiceFieldEditor({
  field,
  path,
  request,
  disabled,
  onChange,
}: {
  field: ServiceField;
  path: ValuePath;
  request: Record<string, unknown>;
  disabled: boolean;
  onChange: (path: ValuePath, value: unknown) => void;
}) {
  const { t } = useI18n();
  const value = valueAt(request, path);
  if (field.array !== "none") {
    const items = Array.isArray(value) ? value : [];
    return (
      <fieldset className="service-group">
        <legend>{field.name} <span>{field.type}[]</span></legend>
        {items.map((item, index) => {
          const itemPath = [...path, index];
          return (
            <div className="service-array-row" key={index}>
              <span className="service-index">{index}</span>
              {field.kind === "message" ? (
                <div className="service-nested">
                  {(field.children ?? []).map((child) => (
                    <ServiceFieldEditor
                      key={child.name}
                      field={child}
                      path={[...itemPath, child.name]}
                      request={request}
                      disabled={disabled}
                      onChange={onChange}
                    />
                  ))}
                </div>
              ) : (
                <ScalarInput field={field} value={item} disabled={disabled} onChange={(next) => onChange(itemPath, next)} />
              )}
              {field.array === "dynamic" && (
                <button
                  className="icon-action"
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(path, items.filter((_, itemIndex) => itemIndex !== index))}
                  title={t("deleteArrayItem")}
                  aria-label={t("deleteArrayItemLabel", { name: field.name, index: index + 1 })}
                ><Minus /></button>
              )}
            </div>
          );
        })}
        {field.array === "dynamic" && (
          <button
            className="service-add-item"
            type="button"
            disabled={disabled}
            onClick={() => {
              const single = { ...field, array: "none" as const };
              onChange(path, [...items, defaultServiceFieldValue(single)]);
            }}
          ><Plus /> {t("addItem")}</button>
        )}
      </fieldset>
    );
  }

  if (field.kind === "message") {
    return (
      <fieldset className="service-group">
        <legend>{field.name} <span>{field.type}</span></legend>
        {(field.children ?? []).map((child) => (
          <ServiceFieldEditor
            key={child.name}
            field={child}
            path={[...path, child.name]}
            request={request}
            disabled={disabled}
            onChange={onChange}
          />
        ))}
      </fieldset>
    );
  }

  return (
    <label className="service-field">
      <span>{field.name}<small>{field.type}</small></span>
      <ScalarInput field={field} value={value} disabled={disabled} onChange={(next) => onChange(path, next)} />
    </label>
  );
}

function ResultValue({ name, value }: { name?: string; value: unknown }) {
  const { t } = useI18n();
  if (value != null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <details className="service-result-group" open>
        <summary>{name ?? t("response")} <span>{Array.isArray(value) ? t("itemCount", { count: entries.length }) : ""}</span></summary>
        {entries.map(([key, child]) => <ResultValue key={key} name={key} value={child} />)}
      </details>
    );
  }
  return (
    <div className="service-result-row">
      <span>{name}</span>
      <strong className={typeof value === "boolean" ? (value ? "success" : "failure") : ""}>
        {typeof value === "boolean" ? (value ? t("yes") : t("no")) : String(value ?? "null")}
      </strong>
    </div>
  );
}

export function ServiceSection({ bridge, services }: { bridge: WorkerBridge; services: ServiceInfo[] }) {
  const { t } = useI18n();
  const serviceSelectId = useId();
  const [selected, setSelected] = useState<string>();
  const [request, setRequest] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<unknown>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const service = services.find((item) => item.name === selected);

  useEffect(() => {
    if (!selected || service) return;
    setSelected(undefined);
    setRequest({});
    setResult(undefined);
    setError(undefined);
  }, [selected, service]);

  const schema = useMemo(
    () => {
      try {
        return { fields: describeServiceSchema(service?.requestSchema ?? "") };
      } catch {
        return { fields: [] as ServiceField[], error: t("serviceSchemaError") };
      }
    },
    [service?.requestSchema, t],
  );
  const fields = schema.fields;

  const selectService = useCallback((name: string) => {
    const item = services.find((candidate) => candidate.name === name);
    setSelected(item?.name);
    setResult(undefined);
    setError(undefined);
    if (!item) {
      setRequest({});
      return;
    }
    try {
      setRequest(defaultsFromSchema(item.requestSchema));
    } catch {
      setRequest({});
    }
  }, [services]);

  const call = useCallback(async () => {
    if (!selected || busy) return;
    setBusy(true);
    setResult(undefined);
    setError(undefined);
    try {
      setResult(await bridge.callService(selected, request));
    } catch (callError) {
      setError(callError instanceof Error ? callError.message : String(callError));
    } finally {
      setBusy(false);
    }
  }, [bridge, busy, request, selected]);

  if (services.length === 0) return null;

  return (
    <CollapsibleSection title={t("services")}>
      <div className="service-picker">
        <label htmlFor={serviceSelectId}>{t("services")}</label>
        <select
          id={serviceSelectId}
          value={selected ?? ""}
          disabled={busy}
          onChange={(event) => selectService(event.target.value)}
        >
          <option value="">{t("chooseService")}</option>
          {services.map((item) => {
            const shortType = item.type.split("/").pop() || item.type;
            return <option key={item.name} value={item.name}>{item.name} ({shortType})</option>;
          })}
        </select>
      </div>
      {service && (
        <form className="service-form" onSubmit={(event) => { event.preventDefault(); void call(); }}>
          {fields.length === 0 ? <p className="service-empty">{t("noParameters")}</p> : fields.map((field) => (
            <ServiceFieldEditor
              key={field.name}
              field={field}
              path={[field.name]}
              request={request}
              disabled={busy}
              onChange={(path, value) => setRequest((current) => setServiceValue(current, path, value))}
            />
          ))}
          <button type="submit" disabled={busy || Boolean(schema.error)}>{busy ? t("calling") : t("call")}</button>
          {schema.error && <p className="service-error" role="alert">{schema.error}</p>}
          {error && <p className="service-error" role="alert">{error}</p>}
          {result !== undefined && <div className="service-result"><ResultValue value={result} /></div>}
        </form>
      )}
    </CollapsibleSection>
  );
}

/* oxlint-disable react/only-export-components -- input validation shares the input contract */
import { useEffect, useId, useImperativeHandle, useRef, useState, type InputHTMLAttributes, type Ref } from "react";

import { useI18n } from "./i18n";

/** Validate every related field, not just the first invalid field. */
export function validateInputs(scope: ParentNode | null): boolean {
  let first: HTMLInputElement | undefined;
  scope?.querySelectorAll<HTMLInputElement>("input[data-editable-input]").forEach((input) => {
    if (!input.checkValidity()) first ??= input;
  });
  first?.focus();
  return !first;
}

type TextProps = InputHTMLAttributes<HTMLInputElement> & { value: string; ref?: Ref<HTMLInputElement> };

export function TextInput({ onBlur, onKeyDown, onInvalid, onChange, ref, className = "", ...props }: TextProps) {
  const { locale } = useI18n();
  const id = useId();
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current!);
  const requiredMessage = locale === "en" ? "This field is required" : "此项不能为空";
  const message = (field: HTMLInputElement) => field.validity.valueMissing || (field.required && !field.value.trim())
    ? requiredMessage
    : locale === "en" ? "Enter a valid value" : "请输入有效值";
  const updateValidity = (field: HTMLInputElement) => {
    field.setCustomValidity(field.required && !field.value.trim() ? message(field) : "");
  };
  useEffect(() => {
    if (input.current) {
      input.current.setCustomValidity(props.required && !props.value.trim() ? requiredMessage : "");
      if (input.current.validity.valid) setError("");
    }
  }, [props.value, props.required, requiredMessage]);

  return <span className="editable-input-field">
    <input {...props} className={`rv-input ${className}`} ref={input} data-editable-input="" aria-invalid={!!error}
      aria-describedby={[props["aria-describedby"], error ? id : undefined].filter(Boolean).join(" ") || undefined}
      onChange={(event) => {
        updateValidity(event.currentTarget);
        if (event.currentTarget.validity.valid) setError("");
        onChange?.(event);
      }}
      onInvalid={(event) => { event.preventDefault(); setError(message(event.currentTarget)); onInvalid?.(event); }}
      onBlur={(event) => { updateValidity(event.currentTarget); event.currentTarget.checkValidity(); onBlur?.(event); }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.currentTarget.checkValidity()) {
          event.preventDefault(); event.stopPropagation(); return;
        }
        onKeyDown?.(event);
      }} />
    {error && <small id={id} className="editable-input-error" role="alert">{error}</small>}
  </span>;
}

type NumberProps = Omit<TextProps, "value" | "onChange" | "type"> & {
  value: number | undefined;
  onValueChange: (value: number | undefined) => void;
  onInvalidValue?: () => void;
};

/** Keep editing text separate from the last numeric value, including empty drafts. */
export function NumberInput({ value, onValueChange, onInvalidValue, required = true, step = "any", ...props }: NumberProps) {
  const format = (value: number | undefined) => value !== undefined && Number.isFinite(value) ? String(value) : "";
  const [draft, setDraft] = useState(() => format(value));
  const lastValue = useRef(value);
  useEffect(() => {
    if (!Object.is(value, lastValue.current)) {
      lastValue.current = value;
      setDraft(format(value));
    }
  }, [value]);

  return <TextInput {...props} type="number" step={step} required={required} value={draft}
    onChange={(event) => {
      const field = event.currentTarget;
      setDraft(field.value);
      if (field.validity.valid) {
        const next = field.value === "" ? undefined : field.valueAsNumber;
        lastValue.current = next;
        onValueChange(next);
      } else if (onInvalidValue) {
        lastValue.current = NaN;
        onInvalidValue();
      }
    }} />;
}

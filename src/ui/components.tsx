import { useId, type ButtonHTMLAttributes, type ComponentProps, type HTMLAttributes,
  type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
export { TextInput, NumberInput } from "../app/EditableInput";
export { Group as SplitGroup, Panel as SplitPanel };

export function Button({ variant = "default", selected, className = "", type = "button", ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "primary" | "danger";
    selected?: boolean;
  }) {
  return <button {...props} type={type} aria-pressed={selected ?? props["aria-pressed"]}
    className={`rv-button rv-button-${variant} ${selected ? "is-selected" : ""} ${className}`} />;
}

export function IconButton({ label, className = "", ...props }:
  ComponentProps<typeof Button> & { label: string }) {
  return <Button {...props} className={`rv-icon-button ${className}`} aria-label={label} title={props.title ?? label} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`rv-select ${className}`} />;
}

export function TextArea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`rv-textarea ${className}`} />;
}

export function Checkbox({ children, className = "", ...props }:
  Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { children: ReactNode }) {
  return <label className={`rv-checkbox ${className}`}><input {...props} type="checkbox" /><span>{children}</span></label>;
}

/** One labelled control. Preserve native label association for inputs and selects. */
export function Field({ label, hint, children, className = "", ...props }:
  HTMLAttributes<HTMLLabelElement> & { label: ReactNode; hint?: ReactNode }) {
  return <label {...props} className={`rv-field ${className}`}>
    <span className="rv-field-label">{label}</span>{children}
    {hint && <small className="rv-muted">{hint}</small>}
  </label>;
}

export function Page({ className = "", ...props }: ComponentProps<"div">) {
  return <div {...props} className={`rv-ui rv-page ${className}`} />;
}

/** Content only: Dockview continues to own docked panel titles and actions. */
export function PanelBody({ className = "", ...props }: ComponentProps<"div">) {
  return <div {...props} className={`rv-ui rv-panel-body ${className}`} />;
}

export function Toolbar({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`rv-ui rv-toolbar ${className}`} />;
}

export function ActionRow({ className = "", ...props }: ComponentProps<"div">) {
  return <div {...props} className={`rv-ui rv-actions ${className}`} />;
}

/** For sections inside standalone pages, not another frame inside Dockview. */
export function Section({ title, actions, children, className = "", ...props }:
  Omit<HTMLAttributes<HTMLElement>, "title"> & { title: ReactNode; actions?: ReactNode }) {
  const id = useId();
  return <section {...props} aria-labelledby={props["aria-labelledby"] ?? id} className={`rv-ui rv-section ${className}`}>
    <div className="rv-section-header"><h2 id={id}>{title}</h2>{actions}</div>
    <div className="rv-section-body">{children}</div>
  </section>;
}

export type StatusTone = "neutral" | "warning" | "error";

export function StatusBadge({ tone = "neutral", className = "", ...props }:
  HTMLAttributes<HTMLSpanElement> & { tone?: StatusTone }) {
  return <span {...props} className={`rv-status rv-tone-${tone} ${className}`} />;
}

export function Notice({ tone = "neutral", className = "", ...props }:
  HTMLAttributes<HTMLDivElement> & { tone?: StatusTone }) {
  return <div role={tone === "error" ? "alert" : "status"} {...props}
    className={`rv-notice rv-tone-${tone} ${className}`} />;
}

export function EmptyState({ className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={`rv-empty ${className}`} />;
}

export function SplitHandle({ className = "", ...props }: ComponentProps<typeof Separator>) {
  return <Separator {...props} className={`rv-split-handle ${className}`} />;
}

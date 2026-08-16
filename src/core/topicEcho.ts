import type { MessagePayload } from "../worker/protocol";

export interface EchoField {
  path: string;
  value: string;
}

const MAX_FIELDS = 256;
const MAX_DEPTH = 8;
const MAX_EXPANDED_ARRAY = 32;
const PREVIEW_ITEMS = 8;
const MAX_STRING_LENGTH = 240;

function formatScalar(value: unknown): string {
  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}… (${value.length} chars)`
      : value;
  }
  if (typeof value === "bigint") return value.toString();
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  return String(value);
}

function summarizeSequence(name: string, values: ArrayLike<unknown>): string {
  const preview = Array.from(
    { length: Math.min(values.length, PREVIEW_ITEMS) },
    (_, index) => formatScalar(values[index]),
  );
  return `${name}[${values.length}]${preview.length > 0 ? ` ${preview.join(", ")}` : ""}${
    values.length > PREVIEW_ITEMS ? ", …" : ""
  }`;
}

function containerSummary(value: object): string {
  if (ArrayBuffer.isView(value)) {
    if (value instanceof DataView) return `DataView[${value.byteLength}]`;
    const view = value as unknown as ArrayLike<unknown> & { constructor: { name: string } };
    return summarizeSequence(view.constructor.name, view);
  }
  if (value instanceof ArrayBuffer) return `ArrayBuffer[${value.byteLength}]`;
  if (Array.isArray(value)) return summarizeSequence("Array", value);
  if (value instanceof Date) return value.toISOString();
  return "{…}";
}

export function flattenEchoFields(value: unknown): EchoField[] {
  const fields: EchoField[] = [];
  const visiting = new WeakSet<object>();

  const add = (path: string, fieldValue: unknown) => {
    if (fields.length >= MAX_FIELDS) return;
    fields.push({ path: path || "$", value: formatScalar(fieldValue) });
  };

  const walk = (current: unknown, path: string, depth: number) => {
    if (fields.length >= MAX_FIELDS) return;
    if (current === null || typeof current !== "object") {
      add(path, current);
      return;
    }
    if (ArrayBuffer.isView(current) || current instanceof ArrayBuffer || current instanceof Date) {
      add(path, containerSummary(current));
      return;
    }
    if (visiting.has(current)) {
      add(path, "[Circular]");
      return;
    }
    if (depth >= MAX_DEPTH) {
      add(path, containerSummary(current));
      return;
    }
    if (Array.isArray(current)) {
      if (current.length === 0 || current.length > MAX_EXPANDED_ARRAY) {
        add(path, summarizeSequence("Array", current));
        return;
      }
      visiting.add(current);
      current.forEach((item, index) => walk(item, `${path}[${index}]`, depth + 1));
      visiting.delete(current);
      return;
    }

    const entries = Object.entries(current);
    if (entries.length === 0) {
      add(path, "{}");
      return;
    }
    visiting.add(current);
    for (const [key, child] of entries) {
      walk(child, path ? `${path}.${key}` : key, depth + 1);
      if (fields.length >= MAX_FIELDS) break;
    }
    visiting.delete(current);
  };

  walk(value, "", 0);
  return fields;
}

export function echoPayloadValue(payload: MessagePayload): unknown {
  if (payload.kind === "raw") return payload.message;
  const { kind: _kind, ...value } = payload;
  return value;
}

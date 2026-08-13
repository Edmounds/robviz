/** 从 ros2msg schema 文本生成默认消息对象（服务请求/发布面板预填用） */
import { parse } from "@foxglove/rosmsg";
import type { MessageDefinition, MessageDefinitionField } from "@foxglove/message-definition";

function defaultScalar(type: string): unknown {
  switch (type) {
    case "bool":
      return false;
    case "string":
    case "wstring":
      return "";
    default:
      return 0; // 全部数值类型
  }
}

function defaultForField(
  field: MessageDefinitionField,
  byName: Map<string, MessageDefinition>,
): unknown {
  if (field.isConstant) return undefined;
  const single = (): unknown => {
    if (field.isComplex) {
      const def = byName.get(field.type);
      return def ? defaultsFromDefinition(def, byName) : {};
    }
    return defaultScalar(field.type);
  };
  if (field.isArray) {
    const len = field.arrayLength ?? 0;
    return Array.from({ length: len }, single);
  }
  return single();
}

function defaultsFromDefinition(
  def: MessageDefinition,
  byName: Map<string, MessageDefinition>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of def.definitions) {
    if (field.isConstant) continue;
    out[field.name] = defaultForField(field, byName);
  }
  return out;
}

/** schema 为空（空请求）返回 {} */
export function defaultsFromSchema(schema: string): Record<string, unknown> {
  if (schema.trim().length === 0) return {};
  const defs = parse(schema, { ros2: true });
  const byName = new Map<string, MessageDefinition>();
  for (const d of defs) if (d.name) byName.set(d.name, d);
  const root = defs.find((d) => !d.name) ?? defs[0];
  return defaultsFromDefinition(root, byName);
}

import type { MessageDefinition, MessageDefinitionField } from "@foxglove/message-definition";
import { parse } from "@foxglove/rosmsg";

export type ServiceFieldKind = "boolean" | "number" | "string" | "message";
export type ServiceArrayKind = "none" | "fixed" | "dynamic";

export interface ServiceField {
  name: string;
  type: string;
  kind: ServiceFieldKind;
  array: ServiceArrayKind;
  arrayLength?: number;
  children?: ServiceField[];
}

function scalarKind(field: MessageDefinitionField): ServiceFieldKind {
  if (field.isComplex) return "message";
  if (field.type === "bool") return "boolean";
  if (field.type === "string" || field.type === "wstring") return "string";
  return "number";
}

function describeDefinition(
  definition: MessageDefinition,
  definitionsByName: Map<string, MessageDefinition>,
  stack: Set<string>,
): ServiceField[] {
  return definition.definitions
    .filter(
      (field) => !field.isConstant && field.name !== "structure_needs_at_least_one_member",
    )
    .map((field) => {
      const kind = scalarKind(field);
      const array: ServiceArrayKind = !field.isArray
        ? "none"
        : field.arrayLength == null
          ? "dynamic"
          : "fixed";
      let children: ServiceField[] | undefined;
      if (kind === "message" && !stack.has(field.type)) {
        const childDefinition = definitionsByName.get(field.type);
        if (childDefinition) {
          const childStack = new Set(stack).add(field.type);
          children = describeDefinition(childDefinition, definitionsByName, childStack);
        }
      }
      return {
        name: field.name,
        type: field.type,
        kind,
        array,
        ...(field.arrayLength == null ? {} : { arrayLength: field.arrayLength }),
        ...(children ? { children } : {}),
      };
    });
}

export function describeServiceSchema(schema: string): ServiceField[] {
  if (!schema.trim()) return [];
  const definitions = parse(schema, { ros2: true });
  const definitionsByName = new Map<string, MessageDefinition>();
  for (const definition of definitions) {
    if (definition.name) definitionsByName.set(definition.name, definition);
  }
  const root = definitions.find((definition) => !definition.name) ?? definitions[0];
  return root ? describeDefinition(root, definitionsByName, new Set()) : [];
}

function defaultSingle(field: ServiceField): unknown {
  if (field.kind === "boolean") return false;
  if (field.kind === "string") return "";
  if (field.kind === "number") return 0;
  return Object.fromEntries((field.children ?? []).map((child) => [child.name, defaultServiceFieldValue(child)]));
}

export function defaultServiceFieldValue(field: ServiceField): unknown {
  if (field.array === "dynamic") return [];
  if (field.array === "fixed") {
    return Array.from({ length: field.arrayLength ?? 0 }, () => defaultSingle(field));
  }
  return defaultSingle(field);
}

export function setServiceValue(
  value: Record<string, unknown>,
  path: readonly (string | number)[],
  nextValue: unknown,
): Record<string, unknown> {
  const update = (current: unknown, index: number): unknown => {
    if (index === path.length) return nextValue;
    const key = path[index];
    if (Array.isArray(current)) {
      const copy = [...current];
      copy[Number(key)] = update(copy[Number(key)], index + 1);
      return copy;
    }
    const copy = { ...((current as Record<string, unknown> | undefined) ?? {}) };
    copy[String(key)] = update(copy[String(key)], index + 1);
    return copy;
  };
  return update(value, 0) as Record<string, unknown>;
}

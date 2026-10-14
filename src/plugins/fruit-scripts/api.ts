import { z } from "zod";

export { runtimeRequest } from "../fruit-arm/api";

const parameterSchema = z.object({
  flag: z.string().optional(),
  choices: z.array(z.string()).min(1).optional(),
  default: z.union([z.string(), z.boolean()]).optional(),
  required: z.boolean().optional(),
});
export const runStatusSchema = z.object({
  id: z.string(), run_id: z.string(), state: z.enum(["RUNNING", "EXITED"]),
  exit_code: z.number().int().nullable(), pid: z.number().int().nullable(),
});
export type RunStatus = z.infer<typeof runStatusSchema>;
export const currentSchema = runStatusSchema.nullable();
export type Current = z.infer<typeof currentSchema>;
export const scriptSchema = z.object({
  id: z.string().min(1), script: z.string().min(1), note: z.string(),
  parameters: z.record(z.string(), parameterSchema),
  status: runStatusSchema.nullable().optional(),
});
export type Script = z.infer<typeof scriptSchema>;
export type Values = Record<string, string | boolean>;
const operationSchema = z.enum(["KILLING", "STARTING"]).nullable();
export const scriptsSchema = z.object({
  scripts: z.array(scriptSchema),
  runs: z.record(z.string(), runStatusSchema).optional().default({}),
  current: currentSchema,
  operation: operationSchema,
});
export const logSchema = z.object({
  id: z.string().optional(),
  current: currentSchema,
  operation: operationSchema,
  run_id: z.string(),
  cursor: z.number().int().nonnegative(),
  data: z.string(),
  reset: z.boolean(),
});
export const actionSchema = z.object({
  run: currentSchema.optional(),
  current: currentSchema.optional(),
});
export const storedSchema = z.object({
  values: z.record(z.string(), z.record(z.string(), z.union([z.string(), z.boolean()]))),
  layout: z.record(z.string(), z.number().finite().positive().lte(100)),
});

export function scriptArguments(script: Script, values: Values): string[] {
  const args: string[] = [];
  for (const [name, definition] of Object.entries(script.parameters)) {
    const saved = values[name];
    const value = definition.choices
      ? typeof saved === "string" && definition.choices.includes(saved) ? saved : definition.default
      : typeof saved === "boolean" ? saved : definition.default;
    const flag = definition.flag ?? "";
    if (definition.choices) {
      if (typeof value !== "string" || !definition.choices.includes(value)) {
        if (definition.required) throw new Error(`Choose ${name}`);
        continue;
      }
      if (flag.endsWith(":=")) args.push(flag + value);
      else if (flag) args.push(flag, value);
      else args.push(value);
    } else if (value === true) args.push(flag);
  }
  return args;
}

import { z } from "zod";
import { pluginIdSchema } from "./manifest";
import type { RobvizPlugin } from "./types";

const callable = z.custom<(...args: never[]) => unknown>((value) => typeof value === "function");
const title = z.union([z.string().min(1), callable]);
const component = z.custom((value) => typeof value === "function" || (
  value !== null && typeof value === "object" && "$$typeof" in value &&
  [Symbol.for("react.memo"), Symbol.for("react.forward_ref"), Symbol.for("react.lazy")].includes(value.$$typeof as symbol)
));
const definitionSchema = z.object({
  id: pluginIdSchema,
  name: z.string().min(1).max(160),
  sections: z.array(z.object({ id: pluginIdSchema, title: z.string().min(1), component })).optional(),
  panels: z.array(z.object({ kind: pluginIdSchema, title, component })).optional(),
  pages: z.array(z.object({ id: pluginIdSchema, title, component, legacyMode: pluginIdSchema.optional() })).optional(),
  toolbarTools: z.array(z.object({ id: pluginIdSchema, component })).optional(),
  settings: z.array(z.object({ id: pluginIdSchema, title, component })).optional(),
  displays: z.array(z.object({ schema: z.string().min(1), create: callable })).optional(),
  viewportTools: z.array(z.object({ id: pluginIdSchema, title, hint: title.optional(), onPoseSelect: callable })).optional(),
  services: z.array(z.object({
    id: pluginIdSchema, label: z.string().min(1), defaultPort: z.number().int().min(1).max(65535),
    protocol: z.enum(["http", "ws"]), description: z.string().optional(),
  })).optional(),
});

export function parsePluginDefinition(value: unknown, expectedId: string): RobvizPlugin {
  const plugin = definitionSchema.parse(value);
  if (plugin.id !== expectedId) throw new Error(`Plugin id ${plugin.id} does not match manifest ${expectedId}`);
  for (const entries of [plugin.sections, plugin.panels, plugin.pages, plugin.viewportTools, plugin.toolbarTools, plugin.settings]) {
    const ids = entries?.map((entry) => "id" in entry ? entry.id : entry.kind) ?? [];
    if (new Set(ids).size !== ids.length) throw new Error(`Duplicate extension id in ${expectedId}`);
  }
  return plugin as RobvizPlugin;
}

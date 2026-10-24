import { z } from "zod";

export const SDK_API_VERSION = 1;
export const pluginIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);
export const packagePathSchema = z.string().min(1).max(240).refine(
  (path) => /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(path) && path.split("/").every((part) => part && part !== "." && part !== ".."),
  "Expected a safe package-relative path",
);

export const pluginManifestSchema = z.object({
  id: pluginIdSchema,
  name: z.string().min(1).max(160),
  version: z.string().max(80).regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/),
  sdkApiVersion: z.literal(SDK_API_VERSION),
  entry: packagePathSchema.refine((path) => path.endsWith(".js"), "Entry must be an ESM .js file"),
  style: packagePathSchema.refine((path) => path.endsWith(".css")).optional(),
  files: z.array(packagePathSchema).min(1).max(256),
  requiredServices: z.array(z.object({ id: pluginIdSchema, protocolVersion: z.number().int().positive() }).strict()).max(32).default([]),
}).strict().superRefine((manifest, ctx) => {
  if (new Set(manifest.files).size !== manifest.files.length) {
    ctx.addIssue({ code: "custom", message: "Duplicate package file" });
  }
  if (!manifest.files.includes(manifest.entry) || (manifest.style && !manifest.files.includes(manifest.style))) {
    ctx.addIssue({ code: "custom", message: "Entry and style must be listed in files" });
  }
});

export type PluginManifest = z.infer<typeof pluginManifestSchema>;


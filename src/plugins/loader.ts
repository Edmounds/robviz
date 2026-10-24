import { z } from "zod";
import { pluginManifestSchema, type PluginManifest } from "./manifest";
import { parsePluginDefinition } from "./definition";
import type { RobvizPlugin } from "./types";

export interface PluginLoadReport {
  installed: PluginManifest[];
  errors: Array<{ id: string; error: string }>;
}

export const pluginLoadReport: PluginLoadReport = { installed: [], errors: [] };

const indexSchema = z.object({
  plugins: z.array(z.unknown()).max(128),
  errors: z.array(z.object({ id: z.string(), error: z.string() })).max(128).default([]),
});

async function importEntry(url: string) {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      import(/* @vite-ignore */ url),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Plugin import timed out")), 10_000); }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}

async function readIndex(url: URL): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000), cache: "no-store" });
  if (response.status === 404) return { plugins: [] };
  if (!response.ok || !response.body) throw new Error(`Plugin index HTTP ${response.status}`);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1024 * 1024) throw new Error("Plugin index is too large");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** Run once, before rendering App. Disabled entry modules are not evaluated. */
export async function loadInstalledPlugins(base: URL, disabledIds: Iterable<string>): Promise<RobvizPlugin[]> {
  const loaded: RobvizPlugin[] = [];
  const disabled = new Set(disabledIds);
  const seen = new Set<string>();
  try {
    const index = indexSchema.parse(await readIndex(new URL("index.json", base)));
    pluginLoadReport.errors.push(...index.errors);
    const results = await Promise.all(index.plugins.map(async (record) => {
      let id = "manifest";
      try {
        const manifest = pluginManifestSchema.parse(record);
        id = manifest.id;
        if (seen.has(manifest.id)) throw new Error("Duplicate installed plugin id");
        seen.add(manifest.id);
        pluginLoadReport.installed.push(manifest);
        if (disabled.has(manifest.id)) {
          return { id: manifest.id, name: manifest.name };
        }
        const entry = new URL(`${manifest.id}/${manifest.entry}`, base);
        entry.searchParams.set("v", manifest.version);
        const module = await importEntry(entry.href);
        const plugin = parsePluginDefinition(module.default, manifest.id);
        if (manifest.style) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          const style = new URL(`${manifest.id}/${manifest.style}`, base);
          style.searchParams.set("v", manifest.version);
          link.href = style.href;
          document.head.append(link);
        }
        return plugin;
      } catch (error) {
        pluginLoadReport.errors.push({ id, error: error instanceof Error ? error.message : String(error) });
        return undefined;
      }
    }));
    for (const plugin of results) if (plugin) loaded.push(plugin);
  } catch (error) {
    pluginLoadReport.errors.push({ id: "index", error: error instanceof Error ? error.message : String(error) });
  }
  for (const { id, error } of pluginLoadReport.errors) console.warn(`[plugins] ${id}: ${error}`);
  return loaded;
}

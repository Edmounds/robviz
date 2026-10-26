import { createReadStream } from "node:fs";
import { lstat, mkdir, mkdtemp, open, readFile, readdir, rename, rm } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { isIP } from "node:net";
import { resolve, join, extname } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { packagePathSchema, pluginIdSchema, pluginManifestSchema, type PluginManifest } from "../src/plugins/manifest.ts";
import { z } from "zod";

export const DEFAULT_PLUGIN_DIRECTORY = resolve(process.env.ROBVIZ_PLUGIN_DIR || "plugins");
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_PACKAGE_BYTES = 50 * 1024 * 1024;

async function syncDirectory(root: string) {
  const directory = await open(root, "r");
  try { await directory.sync(); } finally { await directory.close(); }
}

async function durableWrite(path: string, bytes: string | Buffer) {
  const file = await open(path, "wx", 0o600);
  try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
  await syncDirectory(resolve(path, ".."));
}

export const catalogSchema = z.object({
  sdkApiVersion: z.literal(1),
  plugins: z.array(z.object({
    id: pluginIdSchema, version: pluginManifestSchema.shape.version,
    directory: packagePathSchema,
    sha256: z.record(packagePathSchema, z.string().regex(/^[a-f0-9]{64}$/)),
  }).strict()).max(128),
}).strict().superRefine((catalog, ctx) => {
  if (new Set(catalog.plugins.map((plugin) => plugin.id)).size !== catalog.plugins.length) {
    ctx.addIssue({ code: "custom", message: "Duplicate catalog id" });
  }
});

/** Bound gh output and lifetime. Never log credentials or pass a shell command. */
async function github(endpoint: string, maximum: number, binary = false): Promise<Buffer> {
  return new Promise((accept, reject) => {
    const child = spawn("gh", ["api", "--hostname", "github.com", ...(binary ? ["-H", "Accept: application/octet-stream"] : []), endpoint], {
      env: { ...process.env, GH_PROMPT_DISABLED: "1" }, stdio: ["ignore", "pipe", "ignore"],
    });
    const chunks: Buffer[] = [];
    let bytes = 0;
    let failure: Error | undefined;
    const timer = setTimeout(() => { failure = new Error("GitHub download timed out"); child.kill(); }, 10_000);
    child.stdout.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > maximum) { failure = new Error("GitHub file is too large"); child.kill(); }
      else chunks.push(chunk);
    });
    child.on("error", () => { clearTimeout(timer); reject(new Error("GitHub CLI is unavailable")); });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (failure || code !== 0) reject(failure ?? new Error("GitHub download failed. Check configured source and gh authentication."));
      else accept(Buffer.concat(chunks));
    });
  });
}

async function source() {
  const repo = process.env.ROBVIZ_PLUGIN_REPO || "";
  const revision = process.env.ROBVIZ_PLUGIN_REF || "";
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo) || !/^[a-f0-9]{40}$/.test(revision)) {
    throw new Error("Configure ROBVIZ_PLUGIN_REPO and ROBVIZ_PLUGIN_REF (full commit SHA) on the server");
  }
  const release = process.env.ROBVIZ_PLUGIN_RELEASE;
  if (release) {
    if (!/^[A-Za-z0-9_.-]{1,80}$/.test(release)) throw new Error("Invalid configured release tag");
    const commit = JSON.parse((await github(`repos/${repo}/commits/${release}`, 1024 * 1024)).toString());
    if (commit.sha !== revision) throw new Error("Release tag does not match the pinned commit");
    const metadata = JSON.parse((await github(`repos/${repo}/releases/tags/${release}`, 1024 * 1024)).toString());
    const assets = z.array(z.object({ id: z.number().int().positive(), name: z.string(), size: z.number().int().nonnegative() })).max(1024).parse(metadata.assets);
    const asset = async (name: string) => {
      const matches = assets.filter((value) => value.name === name);
      if (matches.length !== 1 || matches[0].size > MAX_FILE_BYTES) throw new Error("Missing or oversized release asset");
      const bytes = await github(`repos/${repo}/releases/assets/${matches[0].id}`, MAX_FILE_BYTES, true);
      if (bytes.length !== matches[0].size) throw new Error("Incomplete release asset");
      return bytes;
    };
    const bytes = await asset("catalog.json");
    if (bytes.length > 1024 * 1024) throw new Error("Catalog is too large");
    const committed = JSON.parse((await github(`repos/${repo}/contents/catalog.json?ref=${revision}`, 2 * 1024 * 1024)).toString());
    if (committed.type !== "file" || committed.encoding !== "base64" || !Buffer.from(committed.content || "", "base64").equals(bytes)) {
      throw new Error("Release catalog differs from the pinned commit");
    }
    const catalog = catalogSchema.parse(JSON.parse(bytes.toString()));
    const read = async (file: string) => {
      const record = catalog.plugins.find((value) => file.startsWith(`${value.directory}/`));
      const hash = record?.sha256[file.slice(record.directory.length + 1)];
      if (!record || !hash) throw new Error("Undeclared release asset");
      return asset(`${record.id}-${hash}.bin`);
    };
    return { catalog, read, repo, revision };
  }
  const read = async (file: string): Promise<Buffer> => {
    packagePathSchema.parse(file);
    const record = JSON.parse((await github(`repos/${repo}/contents/${file}?ref=${revision}`, 36 * 1024 * 1024)).toString());
    if (record.type !== "file" || record.encoding !== "base64" || record.size > MAX_FILE_BYTES || typeof record.content !== "string") {
      throw new Error("GitHub resource must be a bounded regular file");
    }
    const bytes = Buffer.from(record.content, "base64");
    if (bytes.length !== record.size) throw new Error("Incomplete GitHub resource");
    return bytes;
  };
  const bytes = await read("catalog.json");
  if (bytes.length > 1024 * 1024) throw new Error("Catalog is too large");
  return { catalog: catalogSchema.parse(JSON.parse(bytes.toString())), read, repo, revision };
}

/** The OS releases this advisory lock even after process termination. */
export async function withPluginLock<T>(root: string, action: () => Promise<T>): Promise<T> {
  await mkdir(root, { recursive: true });
  const base = await lstat(root);
  if (!base.isDirectory() || base.isSymbolicLink()) throw new Error("Invalid plugin directory");
  const lock = join(root, ".write-lock");
  const info = await lstat(lock).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
  if (info?.isSymbolicLink()) throw new Error("Invalid lock file");
  const child = spawn("flock", ["-n", lock, process.execPath, "-e", 'process.stdout.write("locked");process.stdin.resume();'], { stdio: ["pipe", "pipe", "ignore"] });
  const exited = new Promise<void>((accept) => child.once("exit", () => accept()));
  await new Promise<void>((accept, reject) => {
    child.once("error", () => reject(new Error("flock is required for plugin management")));
    child.once("exit", () => reject(new Error("Plugin directory is locked")));
    child.stdout.once("data", () => accept());
  });
  try { return await action(); }
  finally { child.stdin.end(); await exited; }
}

async function exists(path: string) {
  try { await lstat(path); return true; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error; }
}

/** An interrupted directory swap always rolls back before serving packages. */
export async function recoverPluginTransaction(root: string) {
  const journal = join(root, ".transaction.json");
  if (!await exists(journal)) return;
  if ((await lstat(journal)).isSymbolicLink()) throw new Error("Invalid transaction journal");
  const tx = z.object({ id: pluginIdSchema, stage: z.string().regex(/^\.stage-[A-Za-z0-9]+$/), hadOld: z.boolean() }).strict()
    .parse(JSON.parse(await readFile(journal, "utf8")));
  const target = join(root, tx.id);
  const backup = join(root, `.previous-${tx.id}`);
  if (await exists(backup)) {
    await rm(target, { recursive: true, force: true });
    await rename(backup, target);
  } else if (!tx.hadOld) await rm(target, { recursive: true, force: true });
  await scanPlugins(root);
  await rm(join(root, tx.stage), { recursive: true, force: true });
  await rm(journal);
}

async function swapPackage(root: string, id: string, stage: string, remove = false) {
  const target = join(root, id);
  const backup = join(root, `.previous-${id}`);
  const journal = join(root, ".transaction.json");
  const hadOld = await exists(target);
  if (hadOld && (await lstat(target)).isSymbolicLink()) throw new Error("Invalid installed package");
  if (remove && !hadOld) throw new Error("Plugin is not installed");
  await rm(backup, { recursive: true, force: true }); // Only an already committed backup can remain here.
  await durableWrite(journal, JSON.stringify({ id, stage: stage.split("/").at(-1), hadOld }));
  try {
    if (hadOld) await rename(target, backup);
    if (!remove) await rename(join(stage, id), target);
    const index = await scanPlugins(root);
    if (!remove && index.errors.some((entry) => entry.id === id)) throw new Error("Installed package failed validation");
    await rm(journal); // Commit after package and index both succeeded.
    await syncDirectory(root);
  } catch (error) {
    await recoverPluginTransaction(root);
    throw error;
  }
  await rm(backup, { recursive: true, force: true });
}

/** Public installation protocol, also used by local fixture checks. Caller holds the directory lock. */
export async function installCatalogPlugin(root: string, catalogValue: unknown, idValue: string, read: (file: string) => Promise<Buffer>) {
  const id = pluginIdSchema.parse(idValue);
  const record = catalogSchema.parse(catalogValue).plugins.find((plugin) => plugin.id === id);
  if (!record || (record.directory !== id && record.directory !== `plugins/${id}`)) throw new Error("Plugin is absent from the configured catalog");
  const names = Object.keys(record.sha256);
  if (!names.includes("manifest.json") || names.length > 257) throw new Error("Invalid catalog file list");
  const stage = await mkdtemp(join(root, ".stage-"));
  try {
    await mkdir(join(stage, id));
    let total = 0;
    for (const file of names) {
      packagePathSchema.parse(file);
      const bytes = await read(`${record.directory}/${file}`);
      total += bytes.length;
      if (bytes.length > MAX_FILE_BYTES || total > MAX_PACKAGE_BYTES) throw new Error("Plugin is too large");
      if (createHash("sha256").update(bytes).digest("hex") !== record.sha256[file]) throw new Error("Plugin checksum mismatch");
      const target = join(stage, id, file);
      await mkdir(resolve(target, ".."), { recursive: true });
      await durableWrite(target, bytes);
    }
    const manifest = await readPackage(stage, id);
    if (manifest.version !== record.version || JSON.stringify([...manifest.files, "manifest.json"].sort()) !== JSON.stringify(names.sort())) {
      throw new Error("Manifest and catalog do not match");
    }
    await swapPackage(root, id, stage);
    return manifest;
  } finally { await rm(stage, { recursive: true, force: true }); }
}

function isLanOrLoopback(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname.endsWith(".local")) return true;
  const ipType = isIP(hostname);
  if (ipType === 4) {
    const parts = hostname.split(".").map(Number);
    return parts[0] === 10 || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168) || (parts[0] === 169 && parts[1] === 254) || parts[0] === 127;
  }
  if (ipType === 6) {
    const lower = hostname.toLowerCase();
    return lower === "::1" || lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd");
  }
  return false;
}

export function isLocalManagementRequest(req: IncomingMessage, write = false): boolean {
  const address = req.socket.remoteAddress || "";
  const cleanAddress = address.replace(/^::ffff:/, "");
  const isLoopback = cleanAddress === "127.0.0.1" || cleanAddress === "::1";
  if (write && !isLoopback && process.env.ROBVIZ_ALLOW_REMOTE_PLUGIN_MGMT !== "1") return false;

  const host = req.headers.host || "";
  let hostname = "";
  try {
    hostname = new URL(`http://${host}`).hostname.replace(/^\[|\]$/g, "");
  } catch {
    return false;
  }
  if (!isLanOrLoopback(hostname)) return false;

  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const originHost = parsed.hostname.replace(/^\[|\]$/g, "");
    return isLanOrLoopback(originHost) || parsed.host === host;
  } catch {
    return false;
  }
}

async function managePackages(root: string, req: IncomingMessage, res: ServerResponse) {
  const send = (status: number, value: unknown) => {
    res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    res.end(JSON.stringify(value));
  };
  try {
    const isWrite = req.method !== "GET" && req.method !== "HEAD";
    if (!isLocalManagementRequest(req, isWrite)) {
      return send(403, { error: "Plugin management is local or private network only. Writes require local access or SSH tunnel." });
    }
    const path = new URL(req.url || "/", "http://localhost").pathname;
    const address = (req.socket.remoteAddress || "").replace(/^::ffff:/, "");
    const isLoopback = address === "127.0.0.1" || address === "::1";
    const writable = isLoopback || process.env.ROBVIZ_ALLOW_REMOTE_PLUGIN_MGMT === "1";
    if (req.method === "GET" && path === "/") {
      return send(200, { directory: root, host: req.headers.host, writable, ...(await scanPlugins(root)) });
    }
    if (req.method === "GET" && path === "/catalog") {
      const { catalog, repo, revision } = await source();
      return send(200, { catalog, repo, revision });
    }
    if (req.method !== "POST" || req.headers["content-type"] !== "application/json") return send(405, { error: "Expected a JSON POST" });
    req.setTimeout(10_000, () => req.destroy());
    let body = "";
    for await (const chunk of req) {
      body += chunk.toString();
      if (Buffer.byteLength(body) > 4096) return send(413, { error: "Request is too large" });
    }
    const payload = JSON.parse(body);
    const result = await withPluginLock(root, async () => {
      await recoverPluginTransaction(root);
      if (path === "/scan") return scanPlugins(root);
      const id = pluginIdSchema.parse(payload.id);
      if (path === "/install") {
        const { catalog, read } = await source();
        return installCatalogPlugin(root, catalog, id, read);
      }
      if (path === "/uninstall") {
        const stage = await mkdtemp(join(root, ".stage-"));
        try { await swapPackage(root, id, stage, true); }
        finally { await rm(stage, { recursive: true, force: true }); }
        return { removed: id };
      }
      throw new Error("Unknown management operation");
    });
    send(200, result);
  } catch (error) { send(400, { error: error instanceof Error ? error.message : String(error) }); }
}

/** Check every path component. Package symlinks are never followed. */
export async function packageFile(root: string, id: string, file: string): Promise<string> {
  pluginIdSchema.parse(id);
  packagePathSchema.parse(file);
  let path = resolve(root);
  const base = await lstat(path);
  if (!base.isDirectory() || base.isSymbolicLink()) throw new Error("Invalid plugin directory");
  const parts = [id, ...file.split("/")];
  for (const [index, part] of parts.entries()) {
    path = join(path, part);
    const info = await lstat(path);
    if (info.isSymbolicLink()) throw new Error("Package symlinks are not allowed");
    if (index < parts.length - 1 ? !info.isDirectory() : !info.isFile()) throw new Error("Invalid package file");
    if (index === parts.length - 1 && info.size > MAX_FILE_BYTES) throw new Error("Package file is too large");
  }
  return path;
}

export async function readPackage(root: string, id: string): Promise<PluginManifest> {
  const manifestPath = await packageFile(root, id, "manifest.json");
  if ((await lstat(manifestPath)).size > 64 * 1024) throw new Error("Manifest is too large");
  const manifest = pluginManifestSchema.parse(JSON.parse(await readFile(manifestPath, "utf8")));
  if (manifest.id !== id) throw new Error("Package id does not match directory");
  let bytes = 0;
  for (const file of manifest.files) {
    const path = await packageFile(root, id, file);
    bytes += (await lstat(path)).size;
    if (bytes > MAX_PACKAGE_BYTES) throw new Error("Package is too large");
  }
  return manifest;
}

export async function scanPlugins(root = DEFAULT_PLUGIN_DIRECTORY) {
  await mkdir(root, { recursive: true });
  const base = await lstat(root);
  if (!base.isDirectory() || base.isSymbolicLink()) throw new Error("Invalid plugin directory");
  const plugins: PluginManifest[] = [];
  const errors: Array<{ id: string; error: string }> = [];
  const entries = await readdir(root, { withFileTypes: true });
  if (entries.filter((entry) => !entry.name.startsWith(".") && entry.name !== "index.json").length > 128) {
    throw new Error("Too many plugin packages");
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".") || entry.name === "index.json") continue;
    try {
      plugins.push(await readPackage(root, entry.name));
    } catch (error) {
      errors.push({ id: entry.name, error: error instanceof Error ? error.message : String(error) });
    }
  }
  const index = { plugins, errors };
  const text = JSON.stringify(index, null, 2);
  if (Buffer.byteLength(text) > 1024 * 1024) throw new Error("Plugin index is too large");
  const temporary = join(root, `.index-${randomUUID()}.tmp`);
  try {
    await durableWrite(temporary, text);
    await rename(temporary, join(root, "index.json"));
    await syncDirectory(root);
  } finally {
    await rm(temporary, { force: true });
  }
  return index;
}

const MIME: Record<string, string> = {
  ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".woff": "font/woff", ".woff2": "font/woff2", ".wasm": "application/wasm",
};

async function servePackage(root: string, req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end();
    return;
  }
  try {
    const path = new URL(req.url || "/", "http://localhost").pathname.slice(1);
    let file: string;
    if (path === "index.json") {
      file = join(root, "index.json");
      const info = await lstat(file);
      if (!info.isFile() || info.isSymbolicLink() || info.size > 1024 * 1024) throw new Error("Invalid index");
    } else {
      const [id, ...parts] = path.split("/");
      const manifest = await readPackage(root, id);
      const relative = parts.join("/");
      if (relative !== "manifest.json" && !manifest.files.includes(relative)) throw new Error("Undeclared package file");
      file = await packageFile(root, id, relative);
    }
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    if (req.method === "HEAD") res.end();
    else createReadStream(file).on("error", () => res.destroy()).pipe(res);
  } catch {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Plugin resource not found or invalid" }));
  }
}

export function pluginFilesPlugin(root = DEFAULT_PLUGIN_DIRECTORY): Plugin {
  return {
    name: "robviz-plugin-files",
    async configureServer(server) {
      await withPluginLock(root, async () => { await recoverPluginTransaction(root); await scanPlugins(root); });
      server.middlewares.use(`${server.config.base}plugin-management`, (req, res) => { void managePackages(root, req, res); });
      server.middlewares.use(`${server.config.base}plugins`, (req, res) => { void servePackage(root, req, res); });
    },
    async configurePreviewServer(server) {
      await withPluginLock(root, async () => { await recoverPluginTransaction(root); await scanPlugins(root); });
      server.middlewares.use(`${server.config.base}plugin-management`, (req, res) => { void managePackages(root, req, res); });
      server.middlewares.use(`${server.config.base}plugins`, (req, res) => { void servePackage(root, req, res); });
    },
  };
}

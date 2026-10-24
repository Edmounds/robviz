import { useEffect, useState } from "react";
import { Button, Notice, Toolbar } from "../ui";
import { pluginLoadReport } from "../plugins/loader";
import type { PluginManifest } from "../plugins/manifest";

interface Installed { directory: string; host: string; writable: boolean; plugins: PluginManifest[]; errors: Array<{ id: string; error: string }> }
interface Catalog { repo: string; revision: string; catalog: { plugins: Array<{ id: string; version: string }> } }

async function request(path = "", payload?: object) {
  const response = await fetch(new URL(`./plugin-management/${path}`, document.baseURI), {
    method: payload ? "POST" : "GET", headers: payload ? { "Content-Type": "application/json" } : {},
    body: payload ? JSON.stringify(payload) : undefined, signal: AbortSignal.timeout(120_000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

export function PluginPackages() {
  const [installed, setInstalled] = useState<Installed>();
  const [catalog, setCatalog] = useState<Catalog>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [changed, setChanged] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void request().then((value) => { if (!cancelled) setInstalled(value); }).catch(() => {
      if (!cancelled) setError("只读安装模式。复制插件并运行 npm run plugins:scan，然后刷新。管理写操作仅限本机或 SSH 转发。");
    });
    return () => { cancelled = true; };
  }, []);
  const action = async (path: string, id?: string) => {
    if (busy) return;
    if ((path === "install" || path === "uninstall") && !window.confirm(
      path === "install" ? `安装可信代码 ${id}？插件不在沙箱中运行。请先保存未保存的编辑内容。` : `卸载 ${id}？将保留浏览器中的插件状态。请先保存未保存的编辑内容。`)) return;
    setBusy(true);
    setError("");
    try {
      if (path === "catalog") setCatalog(await request("catalog"));
      else {
        await request(path, id ? { id } : {});
        setInstalled(await request());
        setChanged(true);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  };
  return <section className="settings-section">
    <h2>插件安装 / Plugin packages</h2>
    {installed && <p><code>{installed.host}</code> · <code>{installed.directory}</code></p>}
    <Toolbar>
      <Button disabled={busy || !installed} onClick={() => void action("scan")}>重新扫描</Button>
      <Button disabled={busy || !installed} onClick={() => void action("catalog")}>读取官方清单</Button>
      {changed && <Button onClick={() => { if (window.confirm("确认已保存编辑内容，然后刷新加载插件？")) window.location.reload(); }}>刷新生效</Button>}
    </Toolbar>
    {error && <Notice tone="warning">{error}</Notice>}
    {[...pluginLoadReport.errors, ...(installed?.errors ?? [])].map((value, i) => <Notice key={`${value.id}-${i}`} tone="error">{value.id}: {value.error}</Notice>)}
    {installed?.plugins.map((plugin) => <div className="settings-row" key={plugin.id}>
      <span>{plugin.name} <code>{plugin.id}@{plugin.version}</code></span>
      <Button disabled={busy} onClick={() => void action("uninstall", plugin.id)}>卸载</Button>
    </div>)}
    {catalog && <>
      <p><code>{catalog.repo}@{catalog.revision}</code></p>
      {catalog.catalog.plugins.map((plugin) => <div className="settings-row" key={plugin.id}>
        <span><code>{plugin.id}@{plugin.version}</code></span>
        <Button disabled={busy} onClick={() => void action("install", plugin.id)}>安装 / 升级</Button>
      </div>)}
    </>}
  </section>;
}

/** 服务调用：列出 bridge 广播的服务，JSON 请求体（按 schema 预填），显示响应 */
import { useCallback, useState } from "react";

import type { WorkerBridge } from "../bridge/WorkerBridge";
import type { ServiceInfo } from "../core/FoxgloveConnection";
import { defaultsFromSchema } from "../core/msgDefaults";

export function ServiceSection({
  bridge,
  services,
}: {
  bridge: WorkerBridge;
  services: ServiceInfo[];
}) {
  const [selected, setSelected] = useState<string>();
  const [reqText, setReqText] = useState("{}");
  const [result, setResult] = useState<string>();
  const [busy, setBusy] = useState(false);

  const pick = useCallback(
    (name: string) => {
      if (selected === name) {
        setSelected(undefined);
        return;
      }
      setSelected(name);
      setResult(undefined);
      const svc = services.find((s) => s.name === name);
      try {
        setReqText(JSON.stringify(defaultsFromSchema(svc?.requestSchema ?? ""), null, 1));
      } catch {
        setReqText("{}");
      }
    },
    [selected, services],
  );

  const call = useCallback(async () => {
    if (!selected) return;
    setBusy(true);
    setResult(undefined);
    try {
      const req = JSON.parse(reqText) as unknown;
      const res = await bridge.callService(selected, req);
      setResult(JSON.stringify(res, null, 1));
    } catch (err) {
      setResult(`错误: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }, [bridge, selected, reqText]);

  if (services.length === 0) return null;

  return (
    <div className="side-section">
      <h2>服务</h2>
      {services.map((s) => (
        <div key={s.name}>
          <button
            className={`topic-row ${selected === s.name ? "active" : ""}`}
            onClick={() => pick(s.name)}
          >
            <span className="check">{selected === s.name ? "▾" : "▸"}</span>
            <span className="name">{s.name}</span>
            <span className="schema">{s.type.split("/").pop()}</span>
          </button>
          {selected === s.name && (
            <div className="service-form">
              <textarea
                value={reqText}
                onChange={(e) => setReqText(e.target.value)}
                rows={Math.min(6, reqText.split("\n").length)}
                spellCheck={false}
              />
              <button onClick={call} disabled={busy}>
                {busy ? "调用中…" : "调用"}
              </button>
              {result && <pre className="service-result">{result}</pre>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

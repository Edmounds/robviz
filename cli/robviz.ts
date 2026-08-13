/**
 * RobViz CLI：让 AI agent（或人）在终端直接查询/操作机器人，替代原 MCP server。
 *
 * 用法：npm run cli -- <命令>，或 npx tsx cli/robviz.ts <命令>
 *
 *   topics                          列出话题与服务
 *   echo <topic> [-n N] [-t 秒]     订阅并输出 N 条消息（JSON，长数组截断）
 *   tf <parent> <child> [-t 秒]     查询 TF 位姿（含 yaw）
 *   pub <topic> <schema> [json]     发布消息（缺省字段自动补零）
 *   call <service> [json]           调用服务（缺省字段自动补零）
 *   screenshot [-o out.png]         截取 Web UI 3D 视图（需浏览器打开页面）
 *
 * 通用：--bridge ws://robot:8765（或环境变量 BRIDGE_URL）。
 * 输出一律 JSON 到 stdout；出错非零退出码 + stderr。
 */
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

import type { IWebSocket } from "@foxglove/ws-protocol";
import { WebSocket, WebSocketServer } from "ws";

import { FoxgloveConnection } from "../src/core/FoxgloveConnection";
import { defaultsFromSchema } from "../src/core/msgDefaults";
import { PUB_SCHEMAS } from "../src/core/rosSchemas";
import { TfBuffer } from "../src/core/TfBuffer";
import type { TFMessage } from "../src/core/types";
import { toSec } from "../src/core/types";

const HELP = `robviz - 终端直连 foxglove_bridge 的机器人调试 CLI

用法: npx tsx cli/robviz.ts <命令> [参数] [--bridge ws://robot:8765]

命令:
  topics                          列出话题（含类型）与可调用服务
  echo <topic> [-n N] [-t 秒]     订阅话题输出 N 条消息 (默认 1 条 / 5s 超时)
  tf <parent> <child> [-t 秒]     查询 child 在 parent 下的位姿（平移+四元数+yaw）
  pub <topic> <schema> [json]     发布消息，json 可只给部分字段（自动补零）
                                  如: pub /cmd_vel geometry_msgs/msg/Twist '{"linear":{"x":0.5}}'
  call <service> [json]           调用服务，json 可只给部分字段
  screenshot [-o out.png]         截取 Web UI 当前 3D 视图（需浏览器打开 RobViz 页面）

环境变量: BRIDGE_URL 默认 ws://localhost:8765；UI_CHANNEL_PORT 截图通道端口默认 8766
可发布类型: ${Object.keys(PUB_SCHEMAS).join(", ")}`;

const MAX_ARRAY = 100;

/** JSON 安全化：TypedArray → 数组（超长截断），BigInt → Number */
function sanitize(value: unknown): unknown {
  if (typeof value === "bigint") return Number(value);
  if (ArrayBuffer.isView(value)) {
    const arr = value as unknown as ArrayLike<number>;
    const out = Array.from({ length: Math.min(arr.length, MAX_ARRAY) }, (_, i) =>
      sanitize(arr[i]),
    );
    if (arr.length > MAX_ARRAY) out.push(`…(${arr.length} total, truncated)` as never);
    return out;
  }
  if (Array.isArray(value)) {
    const out = value.slice(0, MAX_ARRAY).map(sanitize);
    if (value.length > MAX_ARRAY) out.push(`…(${value.length} total, truncated)`);
    return out;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitize(v);
    return out;
  }
  return value;
}

function deepMerge(base: unknown, patch: unknown): unknown {
  if (
    base &&
    patch &&
    typeof base === "object" &&
    typeof patch === "object" &&
    !Array.isArray(base) &&
    !Array.isArray(patch)
  ) {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [k, v] of Object.entries(patch)) {
      out[k] = k in out ? deepMerge(out[k], v) : v;
    }
    return out;
  }
  return patch;
}

function print(value: unknown): void {
  console.log(JSON.stringify(value, null, 1));
}

function fail(message: string): never {
  console.error(`robviz: ${message}`);
  process.exit(1);
}

function parseJsonArg(text: string | undefined, what: string): Record<string, unknown> {
  if (!text) return {};
  try {
    const v = JSON.parse(text) as unknown;
    if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("须是 JSON 对象");
    return v as Record<string, unknown>;
  } catch (err) {
    fail(`${what} 不是合法 JSON 对象: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ---- 参数 ----

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    bridge: { type: "string" },
    count: { type: "string", short: "n" },
    timeout: { type: "string", short: "t" },
    output: { type: "string", short: "o" },
    port: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
});

const cmd = positionals[0];
if (!cmd || values.help) {
  console.log(HELP);
  process.exit(cmd ? 0 : 1);
}

const BRIDGE_URL = values.bridge ?? process.env.BRIDGE_URL ?? "ws://localhost:8765";
const timeoutSec = values.timeout ? Number(values.timeout) : 5;
if (!(timeoutSec > 0)) fail("--timeout 须为正数");

// ---- 数据面（与 Web UI 同一套核心库） ----

function openBridge(): FoxgloveConnection {
  return new FoxgloveConnection(BRIDGE_URL, {
    createWebSocket: (url, protocols) => new WebSocket(url, protocols) as unknown as IWebSocket,
    reconnectMs: 0,
  });
}

async function waitTopics(conn: FoxgloveConnection, timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (conn.topics.length === 0 && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 100));
  }
  if (conn.topics.length === 0) fail(`连不上 ${BRIDGE_URL} 或无话题（bridge 未运行?）`);
}

// ---- 子命令 ----

async function cmdTopics(): Promise<void> {
  const conn = openBridge();
  await waitTopics(conn);
  print({
    bridge: BRIDGE_URL,
    topics: conn.topics,
    services: conn.services.map((s) => ({ name: s.name, type: s.type })),
  });
}

async function cmdEcho(): Promise<void> {
  const topic = positionals[1] ?? fail("用法: echo <topic> [-n N] [-t 秒]");
  const count = values.count ? Number(values.count) : 1;
  if (!(count >= 1)) fail("-n 须 ≥ 1");
  const conn = openBridge();
  await waitTopics(conn);
  const messages: unknown[] = [];
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      unsub();
      resolve();
    }, timeoutSec * 1000);
    const unsub = conn.subscribe(topic, (message) => {
      messages.push(sanitize(message));
      if (messages.length >= count) {
        clearTimeout(timer);
        unsub();
        resolve();
      }
    });
  });
  if (messages.length === 0) fail(`${topic} 在 ${timeoutSec}s 内无消息`);
  print(messages);
}

async function cmdTf(): Promise<void> {
  const parent = positionals[1];
  const child = positionals[2];
  if (!parent || !child) fail("用法: tf <parent> <child> [-t 秒]");
  const conn = openBridge();
  await waitTopics(conn);
  const tf = new TfBuffer();
  let newest = 0;
  const unsubs = ["/tf", "/tf_static"].map((topic) =>
    conn.subscribe(topic, (message) => {
      for (const ts of (message as TFMessage).transforms) {
        const stamp = toSec(ts.header.stamp);
        if (stamp > newest) newest = stamp;
        tf.setTransform(ts.header.frame_id, ts.child_frame_id, stamp, ts.transform, topic === "/tf_static");
      }
    }),
  );
  const start = Date.now();
  let result: ReturnType<TfBuffer["lookup"]>;
  for (;;) {
    result = tf.lookup(parent, child, newest);
    if (result || Date.now() - start > timeoutSec * 1000) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  for (const u of unsubs) u();
  if (!result) fail(`无 TF ${parent} → ${child}（已知 frames: ${tf.frames().join(", ") || "无"}）`);
  const yaw = Math.atan2(
    2 * (result.rotation.w * result.rotation.z + result.rotation.x * result.rotation.y),
    1 - 2 * (result.rotation.y ** 2 + result.rotation.z ** 2),
  );
  print({ parent, child, ...(sanitize(result) as object), yaw_rad: yaw });
}

async function cmdPub(): Promise<void> {
  const topic = positionals[1];
  const schema = positionals[2];
  if (!topic || !schema) fail("用法: pub <topic> <schema> [json]");
  if (!(schema in PUB_SCHEMAS)) {
    fail(`不支持的类型 ${schema}，可用: ${Object.keys(PUB_SCHEMAS).join(", ")}`);
  }
  const patch = parseJsonArg(positionals[3], "message");
  const conn = openBridge();
  await waitTopics(conn);
  const full = deepMerge(defaultsFromSchema(PUB_SCHEMAS[schema]), patch);
  conn.publish(topic, schema, full);
  // 给底层发送留一拍
  await new Promise((r) => setTimeout(r, 200));
  print({ published: topic, schema, message: full });
}

async function cmdCall(): Promise<void> {
  const name = positionals[1] ?? fail("用法: call <service> [json]");
  const patch = parseJsonArg(positionals[2], "request");
  const conn = openBridge();
  await waitTopics(conn);
  const svc = conn.services.find((s) => s.name === name);
  if (!svc) fail(`服务不存在: ${name}（见 topics 命令输出）`);
  const full = deepMerge(defaultsFromSchema(svc.requestSchema), patch);
  const response = await conn.callService(name, full);
  print({ service: name, request: full, response: sanitize(response) });
}

async function cmdScreenshot(): Promise<void> {
  const port = values.port ? Number(values.port) : Number(process.env.UI_CHANNEL_PORT ?? 8766);
  const output = values.output ?? "robviz-shot.png";
  // 一次性起命令通道，等 Web UI 连上（UI 侧每 5s 重连，见 src/agent/uiChannel.ts）
  const wss = new WebSocketServer({ port });
  // UI 每 5s 重连一次通道，默认等 12s；显式 -t 时按给定值（测试用）
  const waitMs = (values.timeout ? timeoutSec : 12) * 1000;
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const overall = setTimeout(
      () => reject(new Error("等待 Web UI 连接超时（浏览器打开 RobViz 页面了吗?）")),
      waitMs,
    );
    wss.on("connection", (socket) => {
      socket.on("message", (data) => {
        try {
          const msg = JSON.parse(String(data)) as { ok: boolean; dataUrl?: string; error?: string };
          clearTimeout(overall);
          if (msg.ok && msg.dataUrl) resolve(msg.dataUrl);
          else reject(new Error(msg.error ?? "截图失败"));
        } catch {
          /* 忽略坏消息 */
        }
      });
      socket.send(JSON.stringify({ id: 1, op: "screenshot" }));
    });
    wss.on("error", (err) => {
      clearTimeout(overall);
      reject(err);
    });
  }).finally(() => wss.close());
  writeFileSync(output, Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ""), "base64"));
  print({ saved: output });
}

const commands: Record<string, () => Promise<void>> = {
  topics: cmdTopics,
  echo: cmdEcho,
  tf: cmdTf,
  pub: cmdPub,
  call: cmdCall,
  screenshot: cmdScreenshot,
};

const run = commands[cmd];
if (!run) {
  console.error(`robviz: 未知命令 "${cmd}"\n`);
  console.log(HELP);
  process.exit(1);
}

try {
  await run();
  process.exit(0);
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}

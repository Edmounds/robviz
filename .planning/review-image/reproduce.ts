// Historical pre-fix reproduction; assertions below intentionally expect broken behavior.
// Current checks: npx tsx .planning/review-image/fix-check.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { webRtcManager } from "../../src/media/WebRtcStreamClient";
import { createDefaultSession, parseAppConfig } from "../../src/core/appConfig";

class Socket {
  static OPEN = 1;
  static instances: Socket[] = [];
  readyState = 0;
  onopen?: () => void;
  onclose?: () => void;
  onerror?: () => void;
  onmessage?: (event: { data: string }) => void;
  sent: string[] = [];
  constructor(public url: string) { Socket.instances.push(this); }
  send(data: string) { this.sent.push(data); }
  close() { this.readyState = 3; this.onclose?.(); }
}
const originalSocket = globalThis.WebSocket;
globalThis.WebSocket = Socket as unknown as typeof WebSocket;
try {
  const url = "ws://review.local:8787/ws";
  const topic = "/review/image";
  const stopA = webRtcManager.watch(topic, url, "a", 10, () => {}, () => {});
  const socket = Socket.instances[0];
  socket.readyState = Socket.OPEN;
  socket.onopen?.();
  socket.close(); // Server-side close, while the panel is still mounted.
  const stopB = webRtcManager.watch(topic, url, "b", 10, () => {}, () => {});
  assert.equal(Socket.instances.length, 1);
  assert.equal(socket.readyState, 3);
  stopB();
  stopA();
  console.log("CONFIRMED: adding a viewer after signaling close reuses a dead socket.");
} finally {
  globalThis.WebSocket = originalSocket;
}

function parse(path: string) {
  return ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}
function locate(source: ts.SourceFile, predicate: (node: ts.Node) => boolean): ts.Node {
  let result: ts.Node | undefined;
  function visit(node: ts.Node) {
    if (predicate(node)) result = node;
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(result);
  return result;
}
function js(text: string) {
  return ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
}

const panel = parse("src/panels/ImagePanel.tsx");
const convert = locate(panel, (node) => ts.isFunctionDeclaration(node) && node.name?.text === "rawToRgba");
const rawToRgba = new Function(`${js(convert.getText(panel))}; return rawToRgba;`)();
const result = rawToRgba({ width: 2, height: 2, encoding: "rgb8", step: 8,
  data: new Uint8Array([1, 2, 3, 4, 5, 6, 90, 91, 7, 8, 9, 10, 11, 12, 92, 93]) });
assert.deepEqual(Array.from(result.rgba.slice(8, 11)), [90, 91, 7]);
console.log("CONFIRMED: padded RGB second-row pixel is [90,91,7], not [7,8,9].");

const app = parse("src/app/App.tsx");
const declaration = locate(app, (node) => ts.isVariableDeclaration(node) && node.name.getText(app) === "buildSessionConfig") as ts.VariableDeclaration;
const arrow = (declaration.initializer as ts.CallExpression).arguments[0];
const build = new Function("scope", `with(scope) { ${js(`const build = ${arrow.getText(app)};`)} return build(); }`);
const snapshot = build({
  session: { id: "review", name: "review", mediaUrl: "ws://custom:9999/ws", autoAddPluginSections: false },
  url: "ws://robot:8765", mode: "3d", fixedFrame: "map",
  settings: { groundVisible: true, tfAxesLineWidth: 1 },
  workspace: { urdfInspectorPercent: 35 }, pcdVoxel: 0.1, followFrame: undefined,
  desired: new Map(), pluginStates: {}, initializedPluginSectionIds: new Set(),
  panels: [], dockLayout: undefined, sceneRef: { current: null }, savedCameraRef: { current: undefined },
});
assert.equal(snapshot.mediaUrl, undefined);
console.log("CONFIRMED: the actual buildSessionConfig callback drops explicit mediaUrl.");

const oldSession = { ...createDefaultSession("old", "old"), panels: [{ id: "teleop", kind: "teleop" }] };
const restored = parseAppConfig(JSON.stringify({ version: 2, activeSessionId: "old", theme: "dark",
  settings: { language: "zh-CN", disabledPluginIds: [] }, sessions: [oldSession] }));
assert.equal(restored.sessions[0].panels[0].kind, "teleop");
assert.ok(!restored.sessions[0].panels.some((p) => p.kind === "plugin-section:teleop:teleop"));
console.log("CONFIRMED: restoring an old v2 workspace keeps the now-unrenderable teleop kind.");

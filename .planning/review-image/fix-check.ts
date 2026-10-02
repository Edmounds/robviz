// Source-extracted callback smoke checks; not a browser/playback test.
// Run: npx tsx .planning/review-image/fix-check.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { normalizeImage, requiresRawImage } from "../../src/core/image";
import { turbo } from "../../src/renderers/colormap";

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
function callback(node: ts.Node, source: ts.SourceFile, scope: object) {
  const js = ts.transpileModule(`const run = ${node.getText(source)};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function("scope", `with(scope) { ${js} return run; }`)(scope);
}

const app = parse("src/app/App.tsx");
const declaration = locate(app, (node) => ts.isVariableDeclaration(node) && node.name.getText(app) === "buildSessionConfig") as ts.VariableDeclaration;
const snapshotScope = {
  session: { id: "review", name: "review", mediaUrl: "ws://custom:9999/ws", autoAddPluginSections: false },
  url: "ws://robot:8765", mode: "3d", fixedFrame: "map",
  settings: { groundVisible: true, tfAxesLineWidth: 1 },
  workspace: { urdfInspectorPercent: 35 }, pcdVoxel: 0.1, followFrame: undefined,
  desired: new Map(), pluginStates: {}, initializedPluginSectionIds: new Set(),
  panels: [], dockLayout: undefined, sceneRef: { current: null }, savedCameraRef: { current: undefined },
};
const build = declaration.initializer as ts.CallExpression;
assert.equal(callback(build.arguments[0], app, snapshotScope)().mediaUrl, snapshotScope.session.mediaUrl);
assert.ok(build.arguments[1].getText(app).includes("session.mediaUrl"));
console.log("PASS: live snapshots preserve mediaUrl and respond to mediaUrl changes.");

const panel = parse("src/panels/ImagePanel.tsx");
const rawToRgba = callback(locate(panel, (node) => ts.isFunctionDeclaration(node) && node.name?.text === "rawToRgba"), panel, { turbo });
const pixelText = callback(locate(panel, (node) => ts.isFunctionDeclaration(node) && node.name?.text === "pixelText"), panel, {});
const packed = normalizeImage({ header: { stamp: { sec: 0, nanosec: 0 }, frame_id: "camera" },
  width: 2, height: 2, encoding: "rgb8", step: 8, is_bigendian: false,
  data: new Uint8Array([1, 2, 3, 4, 5, 6, 90, 91, 7, 8, 9, 10, 11, 12, 92, 93]) });
assert.deepEqual(Array.from(rawToRgba(packed).rgba.slice(8, 11)), [7, 8, 9]);
assert.equal(pixelText(packed, 0, 1), "RGB(7, 8, 9)");
const depth = normalizeImage({ ...packed, encoding: "16UC1", step: 4, is_bigendian: true,
  data: new Uint8Array([3, 232, 7, 208, 11, 184, 15, 160]) });
assert.equal(pixelText(depth, 0, 1), "3000 (3.000 m)");
console.log("PASS: normalized pixels match renderer and hover lookup for padded RGB and big-endian depth.");

function effect(containing: string) {
  return locate(panel, (node) => ts.isCallExpression(node) && node.expression.getText(panel) === "useEffect" &&
    node.arguments[0].getText(panel).includes(containing)) as ts.CallExpression;
}
const watchEffect = effect("webRtcManager.watch(");
const rawEffect = effect("bridge.subscribe(");
const fpsEffect = effect("webRtcManager.setFps(");
for (const node of [watchEffect, rawEffect, fpsEffect]) assert.ok(node.arguments[1].getText(panel).includes("active"));
for (const active of [false, true]) for (const activeWebRtc of [false, true]) for (const collapsed of [false, true]) {
  let watches = 0, raws = 0, fpsUpdates = 0, stops = 0, selectedWebRtc = true;
  let saved: unknown;
  let onStats: ((stats: object) => void) | undefined;
  const scope = {
    active, activeWebRtc, collapsed, topic: "/camera/image", mediaUrl: "ws://custom/ws", panelId: "panel",
    targetFpsRef: { current: 10 }, targetFps: 10, IMAGE_MAX_FREQUENCY: 10,
    videoRef: { current: { srcObject: null } }, canvasRef: { current: { getContext: () => ({}) } },
    frameRef: { current: null }, requiresRawImage,
    setWebRtcStats: () => {}, setUseWebRtc: (value: boolean) => { selectedWebRtc = value; },
    webRtcManager: {
      watch: (...args: unknown[]) => { watches++; onStats = args[5] as typeof onStats; return () => { stops++; }; },
      setFps: () => { fpsUpdates++; },
    },
    bridge: { subscribe: () => { raws++; return () => { stops++; }; } },
    useWebRtc: false, preferRawRef: { current: true },
    onTopicChange: (...args: unknown[]) => { saved = args; },
  };
  const stopVideo = callback(watchEffect.arguments[0], panel, scope)();
  const stopRaw = callback(rawEffect.arguments[0], panel, scope)();
  callback(fpsEffect.arguments[0], panel, scope)();
  assert.equal(watches, Number(active && activeWebRtc && !collapsed));
  assert.equal(raws, Number(active && !activeWebRtc && !collapsed));
  assert.equal(fpsUpdates, watches);
  onStats?.({ status: "error", statusText: "gateway unavailable" });
  assert.equal(selectedWebRtc, true); // unavailable color gateway must not force Raw
  onStats?.({ status: "error", sourceEncoding: "16UC1" });
  if (watches) assert.equal(selectedWebRtc, false);
  stopVideo?.(); stopRaw?.();
  assert.equal(stops, watches + raws);
  const persistEffect = effect("onTopicChange?.(");
  assert.ok(persistEffect.arguments[1].getText(panel).includes("useWebRtc"));
  callback(persistEffect.arguments[0], panel, scope)();
  assert.deepEqual(saved, ["/camera/image", true, false]);
}
console.log("PASS: inactive/collapsed media effects are suspended, cleanup runs, depth routing and transport persistence callbacks work.");

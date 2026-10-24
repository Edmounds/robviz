/* oxlint-disable react/only-export-components -- This isolated entry reloads instead of fast-refreshing. */
/** No robot connection. This page checks the real installed ESM package. */
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { Button } from "./index";
import { I18nProvider } from "../app/i18n";
import { loadInstalledPlugins, pluginLoadReport } from "../plugins/loader";
import type { PluginContext } from "../plugins/types";
import "../app/app.css";
import "../ui/ui.css";

const installed = await loadInstalledPlugins(new URL("./plugins/", document.baseURI), []);
const teleop = installed.find((plugin) => plugin.id === "teleop");
if (!teleop?.sections?.[0]) throw new Error(`Install teleop first: ${JSON.stringify(pluginLoadReport.errors)}`);
const Section = teleop.sections[0].component;
const importShared = (specifier: string) => import(/* @vite-ignore */ specifier);
const [react, dom, three, sdk] = await Promise.all(["react", "react-dom/client", "three", "@robviz/core"].map(importShared));
const identities = {
  react: react.default === React && react.useState === React.useState,
  reactDom: dom.createRoot === createRoot,
  three: three.Vector3 === THREE.Vector3,
  sdk: sdk.Button === Button,
};
const ctx = {
  active: true, connectionState: "closed", locale: "en", theme: "dark", topics: [], fixedFrame: "map",
  pluginStates: {}, onPluginStateChange: () => {}, getServiceUrl: () => "",
  bridge: {}, tf: {},
} as unknown as PluginContext; // Offline fixture. No Worker or robot transport is created.

function Check() {
  useEffect(() => {
    const result = { ...identities, offlineGuard: document.querySelector<HTMLButtonElement>(".teleop button")?.disabled === true };
    document.getElementById("result")!.textContent = JSON.stringify(result);
    document.body.dataset.runtimeCheck = Object.values(result).every(Boolean) ? "passed" : "failed";
  }, []);
  return <I18nProvider locale="en"><main className="rv-ui"><h1>Installed teleop SDK check</h1><pre id="result" /><Section ctx={ctx} /></main></I18nProvider>;
}

createRoot(document.getElementById("root")!).render(<Check />);
if (import.meta.hot) import.meta.hot.accept(() => window.location.reload());

import type { Plugin } from "vite";

const entries = {
  "@robviz/core": "src/sdk/index.ts",
  react: "src/sdk/runtime/react.ts",
  "react-dom": "src/sdk/runtime/react-dom.ts",
  "react-dom/client": "src/sdk/runtime/react-dom-client.ts",
  "react/jsx-runtime": "src/sdk/runtime/jsx-runtime.ts",
  "react/jsx-dev-runtime": "src/sdk/runtime/jsx-dev-runtime.ts",
  three: "src/sdk/runtime/three.ts",
};

export const runtimeInputs = Object.fromEntries(
  Object.entries(entries).map(([name, file]) => [name.replaceAll(/[/@]/g, "-"), file]),
);

export function sharedRuntimePlugin(): Plugin {
  return {
    name: "robviz-shared-runtime",
    transformIndexHtml: {
      order: "post",
      handler(_html, context) {
        const imports = Object.fromEntries(Object.entries(entries).map(([name, file]) => {
          if (!context.bundle) return [name, `./${file}`];
          const chunk = Object.values(context.bundle).find(
            (output) => output.type === "chunk" && output.facadeModuleId?.endsWith(`/${file}`) === true,
          );
          if (!chunk || chunk.type !== "chunk") throw new Error(`Missing shared runtime entry: ${name}`);
          return [name, `./${chunk.fileName}`];
        }));
        return [{ tag: "script", attrs: { type: "importmap" }, children: JSON.stringify({ imports }), injectTo: "head-prepend" }];
      },
    },
  };
}

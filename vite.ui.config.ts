import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// This preview never starts a terminal gateway or a robot connection.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@robviz/core": new URL("./src/sdk/index.ts", import.meta.url).pathname } },
  server: { host: "127.0.0.1", port: 5174, strictPort: true },
});

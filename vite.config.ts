import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

import { startTerminalGateway, type TerminalGatewayHandle } from "./terminal/server.ts";

const DEFAULT_TERMINAL_GATEWAY_PORT = 8767;
const configuredTerminalGatewayPort = Number(process.env.ROBVIZ_TERMINAL_GATEWAY_PORT);
const TERMINAL_GATEWAY_PORT =
  Number.isInteger(configuredTerminalGatewayPort) && configuredTerminalGatewayPort > 0 && configuredTerminalGatewayPort <= 65_535
    ? configuredTerminalGatewayPort
    : DEFAULT_TERMINAL_GATEWAY_PORT;
const TERMINAL_GATEWAY_URL = `ws://127.0.0.1:${TERMINAL_GATEWAY_PORT}`;

function isAddressInUse(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "EADDRINUSE"
  );
}

export function terminalGatewayPlugin(): Plugin {
  let gateway: TerminalGatewayHandle | undefined;

  const closeGateway = async (): Promise<void> => {
    const current = gateway;
    gateway = undefined;
    await current?.close();
  };

  return {
    name: "robviz-terminal-gateway",
    apply: "serve",
    async configureServer(server) {
      try {
        gateway = await startTerminalGateway({ port: TERMINAL_GATEWAY_PORT });
        server.config.logger.info(`RobViz terminal gateway listening on ${gateway.url}`);
      } catch (error) {
        if (!isAddressInUse(error)) throw error;
        server.config.logger.warn(`RobViz terminal gateway already running at ${TERMINAL_GATEWAY_URL}; reusing it`);
      }

      server.httpServer?.once("close", () => {
        void closeGateway();
      });
    },
    async closeBundle() {
      await closeGateway();
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), terminalGatewayPlugin()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});

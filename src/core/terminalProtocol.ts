import { z } from "zod";

const terminalSizeSchema = {
  cols: z.number().int().min(20).max(500),
  rows: z.number().int().min(5).max(200),
};

export const terminalClientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("open"),
    bridgeUrl: z.string().max(2048),
    username: z.string().max(64),
    password: z
      .string()
      .max(1024)
      .refine((value) => !/[\r\n]/.test(value), "SSH password cannot contain newlines"),
    ...terminalSizeSchema,
  }),
  z.object({ type: z.literal("input"), data: z.string().max(65_536) }),
  z.object({ type: z.literal("resize"), ...terminalSizeSchema }),
  z.object({ type: z.literal("close") }),
]);

export type TerminalClientMessage = z.infer<typeof terminalClientMessageSchema>;

export const terminalServerMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ready"), host: z.string(), username: z.string() }),
  z.object({ type: z.literal("output"), data: z.string() }),
  z.object({ type: z.literal("exit"), exitCode: z.number().int(), signal: z.number().int() }),
  z.object({ type: z.literal("error"), code: z.string(), message: z.string() }),
]);

export type TerminalServerMessage = z.infer<typeof terminalServerMessageSchema>;

export function parseTerminalTarget(bridgeUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(bridgeUrl);
  } catch {
    throw new Error("Invalid Foxglove WebSocket URL");
  }
  if ((parsed.protocol !== "ws:" && parsed.protocol !== "wss:") || !parsed.hostname) {
    throw new Error("Invalid Foxglove WebSocket URL");
  }
  return parsed.hostname;
}

export function validateTerminalUsername(username: string): string {
  const value = username.trim();
  if (!/^[A-Za-z_][A-Za-z0-9._-]{0,63}$/.test(value)) {
    throw new Error("Invalid SSH username");
  }
  return value;
}

export function validateTerminalPassword(password: string): string {
  if (/[\r\n]/.test(password)) {
    throw new Error("Invalid SSH password");
  }
  return password;
}

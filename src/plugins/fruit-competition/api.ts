import { z } from "zod";

import { runtimeRequest } from "../fruit-arm/api";
export { runtimeRequest };

const moduleSchema = z.object({
  id: z.string(), label: z.string(),
  state: z.enum(["OK", "MISSING", "NO_DATA", "ERROR", "DISABLED", "STOPPED"]),
  detail: z.string(), last_received: z.number().nullable().optional(),
});

export const competitionSchema = z.object({
  run_id: z.string().optional(), pid: z.number().int().optional(),
  phase: z.string(), attempt: z.number().int().optional(),
  parameters: z.object({
    flow: z.enum(["full", "ac", "acb", "acbd", "a", "b", "c"]),
    open_loop: z.enum(["A", "C", "AC", "none"]),
    debug: z.boolean(),
  }).optional(),
  home: z.object({ success: z.boolean(), reason: z.string() }).nullable().optional(),
  error: z.string().optional(), updated_at: z.number().optional(),
  modules: z.record(z.string(), z.array(moduleSchema)).optional(),
  execution: z.record(z.string(), z.unknown()).optional(),
});
export type CompetitionStatus = z.infer<typeof competitionSchema>;

export async function getCompetitionStatus(base: string, signal?: AbortSignal) {
  return competitionSchema.parse(await runtimeRequest("competition/status", base, undefined, "GET", signal, 3000));
}

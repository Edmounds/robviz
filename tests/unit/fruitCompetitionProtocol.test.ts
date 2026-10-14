import { describe, expect, it } from "vitest";
import { competitionSchema } from "../../src/plugins/fruit-competition/api";

describe("competition status protocol", () => {
  it.each(["full", "acb"])("accepts the prepared %s route", (flow) => {
    const reply = competitionSchema.parse({
      phase: "PREPARED", parameters: { flow, open_loop: "none", debug: true },
    });
    expect(reply.parameters?.flow).toBe(flow);
    expect(reply.parameters?.debug).toBe(true);
  });

  it.each([
    { flow: "other", open_loop: "A", debug: false },
    { flow: "acb", open_loop: "other", debug: false },
    { flow: "acb", open_loop: "none", debug: "true" },
  ])("rejects invalid prepared parameters: %j", (parameters) => {
    expect(competitionSchema.safeParse({ phase: "PREPARED", parameters }).success).toBe(false);
  });

  it("accepts status before a competition has started", () => {
    expect(competitionSchema.parse({ phase: "STOPPED" }).parameters).toBeUndefined();
  });
});

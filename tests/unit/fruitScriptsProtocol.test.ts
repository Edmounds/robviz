import { describe, expect, it } from "vitest";
import { actionSchema, logSchema, scriptArguments, scriptSchema, scriptsSchema } from "../../src/plugins/fruit-scripts/api";

const script = scriptSchema.parse({
  id: "sample", script: "sample.sh", note: "", parameters: {
    mode: { flag: "--mode", choices: ["one", "two"], required: true },
    side: { choices: ["--left", "--right"], required: true },
    model: { flag: "model:=", choices: ["edge", "yolo"], default: "edge" },
    debug: { flag: "--debug", default: false },
  },
});

describe("script control protocol", () => {
  it("requires explicit mandatory choices", () => {
    expect(() => scriptArguments(script, {})).toThrow("mode");
    expect(() => scriptArguments(script, { mode: "one" })).toThrow("side");
  });

  it("previews allowlisted defaults and boolean flags", () => {
    expect(scriptArguments(script, { mode: "two", side: "--right", debug: true }))
      .toEqual(["--mode", "two", "--right", "model:=edge", "--debug"]);
    expect(scriptArguments(script, { mode: "one", side: "--left", model: "invalid", debug: "true" }))
      .toEqual(["--mode", "one", "--left", "model:=edge"]);
  });

  it("validates log cursors and preserves terminal control sequences", () => {
    const message = { id: "sample", current: null, operation: null, run_id: "run", cursor: 4,
      data: "\x1b[32m中文\x1b[0m\r", reset: true };
    expect(logSchema.parse(message).data).toBe(message.data);
    expect(logSchema.safeParse({ ...message, cursor: -1 }).success).toBe(false);
    expect(logSchema.safeParse({ ...message, operation: "unknown" }).success).toBe(false);
  });

  it("validates multi-script runs and stop actions", () => {
    const payload = {
      scripts: [script],
      runs: {
        sample: { id: "sample", run_id: "run1", state: "RUNNING", exit_code: null, pid: 1234 },
        teleop: { id: "teleop", run_id: "run2", state: "EXITED", exit_code: 0, pid: null },
      },
      current: { id: "sample", run_id: "run1", state: "RUNNING", exit_code: null, pid: 1234 },
      operation: null,
    };
    const parsed = scriptsSchema.parse(payload);
    expect(parsed.runs?.sample?.state).toBe("RUNNING");
    expect(parsed.runs?.teleop?.state).toBe("EXITED");

    const stopReply = actionSchema.parse({
      run: { id: "sample", run_id: "run1", state: "EXITED", exit_code: -2, pid: null },
      current: { id: "sample", run_id: "run1", state: "EXITED", exit_code: -2, pid: null },
    });
    expect(stopReply.run?.state).toBe("EXITED");
  });
});

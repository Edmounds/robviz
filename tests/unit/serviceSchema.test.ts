import { describe, expect, it } from "vitest";

import {
  defaultServiceFieldValue,
  describeServiceSchema,
  setServiceValue,
} from "../../src/core/serviceSchema";

const SCHEMA = `
bool enabled
float64 gain
string label
geometry_msgs/Vector3 offset
int32[2] limits
string[] names
================================================================================
MSG: geometry_msgs/Vector3
float64 x
float64 y
float64 z
`;

describe("service schema", () => {
  it("describes scalar, nested, fixed-array, and dynamic-array fields", () => {
    const fields = describeServiceSchema(SCHEMA);
    expect(fields.map((field) => [field.name, field.kind, field.array])).toEqual([
      ["enabled", "boolean", "none"],
      ["gain", "number", "none"],
      ["label", "string", "none"],
      ["offset", "message", "none"],
      ["limits", "number", "fixed"],
      ["names", "string", "dynamic"],
    ]);
    expect(fields[3].children?.map((field) => field.name)).toEqual(["x", "y", "z"]);
  });

  it("returns no fields for Trigger-style empty requests", () => {
    expect(describeServiceSchema("  \n")).toEqual([]);
    expect(describeServiceSchema("uint8 structure_needs_at_least_one_member\n")).toEqual([]);
  });

  it("creates a default element for dynamic arrays and nested messages", () => {
    const fields = describeServiceSchema(SCHEMA);
    expect(defaultServiceFieldValue(fields[2])).toBe("");
    expect(defaultServiceFieldValue(fields[3])).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("immutably updates nested fields and array items", () => {
    const original = { offset: { x: 0, y: 0 }, names: ["left"] };
    const nested = setServiceValue(original, ["offset", "x"], 2.5);
    const array = setServiceValue(nested, ["names", 0], "right");
    expect(array).toEqual({ offset: { x: 2.5, y: 0 }, names: ["right"] });
    expect(original).toEqual({ offset: { x: 0, y: 0 }, names: ["left"] });
  });
});

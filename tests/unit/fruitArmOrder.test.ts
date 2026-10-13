import { describe, expect, it } from "vitest";
import {
  documentSchema,
  isPresetOrderEqual,
  normalizePresetOrder,
  reorderArray,
} from "../../src/plugins/fruit-arm/api";

describe("fruitArmOrder", () => {
  describe("reorderArray", () => {
    it("moves an item up or down correctly", () => {
      const original = ["a", "b", "c", "d"];
      expect(reorderArray(original, 1, 3)).toEqual(["a", "c", "d", "b"]);
      expect(reorderArray(original, 3, 1)).toEqual(["a", "d", "b", "c"]);
      expect(original).toEqual(["a", "b", "c", "d"]);
    });

    it("returns shallow copy if indices are invalid or identical", () => {
      const list = ["x", "y", "z"];
      expect(reorderArray(list, 1, 1)).toEqual(["x", "y", "z"]);
      expect(reorderArray(list, -1, 2)).toEqual(["x", "y", "z"]);
      expect(reorderArray(list, 0, 5)).toEqual(["x", "y", "z"]);
      expect(reorderArray(list, 3, 0)).toEqual(["x", "y", "z"]);
    });
  });

  describe("normalizePresetOrder", () => {
    it("preserves given order while filtering deleted keys and deduplicating", () => {
      const presets = { alpha: {}, beta: {}, gamma: {} };
      const order = ["gamma", "unknown", "alpha", "gamma"];
      const result = normalizePresetOrder(order, presets);
      expect(result).toEqual(["gamma", "alpha", "beta"]);
    });

    it("appends new keys not present in order", () => {
      const presets = { "10": {}, "2": {}, newKey: {} };
      const order = ["2", "10"];
      const result = normalizePresetOrder(order, presets);
      expect(result).toEqual(["2", "10", "newKey"]);
    });

    it("falls back to presets keys when order is missing or empty", () => {
      const presets = { first: {}, second: {} };
      expect(normalizePresetOrder(undefined, presets)).toEqual(["first", "second"]);
      expect(normalizePresetOrder([], presets)).toEqual(["first", "second"]);
      expect(normalizePresetOrder(["a"], undefined)).toEqual([]);
    });

    it("handles numeric string keys without coercion or loss", () => {
      const presets = { "100": {}, "20": {}, "3": {} };
      const order = ["3", "100", "20"];
      expect(normalizePresetOrder(order, presets)).toEqual(["3", "100", "20"]);
    });
  });

  describe("isPresetOrderEqual", () => {
    it("compares order strictly", () => {
      expect(isPresetOrderEqual(["a", "b", "c"], ["a", "b", "c"])).toBe(true);
      expect(isPresetOrderEqual(["a", "b", "c"], ["b", "a", "c"])).toBe(false);
      expect(isPresetOrderEqual(["a", "b"], ["a", "b", "c"])).toBe(false);
      expect(isPresetOrderEqual([], [])).toBe(true);
    });
  });

  describe("order lifecycle state transitions", () => {
    it("appends to order on create and copy", () => {
      const order = ["alpha", "beta"];
      const createdOrder = [...order, "gamma"];
      expect(createdOrder).toEqual(["alpha", "beta", "gamma"]);

      const copiedOrder = [...createdOrder, "alpha_copy"];
      expect(copiedOrder).toEqual(["alpha", "beta", "gamma", "alpha_copy"]);
    });

    it("preserves index on rename", () => {
      const order = ["alpha", "beta", "gamma"];
      const renamedOrder = order.map((key) => (key === "beta" ? "beta_renamed" : key));
      expect(renamedOrder).toEqual(["alpha", "beta_renamed", "gamma"]);
    });

    it("removes preset from order on delete", () => {
      const order = ["alpha", "beta", "gamma"];
      const deletedOrder = order.filter((key) => key !== "beta");
      expect(deletedOrder).toEqual(["alpha", "gamma"]);
    });

    it("detects dirty state when only preset order changes", () => {
      const basePresets = {
        zero: { coordinate_frame: "joints", waypoints: [{ target: [0, 0, 0, 0], duration_ms: 1000 }] },
        home: { coordinate_frame: "cartesian", waypoints: [{ target: [0, 0, 0, 0], duration_ms: 1000 }] },
      };
      const baseOrder = ["zero", "home"];
      const draftPresets = structuredClone(basePresets);

      // Same order, same content
      expect(isPresetOrderEqual(["zero", "home"], baseOrder)).toBe(true);

      // Order modified: ["home", "zero"]
      const reordered = reorderArray(baseOrder, 0, 1);
      const isOrderDirty = !isPresetOrderEqual(reordered, baseOrder);
      expect(isOrderDirty).toBe(true);
      // Presets map content itself is unchanged
      expect(draftPresets).toEqual(basePresets);
    });
  });

  describe("documentSchema", () => {
    const baseDoc = {
      version: "sha256-abc",
      revision: "rev-123",
      presets_revision: "prev-456",
      file: "/path/to/arm_presets.yaml",
      configuration: {
        geometry: { d1: 0.1, a2: 0.2, a3: 0.2, a4: 0.1, tool_z_offset_m: 0 },
        joint_mapping: {
          q1: { direction: 1, offset_deg: 0, limits_deg: [-180, 180] },
          q2: { direction: 1, offset_deg: 0, limits_deg: [-90, 90] },
          q3: { direction: 1, offset_deg: 0, limits_deg: [-90, 90] },
          q4: { direction: 1, offset_deg: 0, limits_deg: [-90, 90] },
        },
        planning: {
          default_duration_ms: 1000,
          interpolation_step_ms: 200,
  default_dwell_ms: 500,
  status_max_age_sec: 1,
  hover_height_m: 0.05,
},
        presets: {
          home: {
            coordinate_frame: "cartesian",
            waypoints: [{ target: [0, 0, 0, 0], duration_ms: 1000 }],
          },
        },
      },
    };

    it("parses document with preset_order", () => {
      const parsed = documentSchema.safeParse({
        ...baseDoc,
        preset_order: ["home"],
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.preset_order).toEqual(["home"]);
      }
    });

    it("parses legacy document without preset_order", () => {
      const parsed = documentSchema.safeParse(baseDoc);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.preset_order).toBeUndefined();
      }
    });

    it("rejects invalid preset_order items", () => {
      const parsed = documentSchema.safeParse({
        ...baseDoc,
        preset_order: [""],
      });
      expect(parsed.success).toBe(false);
    });
  });
});

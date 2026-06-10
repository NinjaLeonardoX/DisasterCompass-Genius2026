import { describe, expect, it } from "bun:test";
import { getRecoveryChecklist } from "./recovery";
import type { DisasterType, RecoveryCategory } from "@/types";

// The recovery checklist is the same across disaster types in this demo but the
// signature accepts a type so it can specialize later. These tests pin the
// standard FEMA-aligned list and its shape.

const DISASTERS: DisasterType[] = ["flood", "earthquake", "wildfire", "hurricane", "heat"];

describe("getRecoveryChecklist", () => {
  it("returns the eight standard recovery steps, all incomplete", () => {
    const items = getRecoveryChecklist("flood");
    expect(items).toHaveLength(8);
    expect(items.every((i) => i.completed === false)).toBe(true);
    expect(items[0].label).toBe("Confirm everyone is safe");
  });

  it("uses unique ids and known categories", () => {
    const items = getRecoveryChecklist("flood");
    const ids = new Set(items.map((i) => i.id));
    expect(ids.size).toBe(items.length);

    const categories: RecoveryCategory[] = ["safety", "documentation", "assistance", "wellbeing"];
    expect(items.every((i) => categories.includes(i.category))).toBe(true);
  });

  it("is identical across every disaster type for now", () => {
    const flood = JSON.stringify(getRecoveryChecklist("flood"));
    for (const d of DISASTERS) {
      expect(JSON.stringify(getRecoveryChecklist(d))).toBe(flood);
    }
  });
});

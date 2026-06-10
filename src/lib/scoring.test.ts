import { describe, expect, it } from "bun:test";
import { getBestRoute, scoreRoute } from "./scoring";
import { ROUTES } from "@/data/seed";
import type { RouteOption } from "@/types";

// The scoring engine is pure and deterministic. These tests pin the calibrated
// targets the formula and seed data are tuned to (see the comments in
// scoring.ts), so any drift in coefficients or seed values is caught.

const routeById = (id: string): RouteOption => {
  const route = ROUTES.find((r) => r.id === id);
  if (!route) throw new Error(`missing seed route ${id}`);
  return route;
};

describe("scoreRoute", () => {
  it("scores the three calibrated North Creek routes at 48 / 91 / 70", () => {
    expect(scoreRoute(routeById("route-a")).score).toBe(48); // flooded bridge + blocked road
    expect(scoreRoute(routeById("route-b")).score).toBe(91); // safe, accessible, high ground
    expect(scoreRoute(routeById("route-c")).score).toBe(70); // near the flood edge, longer
  });

  it("clamps the score to the 0–100 range", () => {
    const everything: RouteOption = {
      ...routeById("route-a"),
      floodExposure: 1,
      usesBridge: true,
      blockedRoad: true,
      distanceMiles: 100,
      estimatedMinutes: 600,
      elevationGain: 0,
      shelterFit: 0,
      accessibility: false,
    };
    expect(scoreRoute(everything).score).toBe(0);
  });

  it("flags rejection reasons for a flooded, bridged, blocked route", () => {
    const { rejectedReasons } = scoreRoute(routeById("route-a"));
    expect(rejectedReasons).toEqual([
      "Crosses a flooded bridge",
      "Uses a blocked road",
      "High floodwater exposure",
    ]);
  });

  it("returns no rejection reasons for the clean recommended route", () => {
    expect(scoreRoute(routeById("route-b")).rejectedReasons).toEqual([]);
  });

  it("produces one breakdown line per scoring term", () => {
    const { breakdown } = scoreRoute(routeById("route-b"));
    expect(breakdown.map((b) => b.label)).toEqual([
      "Flood exposure",
      "Flooded bridge",
      "Blocked road",
      "Distance & travel time",
      "Elevation gain",
      "Shelter fit",
      "Accessibility",
    ]);
    // Breakdown deltas must reconstruct the (pre-clamp) score from 100.
    const sum = breakdown.reduce((acc, b) => acc + b.value, 0);
    expect(100 + sum).toBe(91);
  });
});

describe("getBestRoute", () => {
  it("recommends the highest-scoring non-rejected route (Route B)", () => {
    expect(getBestRoute(ROUTES)?.id).toBe("route-b");
  });

  it("returns null for an empty route list", () => {
    expect(getBestRoute([])).toBeNull();
  });

  it("falls back to the best overall when every route is rejected", () => {
    const rejected = ROUTES.map((r) => ({ ...r, colorType: "rejected" as const }));
    // Route B still has the highest raw score even when all are marked rejected.
    expect(getBestRoute(rejected)?.id).toBe("route-b");
  });
});

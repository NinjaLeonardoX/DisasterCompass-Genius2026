import { describe, expect, it } from "bun:test";
import { bearing, buildDriveModel, nearestBlocked, turnAngle } from "./driveSim";
import { BLOCKED_ROADS, ROUTES } from "@/data/seed";
import type { RouteOption } from "@/types";

const routeById = (id: string): RouteOption => {
  const route = ROUTES.find((r) => r.id === id);
  if (!route) throw new Error(`missing seed route ${id}`);
  return route;
};

describe("driveSim geometry", () => {
  it("computes bearings in the right quadrant", () => {
    expect(bearing([0, 0], [1, 0])).toBeCloseTo(0, 0); // due north
    expect(bearing([0, 0], [0, 1])).toBeCloseTo(90, 0); // due east
  });

  it("signs turns: positive right, negative left", () => {
    expect(turnAngle(0, 30)).toBe(30);
    expect(turnAngle(0, -30)).toBe(-30);
    expect(turnAngle(350, 10)).toBe(20); // wraps across 0
  });

  it("measures distance to the nearest blocked road", () => {
    const onBlocked = BLOCKED_ROADS[0].coordinates[0];
    expect(nearestBlocked(onBlocked, BLOCKED_ROADS)).toBeCloseTo(0, 0);
    expect(nearestBlocked([41, -106], BLOCKED_ROADS)).toBeGreaterThan(1000);
  });
});

describe("buildDriveModel cues", () => {
  it("ends every route with a safe arrival cue", () => {
    for (const route of ROUTES) {
      const model = buildDriveModel(route, BLOCKED_ROADS);
      const last = model.cues[model.cues.length - 1];
      expect(last.status).toBe("arrived");
      expect(model.points.length).toBe(model.cues.length);
    }
  });

  it("names streets in the navigation cues", () => {
    const model = buildDriveModel(routeById("route-b"), BLOCKED_ROADS);
    const joined = model.cues.map((c) => c.text).join(" | ");
    expect(joined).toContain("Hilltop Avenue");
  });

  it("keeps the safe route free of blocked-area alerts", () => {
    const model = buildDriveModel(routeById("route-b"), BLOCKED_ROADS);
    expect(model.cues.some((c) => c.status === "blocked")).toBe(false);
  });

  it("flags blocked areas on the rejected River Road route", () => {
    const model = buildDriveModel(routeById("route-a"), BLOCKED_ROADS);
    expect(model.cues.some((c) => c.status === "blocked")).toBe(true);
  });
});

import { describe, expect, it } from "bun:test";
import { matchVolunteer } from "./matching";
import { RIVERA_HOUSEHOLD, VOLUNTEERS } from "@/data/seed";
import type { Household, Volunteer } from "@/types";

// The matching engine ranks volunteers by a weighted priority order spaced so a
// higher-priority factor always outranks the sum of the lower ones. These tests
// pin that ordering and the explainable reasons the UI surfaces.

describe("matchVolunteer", () => {
  it("returns an empty match when no volunteers exist", () => {
    expect(matchVolunteer(RIVERA_HOUSEHOLD, [])).toEqual({
      bestVolunteer: null,
      matchScore: 0,
      matchReasons: [],
    });
  });

  it("picks Ana for the Rivera Family (available, pet + accessibility capable)", () => {
    const match = matchVolunteer(RIVERA_HOUSEHOLD, VOLUNTEERS);
    expect(match.bestVolunteer?.id).toBe("vol-ana");
    expect(match.matchReasons).toContain("Available now");
    expect(match.matchReasons).toContain("Can transport pets");
    expect(match.matchReasons).toContain("Supports accessibility needs");
  });

  it("prioritizes availability above every other factor", () => {
    // A perfectly-equipped but unavailable van vs. a thin but available car.
    const idleVan: Volunteer = {
      id: "idle-van",
      name: "Idle",
      vehicle: "van",
      seats: 8,
      distanceMiles: 0.1,
      available: false,
      canTransportPets: true,
      canSupportAccessibility: true,
      lat: 0,
      lng: 0,
      status: "Unavailable",
    };
    const readyCar: Volunteer = {
      id: "ready-car",
      name: "Ready",
      vehicle: "car",
      seats: 2,
      distanceMiles: 9,
      available: true,
      canTransportPets: false,
      canSupportAccessibility: false,
      lat: 0,
      lng: 0,
      status: "En Route",
    };
    expect(matchVolunteer(RIVERA_HOUSEHOLD, [idleVan, readyCar]).bestVolunteer?.id).toBe(
      "ready-car",
    );
  });

  it("does not credit pet/accessibility capacity the household does not need", () => {
    const simpleHousehold: Household = {
      ...RIVERA_HOUSEHOLD,
      people: 1,
      pets: 0,
      accessibilityNeeds: false,
    };
    const match = matchVolunteer(simpleHousehold, VOLUNTEERS);
    expect(match.matchReasons).not.toContain("Can transport pets");
    expect(match.matchReasons).not.toContain("Supports accessibility needs");
  });
});

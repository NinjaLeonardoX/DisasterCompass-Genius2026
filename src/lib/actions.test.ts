import { describe, expect, it } from "bun:test";
import { decideAction } from "./actions";
import { RIVERA_HOUSEHOLD } from "@/data/seed";
import type { Household } from "@/types";

// The decision engine is pure: same disaster + household always yields the same
// action. These tests lock the GO / STAY / WAIT branches and the disaster-aware
// routing flags the UI depends on.

const withCar: Household = { ...RIVERA_HOUSEHOLD, hasCar: true };

describe("decideAction — flood", () => {
  it("sends the at-risk household to higher ground", () => {
    const d = decideAction("flood", RIVERA_HOUSEHOLD);
    expect(d.actionType).toBe("GO");
    expect(d.destinationType).toBe("high-ground shelter");
    expect(d.shouldShowRoute).toBe(true);
  });

  it("requests transport only when the household has no car", () => {
    expect(decideAction("flood", RIVERA_HOUSEHOLD).needsTransport).toBe(true);
    expect(decideAction("flood", withCar).needsTransport).toBe(false);
  });
});

describe("decideAction — earthquake", () => {
  it("shelters in place and shows no route during shaking", () => {
    const d = decideAction("earthquake", RIVERA_HOUSEHOLD);
    expect(d.actionType).toBe("STAY");
    expect(d.destinationType).toBe("shelter-in-place");
    expect(d.shouldShowRoute).toBe(false);
    expect(d.needsTransport).toBe(false);
  });
});

describe("decideAction — hurricane & wildfire", () => {
  it("evacuates before the deadline (hurricane)", () => {
    const d = decideAction("hurricane", RIVERA_HOUSEHOLD);
    expect(d.actionType).toBe("GO");
    expect(d.destinationType).toBe("evacuation shelter");
    expect(d.shouldShowRoute).toBe(true);
  });

  it("evacuates away from the fire path (wildfire)", () => {
    const d = decideAction("wildfire", RIVERA_HOUSEHOLD);
    expect(d.actionType).toBe("GO");
    expect(d.destinationType).toBe("evacuation shelter");
  });

  it("only needs transport without a car", () => {
    expect(decideAction("hurricane", RIVERA_HOUSEHOLD).needsTransport).toBe(true);
    expect(decideAction("hurricane", withCar).needsTransport).toBe(false);
    expect(decideAction("wildfire", withCar).needsTransport).toBe(false);
  });
});

describe("decideAction — heat (the branching case)", () => {
  const lowRisk: Household = {
    ...RIVERA_HOUSEHOLD,
    elderly: 0,
    medicalNeeds: false,
    powerDependentMedicalDevice: false,
    hasCooling: true,
    hasCar: true,
  };

  it("WAITs for transport when vulnerable and carless", () => {
    // Rivera has an elderly member and no car.
    const d = decideAction("heat", RIVERA_HOUSEHOLD);
    expect(d.actionType).toBe("WAIT");
    expect(d.destinationType).toBe("cooling center");
    expect(d.needsTransport).toBe(true);
  });

  it("GOes to a cooling center when vulnerable but has a car", () => {
    const d = decideAction("heat", { ...RIVERA_HOUSEHOLD, hasCar: true });
    expect(d.actionType).toBe("GO");
    expect(d.destinationType).toBe("cooling center");
    expect(d.needsTransport).toBe(false);
  });

  it("STAYs cool when low-risk and home cooling works", () => {
    const d = decideAction("heat", lowRisk);
    expect(d.actionType).toBe("STAY");
    expect(d.destinationType).toBe("shelter-in-place");
    expect(d.shouldShowRoute).toBe(false);
  });

  it("treats a cooling outage as vulnerability even for an otherwise low-risk home", () => {
    const d = decideAction("heat", { ...lowRisk, hasCooling: false });
    expect(d.actionType).toBe("GO");
    expect(d.destinationType).toBe("cooling center");
  });
});

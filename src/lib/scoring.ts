import type { RouteOption, RouteScore } from "@/types";

// Pure route-safety scoring engine.
//
// Formula (all terms named in the spec):
//   score = 100
//           − floodPenalty − bridgePenalty − blockedRoadPenalty − distancePenalty
//           + elevationBonus + shelterFitBonus + accessibilityBonus
//
// `distancePenalty` is the journey cost: it combines distance AND travel time,
// so a safe-but-slow uphill detour is correctly docked. The coefficients below
// are calibrated so the three seeded routes land at the target safety scores:
//   Route A (River Road Shortcut)  ≈ 48  — flooded bridge + blocked road
//   Route B (Hilltop Avenue Route) ≈ 91  — safe, accessible, reaches high ground
//   Route C (East Ridge Detour)    ≈ 70  — near the flood edge, longer
const COEFFICIENTS = {
  flood: 50, // × floodExposure (0–1)
  bridge: 20, // flat, if the route uses a bridge
  blockedRoad: 20, // flat, if the route uses a blocked road
  distanceMiles: 3, // × miles
  travelMinutes: 0.6, // × estimated minutes
  elevation: 0.5, // × elevationGain (feet toward higher ground)
  shelterFit: 8, // × shelterFit (0–1)
  accessibility: 5, // flat, if the route/destination is accessible
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function scoreRoute(route: RouteOption): RouteScore {
  const floodPenalty = Math.round(route.floodExposure * COEFFICIENTS.flood);
  const bridgePenalty = route.usesBridge ? COEFFICIENTS.bridge : 0;
  const blockedRoadPenalty = route.blockedRoad ? COEFFICIENTS.blockedRoad : 0;
  const distancePenalty = Math.round(
    route.distanceMiles * COEFFICIENTS.distanceMiles +
      route.estimatedMinutes * COEFFICIENTS.travelMinutes,
  );
  const elevationBonus = Math.round(route.elevationGain * COEFFICIENTS.elevation);
  const shelterFitBonus = Math.round(route.shelterFit * COEFFICIENTS.shelterFit);
  const accessibilityBonus = route.accessibility ? COEFFICIENTS.accessibility : 0;

  const raw =
    100 -
    floodPenalty -
    bridgePenalty -
    blockedRoadPenalty -
    distancePenalty +
    elevationBonus +
    shelterFitBonus +
    accessibilityBonus;

  const score = clamp(raw, 0, 100);

  const breakdown = [
    {
      label: "Flood exposure",
      value: -floodPenalty,
      explanation:
        floodPenalty > 0
          ? `Route passes through floodwater (${Math.round(route.floodExposure * 100)}% exposed).`
          : "Avoids floodwater entirely.",
    },
    {
      label: "Flooded bridge",
      value: -bridgePenalty,
      explanation: bridgePenalty > 0 ? "Crosses a flooded bridge." : "No bridge crossing.",
    },
    {
      label: "Blocked road",
      value: -blockedRoadPenalty,
      explanation: blockedRoadPenalty > 0 ? "Uses a road marked blocked." : "No blocked roads.",
    },
    {
      label: "Distance & travel time",
      value: -distancePenalty,
      explanation: `${route.distanceMiles.toFixed(1)} mi, ~${route.estimatedMinutes} min.`,
    },
    {
      label: "Elevation gain",
      value: elevationBonus,
      explanation:
        elevationBonus > 0
          ? `Climbs ${route.elevationGain} ft toward higher ground.`
          : "Little elevation gain.",
    },
    {
      label: "Shelter fit",
      value: shelterFitBonus,
      explanation: `Destination suitability ${Math.round(route.shelterFit * 100)}%.`,
    },
    {
      label: "Accessibility",
      value: accessibilityBonus,
      explanation:
        accessibilityBonus > 0 ? "Accessibility-friendly route." : "Not accessibility-rated.",
    },
  ];

  const rejectedReasons: string[] = [];
  if (route.usesBridge) rejectedReasons.push("Crosses a flooded bridge");
  if (route.blockedRoad) rejectedReasons.push("Uses a blocked road");
  if (route.floodExposure >= 0.4) rejectedReasons.push("High floodwater exposure");

  return { score, breakdown, rejectedReasons };
}

/**
 * Returns the safest recommended route: the highest score among non-rejected
 * routes. Falls back to the overall highest score only if every route is
 * rejected (so the UI always has something to show).
 */
export function getBestRoute(routes: RouteOption[]): RouteOption | null {
  if (routes.length === 0) return null;

  const scored = routes.map((route) => ({ route, score: scoreRoute(route).score }));
  const eligible = scored.filter(({ route }) => route.colorType !== "rejected");
  const pool = eligible.length > 0 ? eligible : scored;

  return pool.reduce((best, current) => (current.score > best.score ? current : best)).route;
}

import type { RouteOption } from "@/types";

// Pure routing adapter. Maps an OpenRouteService GeoJSON Directions response
// onto the EXISTING seed RouteOption list. ORS only ever supplies geometry,
// distance, and travel time. Every knowledge-layer field — floodExposure,
// usesBridge, blockedRoad, elevationGain, shelterFit, accessibility, colorType,
// notes, ids, destinationId — stays from the seed route it is matched to (by
// order). This keeps the scoring engine fed by the curated knowledge layer
// while letting real roads replace the hand-drawn polylines.

const METERS_PER_MILE = 1609.34;

/** Shape of the slice of the ORS GeoJSON response we consume. */
export interface OrsResponse {
  features?: Array<{
    geometry?: { coordinates?: [number, number][] }; // [lng, lat] pairs
    properties?: { summary?: { distance?: number; duration?: number } };
  }>;
}

export function mapOrsToRoutes(raw: OrsResponse, seedRoutes: RouteOption[]): RouteOption[] {
  const features = raw.features ?? [];
  if (features.length === 0) {
    throw new Error("ORS returned no route features");
  }

  return seedRoutes.map((seed, index) => {
    const feature = features[index];
    const coords = feature?.geometry?.coordinates;
    if (!coords || coords.length === 0) {
      // No matching live geometry for this seed route — keep it unchanged.
      return seed;
    }

    // ORS is [lng, lat]; our RouteOption.coordinates is [lat, lng].
    const coordinates = coords.map(([lng, lat]) => [lat, lng] as [number, number]);
    const summary = feature?.properties?.summary;

    return {
      ...seed,
      coordinates,
      distanceMiles:
        typeof summary?.distance === "number"
          ? summary.distance / METERS_PER_MILE
          : seed.distanceMiles,
      estimatedMinutes:
        typeof summary?.duration === "number"
          ? Math.round(summary.duration / 60)
          : seed.estimatedMinutes,
    };
  });
}

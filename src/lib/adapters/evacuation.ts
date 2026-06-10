import type { DisasterType, RouteOption } from "@/types";
import type { OrsResponse } from "./routing";

// Pure helpers for the location-aware evacuation flow. No network, no React.
// We synthesize disaster-appropriate SAFE DESTINATIONS near a real location
// (there is no free, reliable shelter feed), then build RouteOptions the
// existing scoring engine can rank. Geometry/distance/time come from ORS when
// available, otherwise from honest straight-line estimates.

const METERS_PER_MILE = 1609.34;
const EARTH_RADIUS_KM = 6371;
const METERS_PER_FOOT = 0.3048;

export type DestinationKind =
  | "higher-ground"
  | "inland"
  | "away-from-hazard"
  | "cooling"
  | "open-space";

export interface SafeDestination {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind: DestinationKind;
  /** Bearing (deg from north) used to generate it — for labels. */
  bearing: number;
}

function toRad(d: number): number {
  return (d * Math.PI) / 180;
}
function toDeg(r: number): number {
  return (r * 180) / Math.PI;
}

/** Point `distanceKm` from [lat,lng] along `bearingDeg` (great-circle). */
export function offsetPoint(
  lat: number,
  lng: number,
  distanceKm: number,
  bearingDeg: number,
): [number, number] {
  const br = toRad(bearingDeg);
  const d = distanceKm / EARTH_RADIUS_KM;
  const phi1 = toRad(lat);
  const lam1 = toRad(lng);
  const phi2 = Math.asin(
    Math.sin(phi1) * Math.cos(d) + Math.cos(phi1) * Math.sin(d) * Math.cos(br),
  );
  const lam2 =
    lam1 +
    Math.atan2(
      Math.sin(br) * Math.sin(d) * Math.cos(phi1),
      Math.cos(d) - Math.sin(phi1) * Math.sin(phi2),
    );
  return [toDeg(phi2), toDeg(lam2)];
}

/** Haversine distance in miles between two [lat,lng] points. */
export function haversineMiles(a: [number, number], b: [number, number]): number {
  const dPhi = toRad(b[0] - a[0]);
  const dLam = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dPhi / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLam / 2) ** 2;
  const km = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
  return km / 1.60934;
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
function compassLabel(bearing: number): string {
  return COMPASS[Math.round(bearing / 45) % 8];
}

/**
 * Candidate safe destinations around an origin, by disaster.
 *  - flood: ring of 8 points (the hook picks the highest-elevation ones)
 *  - hurricane: inland-ish spread (3 directions)
 *  - wildfire: spread of 3 "away-from-hazard" directions
 *  - heat: nearby cooling points (3, closer in)
 * Earthquake returns [] (shelter in place — handled upstream).
 */
export function generateDestinations(
  origin: [number, number],
  disaster: DisasterType,
): SafeDestination[] {
  const [lat, lng] = origin;
  const mk = (
    distanceKm: number,
    bearing: number,
    kind: DestinationKind,
    name: string,
  ): SafeDestination => {
    const [dlat, dlng] = offsetPoint(lat, lng, distanceKm, bearing);
    return { id: `dest-${kind}-${Math.round(bearing)}`, name, lat: dlat, lng: dlng, kind, bearing };
  };

  switch (disaster) {
    case "flood":
      return [0, 45, 90, 135, 180, 225, 270, 315].map((b) =>
        mk(4, b, "higher-ground", `Higher ground (${compassLabel(b)})`),
      );
    case "hurricane":
      return [225, 270, 315].map((b) =>
        mk(12, b, "inland", `Inland assembly (${compassLabel(b)})`),
      );
    case "wildfire":
      return [60, 180, 300].map((b) =>
        mk(8, b, "away-from-hazard", `Safe direction (${compassLabel(b)})`),
      );
    case "heat":
      return [0, 120, 240].map((b) => mk(2.5, b, "cooling", `Cooling point (${compassLabel(b)})`));
    default:
      return [0, 120, 240].map((b) => mk(4, b, "open-space", `Open assembly (${compassLabel(b)})`));
  }
}

const KIND_NOTE: Record<DestinationKind, string> = {
  "higher-ground": "Computed higher-ground target — not a vetted shelter. Verify locally.",
  inland: "Computed inland direction away from the coast — not a vetted shelter.",
  "away-from-hazard": "Computed direction away from the hazard — not a vetted shelter.",
  cooling: "Computed nearby cooling point — confirm an official cooling center.",
  "open-space": "Computed open-assembly direction — not a vetted shelter.",
};

interface BuildOpts {
  origin: [number, number];
  destination: SafeDestination;
  /** ORS GeoJSON for THIS origin→destination, if the live call succeeded. */
  ors: OrsResponse | null;
  /** Real elevation gain in feet (dest − origin), if known. */
  elevationGainFt: number | null;
}

/**
 * Build one RouteOption for the engine. Real distance/time/geometry from ORS
 * when present; otherwise an honest straight-line estimate (~25 mph). Hazard
 * fields are left neutral (we route toward safety, not through a known hazard)
 * except elevationGain, which is real for flood when elevation is available.
 */
export function buildEvacuationRoute({
  origin,
  destination,
  ors,
  elevationGainFt,
}: BuildOpts): RouteOption {
  const feature = ors?.features?.[0];
  const coords = feature?.geometry?.coordinates;
  const summary = feature?.properties?.summary;

  let coordinates: [number, number][];
  let distanceMiles: number;
  let estimatedMinutes: number;

  if (coords && coords.length > 0) {
    coordinates = coords.map(([lng, lat]) => [lat, lng] as [number, number]);
    distanceMiles =
      typeof summary?.distance === "number"
        ? summary.distance / METERS_PER_MILE
        : haversineMiles(origin, [destination.lat, destination.lng]);
    estimatedMinutes =
      typeof summary?.duration === "number"
        ? Math.round(summary.duration / 60)
        : Math.round((distanceMiles / 25) * 60);
  } else {
    coordinates = [origin, [destination.lat, destination.lng]];
    distanceMiles = haversineMiles(origin, [destination.lat, destination.lng]);
    estimatedMinutes = Math.max(1, Math.round((distanceMiles / 25) * 60));
  }

  const elevationGain = elevationGainFt != null ? Math.max(0, Math.round(elevationGainFt)) : 0;

  return {
    id: destination.id,
    name: destination.name,
    colorType: "caution", // ranked/recolored after scoring
    destinationId: destination.id,
    distanceMiles: Number(distanceMiles.toFixed(1)),
    estimatedMinutes,
    floodExposure: 0,
    usesBridge: false,
    blockedRoad: false,
    elevationGain,
    shelterFit: 1,
    accessibility: false,
    coordinates,
    notes: KIND_NOTE[destination.kind],
  };
}

export function metersToFeet(m: number): number {
  return m / METERS_PER_FOOT;
}

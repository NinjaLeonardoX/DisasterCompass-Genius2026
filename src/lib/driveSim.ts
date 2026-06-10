import type { BlockedRoad, RouteOption } from "@/types";

// Lightweight geometry + guidance helpers powering the Respond "Simulate
// driving" overlay. Everything here is pure so it can be unit-tested without a
// map. No live APIs — the cues are derived from the seed route geometry and the
// known blocked-road segments.

export type DriveStatus = "safe" | "caution" | "blocked" | "arrived";

export interface DriveCue {
  /** Short instruction shown in the overlay banner. */
  text: string;
  status: DriveStatus;
}

export interface DriveModel {
  /** Densified [lat, lng] points along the route for smooth animation. */
  points: [number, number][];
  /** Per-point compass heading in degrees (for orienting the vehicle). */
  headings: number[];
  /** Per-point guidance cue shown while the vehicle sits on that point. */
  cues: DriveCue[];
}

const EARTH_R = 6371000; // metres
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Great-circle distance between two [lat, lng] points, in metres. */
export function haversine(a: [number, number], b: [number, number]): number {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(h));
}

/** Initial bearing (degrees, 0–360) from point a to point b. */
export function bearing(a: [number, number], b: [number, number]): number {
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const dLng = toRad(b[1] - a[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Signed turn between two headings: positive = right, negative = left. */
export function turnAngle(prev: number, next: number): number {
  let d = next - prev;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

/** Distance (metres) from a point to the nearest blocked-road vertex. */
export function nearestBlocked(
  point: [number, number],
  blocked: BlockedRoad[],
): number {
  let min = Infinity;
  for (const road of blocked) {
    for (const c of road.coordinates) {
      const d = haversine(point, c);
      if (d < min) min = d;
    }
  }
  return min;
}

const HAZARD_RADIUS_M = 120;
const STEPS_PER_SEGMENT = 14;

/**
 * Walk a route's vertices, densify each segment into animation points, and
 * attach a guidance cue to every point: a turn instruction as the vehicle
 * enters a segment, a "blocked area nearby" alert near any blocked road, and a
 * status colour (safe / caution / blocked) used by the overlay banner.
 */
export function buildDriveModel(
  route: RouteOption,
  blocked: BlockedRoad[],
): DriveModel {
  const coords = route.coordinates;
  const points: [number, number][] = [];
  const headings: number[] = [];
  const cues: DriveCue[] = [];

  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    const segBearing = bearing(a, b);
    const prevBearing = i > 0 ? bearing(coords[i - 1], coords[i]) : segBearing;
    const turn = turnAngle(prevBearing, segBearing);

    // Street being driven on this segment, plus an "onto …" suffix for turns.
    const street = route.streets?.[i];
    const onto = street ? ` onto ${street}` : "";
    const on = street ? ` on ${street}` : "";

    let turnText: string;
    if (i === 0)
      turnText = street
        ? `Head out on ${street} — road ahead is clear`
        : "Starting drive — road ahead is clear";
    else if (turn > 22) turnText = `Turn right${onto} — staying on the safe route`;
    else if (turn < -22) turnText = `Turn left${onto} — staying on the safe route`;
    else turnText = `Continue straight${onto || " ahead"}`;

    for (let s = 0; s < STEPS_PER_SEGMENT; s++) {
      const t = s / STEPS_PER_SEGMENT;
      const p: [number, number] = [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
      ];
      points.push(p);
      headings.push(segBearing);

      const nearHazard = nearestBlocked(p, blocked) < HAZARD_RADIUS_M;
      if (nearHazard) {
        cues.push({
          text: `⚠ Blocked area ahead${on} — rerouting around it`,
          status: "blocked",
        });
      } else if (route.colorType === "caution") {
        cues.push({
          text: s === 0 ? turnText : `Caution${on} — skirting the flood zone edge`,
          status: "caution",
        });
      } else {
        cues.push({
          text: s === 0 ? turnText : `Clear${on} — safe to proceed`,
          status: "safe",
        });
      }
    }
  }

  // Final arrival point + cue.
  points.push(coords[coords.length - 1]);
  headings.push(headings[headings.length - 1] ?? 0);
  cues.push({
    text: "✅ Arrived at the shelter — you're safe",
    status: "arrived",
  });

  return { points, headings, cues };
}

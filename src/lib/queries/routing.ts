import type { RouteOption, Shelter } from "@/types";
import { FLOOD_POLYGON, ROUTES, SHELTERS } from "@/data/seed";
import { fetchRoutes } from "../api/routing.functions";
import { mapOrsToRoutes, type OrsResponse } from "../adapters/routing";
import { useLiveOrSeed } from "../fallback";
import { flags } from "../flags";

// Closed GeoJSON ring ([lng, lat], first point repeated) from the seed flood
// polygon (which is stored as [lat, lng]).
function floodPolygonRing(): [number, number][] {
  const ring = FLOOD_POLYGON.map(([lat, lng]) => [lng, lat] as [number, number]);
  if (
    ring.length > 0 &&
    (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])
  ) {
    ring.push(ring[0]);
  }
  return ring;
}

/**
 * Resolves the destination shelter for the seed routes (all seed routes share a
 * destinationId — Hilltop for the flood scenario). Pure; touches no engine.
 */
export function resolveDestinationShelter(): Shelter | undefined {
  const destinationId = ROUTES[0]?.destinationId;
  return SHELTERS.find((s) => s.id === destinationId);
}

/**
 * Live road routes from `start` to `dest` (both [lat, lng]) that avoid the
 * flood polygon, mapped onto the seed RouteOption knowledge layer. Flag off,
 * key absent, or any error ⇒ the exact seed ROUTES, unchanged.
 */
export function useRoutes(start: [number, number], dest: [number, number]) {
  return useLiveOrSeed<OrsResponse, RouteOption[]>({
    enabled: flags.routing,
    fetcher: () =>
      fetchRoutes({
        data: {
          start: [start[1], start[0]], // [lat,lng] → [lng,lat]
          dest: [dest[1], dest[0]],
          avoidPolygon: [floodPolygonRing()],
        },
      }) as Promise<OrsResponse>,
    adapter: (raw) => mapOrsToRoutes(raw, ROUTES),
    seed: ROUTES,
    deps: [start[0], start[1], dest[0], dest[1]],
  });
}

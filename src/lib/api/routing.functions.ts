import { createServerFn } from "@tanstack/react-start";
import process from "node:process";
import { z } from "zod";

import type { OrsResponse } from "../adapters/routing";

// Server function: POST OpenRouteService Directions (driving-car, GeoJSON),
// avoiding the supplied flood polygon. The ORS key is read server-side from
// process.env and NEVER shipped to the browser. If the key is absent the
// handler throws so the hook falls back to seed routes. Raw network only —
// mapping happens in the pure adapter.

const lngLat = z.tuple([z.number(), z.number()]); // [lng, lat]

// Single origin→destination directions (no alternatives, no avoid polygon).
// Used by the location-aware evacuation flow. Throws when the key is absent so
// the caller can fall back to a straight-line estimate.
export const fetchDirection = createServerFn({ method: "POST" })
  .inputValidator(z.object({ start: lngLat, dest: lngLat }))
  .handler(async ({ data }): Promise<OrsResponse | null> => {
    const key = process.env.ORS_API_KEY;
    if (!key) {
      console.info("[routing] ORS_API_KEY absent — using straight-line estimate.");
      return null;
    }
    const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
      method: "POST",
      headers: { Authorization: key, "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates: [data.start, data.dest] }),
    });
    if (!res.ok) {
      console.info(`[routing] ORS ${res.status} — using straight-line estimate.`);
      return null;
    }
    return (await res.json()) as OrsResponse;
  });

export const fetchRoutes = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      start: lngLat, // [lng, lat]
      dest: lngLat, // [lng, lat]
      // GeoJSON Polygon coordinates: array of linear rings of [lng, lat].
      avoidPolygon: z.array(z.array(lngLat)),
    }),
  )
  .handler(async ({ data }): Promise<OrsResponse | null> => {
    const key = process.env.ORS_API_KEY;
    if (!key) {
      console.info("[routing] ORS_API_KEY absent — falling back to seed routes.");
      return null;
    }

    // NOTE: ORS rejects `alternative_routes` when combined with
    // `avoid_polygons` (HTTP 400). Request a single avoidance-aware route;
    // the adapter merges it onto the seed alternatives.
    const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
      method: "POST",
      headers: {
        Authorization: key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: [data.start, data.dest],
        options: {
          avoid_polygons: {
            type: "Polygon",
            coordinates: data.avoidPolygon,
          },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.info(`[routing] ORS ${res.status} — falling back to seed routes.`, body);
      return null;
    }
    return (await res.json()) as OrsResponse;
  });

import { useEffect, useState } from "react";
import type { DisasterType, RouteOption } from "@/types";
import { scoreRoute } from "@/lib/scoring";
import { fetchElevations } from "../api/elevation.functions";
import { fetchDirection } from "../api/routing.functions";
import type { OrsResponse } from "../adapters/routing";
import {
  buildEvacuationRoute,
  generateDestinations,
  metersToFeet,
  type SafeDestination,
} from "../adapters/evacuation";

export type EvacSource = "live" | "estimated";

export interface EvacuationResult {
  routes: RouteOption[];
  destinations: SafeDestination[];
  source: EvacSource;
  isLoading: boolean;
}

const EMPTY: EvacuationResult = {
  routes: [],
  destinations: [],
  source: "estimated",
  isLoading: false,
};

/**
 * Location-aware evacuation routing for a REAL origin. Generates computed safe
 * destinations by disaster, enriches flood targets with keyless elevation
 * (real higher-ground selection), routes to each via ORS (real roads) when a
 * key is present — otherwise honest straight-line estimates — and ranks them
 * with the existing scoring engine. Earthquake ⇒ no routes (shelter in place).
 */
export function useEvacuationRoutes(
  origin: [number, number],
  disaster: DisasterType,
  enabled: boolean,
): EvacuationResult {
  const [state, setState] = useState<EvacuationResult>(EMPTY);
  const [lat, lng] = origin;

  useEffect(() => {
    if (!enabled || disaster === "earthquake") {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true }));

    (async () => {
      const candidates = generateDestinations([lat, lng], disaster);
      let chosen = candidates;
      const gainByDestId = new Map<string, number>(); // elevation gain (ft) vs origin

      // 1) Real elevation (keyless). Best-effort; drives flood higher-ground pick.
      try {
        const lats = [lat, ...candidates.map((c) => c.lat)];
        const lngs = [lng, ...candidates.map((c) => c.lng)];
        const elev = await fetchElevations({ data: { lats, lngs } });
        const arr = elev.elevation ?? [];
        if (arr.length === candidates.length + 1) {
          const originFt = metersToFeet(arr[0]);
          const withGain = candidates.map((c, i) => ({
            dest: c,
            gainFt: metersToFeet(arr[i + 1]) - originFt,
          }));
          withGain.forEach((w) => gainByDestId.set(w.dest.id, w.gainFt));
          if (disaster === "flood") {
            chosen = [...withGain]
              .sort((a, b) => b.gainFt - a.gainFt)
              .slice(0, 3)
              .map((w) => w.dest);
          }
        } else if (disaster === "flood") {
          chosen = candidates.slice(0, 3);
        }
      } catch {
        if (disaster === "flood") chosen = candidates.slice(0, 3);
      }

      // 2) Road geometry per destination (ORS), else straight-line estimate.
      let anyLive = false;
      const built: RouteOption[] = [];
      for (const dest of chosen) {
        let ors: OrsResponse | null = null;
        try {
          ors = (await fetchDirection({
            data: { start: [lng, lat], dest: [dest.lng, dest.lat] },
          })) as OrsResponse;
          if (ors?.features?.length) anyLive = true;
        } catch {
          ors = null;
        }
        built.push(
          buildEvacuationRoute({
            origin: [lat, lng],
            destination: dest,
            ors,
            elevationGainFt: gainByDestId.get(dest.id) ?? null,
          }),
        );
      }

      // 3) Rank with the real engine → recolor (best = safe, rest = caution).
      let bestId: string | null = null;
      let bestScore = -Infinity;
      for (const r of built) {
        const s = scoreRoute(r).score;
        if (s > bestScore) {
          bestScore = s;
          bestId = r.id;
        }
      }
      const colored: RouteOption[] = built.map((r) => ({
        ...r,
        colorType: r.id === bestId ? "safe" : "caution",
      }));

      if (!cancelled) {
        setState({
          routes: colored,
          destinations: chosen,
          source: anyLive ? "live" : "estimated",
          isLoading: false,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lat, lng, disaster, enabled]);

  return state;
}

import { fetchWeatherAlerts, type OwmOneCallResponse } from "../api/alerts-owm.functions";
import { mapOwmToAlerts, type DisasterAlert } from "../adapters/alerts";
import { useLiveOrSeed } from "../fallback";
import { flags } from "../flags";

// Demo fallback defined HERE (not in seed.ts). Themed for the flood scenario so
// the offline strip reads believably during the demo.
const now = Math.floor(Date.now() / 1000);
export const DEMO_ALERTS: DisasterAlert[] = [
  {
    id: "demo-flood-warning",
    event: "Flood Warning",
    severity: "critical",
    source: "NWS (demo)",
    start: now,
    end: now + 6 * 3600,
    description:
      "Flood Warning in effect for low-lying areas near North Creek through this evening. Move to higher ground.",
  },
];

/** Severe-weather alerts for a point, with seed fallback when not live. */
export function useWeatherAlerts(lat: number, lng: number) {
  return useLiveOrSeed<OwmOneCallResponse, DisasterAlert[]>({
    enabled: flags.owmAlerts,
    fetcher: () => fetchWeatherAlerts({ data: { lat, lng } }),
    adapter: mapOwmToAlerts,
    seed: DEMO_ALERTS,
    deps: [lat, lng],
  });
}

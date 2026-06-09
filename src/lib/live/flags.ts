// Feature flags for live-data integration.
//
// Every flag DEFAULTS TO FALSE. With all flags off (or unset), the app runs
// entirely on in-memory seed data and behaves exactly as the offline demo.
// Flip a flag to "true" in .env (see .env.example) to enable that live source
// once its phase is implemented.
//
// Vite only exposes variables prefixed with VITE_ to the client bundle, which
// is why the flags use that prefix. Secrets (API keys) are NOT flags and must
// stay server-side without the VITE_ prefix.

function toBool(value: unknown): boolean {
  return value === true || value === "true" || value === "1";
}

// `import.meta.env` is typed loosely; read through a string map so unknown keys
// don't trip the type checker.
const env = import.meta.env as unknown as Record<string, string | undefined>;

export interface LiveFlags {
  /** Phase 1 — USGS earthquakes (keyless). */
  earthquakes: boolean;
  /** Phase 2 — Open-Meteo weather + elevation (keyless). */
  weather: boolean;
  /** Phase 3 — NWS active alerts (keyless, US). */
  alerts: boolean;
  /** Phase 4 — MapTiler/Stadia basemap (needs key). */
  tiles: boolean;
  /** Phase 5 — OpenRouteService routing (needs key). */
  routing: boolean;
  /** Phase 6 — Overpass shelters/buildings (keyless). */
  infra: boolean;
  /** Phase 7 — NASA FIRMS wildfire (needs key). */
  fire: boolean;
}

export const flags: LiveFlags = {
  earthquakes: toBool(env.VITE_LIVE_EARTHQUAKES),
  weather: toBool(env.VITE_LIVE_WEATHER),
  alerts: toBool(env.VITE_LIVE_ALERTS),
  tiles: toBool(env.VITE_LIVE_TILES),
  routing: toBool(env.VITE_LIVE_ROUTING),
  infra: toBool(env.VITE_LIVE_INFRA),
  fire: toBool(env.VITE_LIVE_FIRE),
};

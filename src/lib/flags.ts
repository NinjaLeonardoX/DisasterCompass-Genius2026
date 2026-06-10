// Feature flags for optional live-data sources.
//
// Every flag defaults OFF. With all flags off the app is byte-for-byte
// identical to the offline demo: every live hook falls back to seed/demo data
// and no live network calls are made. Flags are read from VITE_ env vars so
// they are inlined at build time and readable from both client and server.
//
// To enable a source locally, set the matching var in .env (see .env.example).

function flagOn(value: unknown): boolean {
  return value === "true" || value === "1" || value === true;
}

export const flags = {
  /** Open-Meteo current weather (keyless). */
  weather: flagOn(import.meta.env.VITE_LIVE_WEATHER),
  /** MapTiler basemap tiles (needs VITE_MAPTILER_KEY). */
  tiles: flagOn(import.meta.env.VITE_LIVE_TILES),
  /** OpenRouteService evacuation routing (needs server-side ORS_API_KEY). */
  routing: flagOn(import.meta.env.VITE_LIVE_ROUTING),
  /** USGS earthquakes feed (keyless). */
  earthquakes: flagOn(import.meta.env.VITE_LIVE_EARTHQUAKES),
  /** NWS active alerts (keyless, US). */
  alerts: flagOn(import.meta.env.VITE_LIVE_ALERTS),
  /** OpenWeatherMap severe-weather alerts (needs server-side OPENWEATHER_API_KEY). */
  owmAlerts: flagOn(import.meta.env.VITE_LIVE_OWM_ALERTS),
} as const;

export type FeatureFlag = keyof typeof flags;

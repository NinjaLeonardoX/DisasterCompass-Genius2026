import { fetchCurrentWeather } from "../api/weather.functions";
import { mapOpenMeteoToCurrentWeather, type CurrentWeather } from "../adapters/weather";
import { useLiveOrSeed } from "../fallback";
import { flags } from "../flags";

// Demo fallback defined HERE (not in seed.ts). Themed for the flood scenario so
// the offline card reads believably during the demo.
export const DEMO_WEATHER: CurrentWeather = {
  tempF: 58,
  conditions: "Rain",
  windMph: 12,
  precipitation: 0.31,
  code: 63,
};

/** Current conditions for a point, with seed fallback when not live. */
export function useCurrentWeather(lat: number, lng: number) {
  return useLiveOrSeed<unknown, CurrentWeather>({
    enabled: flags.weather,
    fetcher: () => fetchCurrentWeather({ data: { lat, lng } }),
    adapter: (raw) =>
      mapOpenMeteoToCurrentWeather(raw as Parameters<typeof mapOpenMeteoToCurrentWeather>[0]),
    seed: DEMO_WEATHER,
    deps: [lat, lng],
  });
}

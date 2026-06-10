// Pure weather adapter. No network, no React — just types + a mapping function
// so it can be unit-tested and bundled to the client safely.

/** Shape of the slice of the Open-Meteo response we consume. */
export interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    precipitation?: number;
    wind_speed_10m?: number;
    weather_code?: number;
  };
}

/** App-facing current-conditions shape. */
export interface CurrentWeather {
  tempF: number;
  conditions: string;
  windMph: number;
  /** Precipitation in the source unit (inches via Open-Meteo defaults). */
  precipitation: number;
  /** Raw WMO weather code. */
  code: number;
}

// WMO weather interpretation codes → short, human text.
// https://open-meteo.com/en/docs (Weather variable documentation)
export function weatherCodeToText(code: number): string {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code === 66 || code === 67) return "Freezing rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code === 85 || code === 86) return "Snow showers";
  if (code === 95) return "Thunderstorm";
  if (code === 96 || code === 99) return "Thunderstorm w/ hail";
  return "Unknown";
}

export function mapOpenMeteoToCurrentWeather(raw: OpenMeteoResponse): CurrentWeather {
  const c = raw.current;
  if (!c || typeof c.temperature_2m !== "number") {
    throw new Error("Malformed Open-Meteo response: missing current.temperature_2m");
  }
  const code = c.weather_code ?? 0;
  return {
    tempF: Math.round(c.temperature_2m),
    conditions: weatherCodeToText(code),
    windMph: Math.round(c.wind_speed_10m ?? 0),
    precipitation: c.precipitation ?? 0,
    code,
  };
}

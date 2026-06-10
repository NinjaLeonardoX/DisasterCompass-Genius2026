import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { OpenMeteoResponse } from "../adapters/weather";

// Server function: GET Open-Meteo current weather (keyless). Raw network only —
// no mapping here (that lives in the pure adapter). The handler body runs
// server-only; the client gets an RPC stub.
//
//   await fetchCurrentWeather({ data: { lat, lng } })

export const fetchCurrentWeather = createServerFn({ method: "POST" })
  .inputValidator(z.object({ lat: z.number(), lng: z.number() }))
  .handler(async ({ data }): Promise<OpenMeteoResponse> => {
    const { lat, lng } = data;
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,precipitation,wind_speed_10m,weather_code` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo request failed: ${res.status}`);
    }
    return (await res.json()) as OpenMeteoResponse;
  });

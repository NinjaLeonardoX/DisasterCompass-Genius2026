import { createServerFn } from "@tanstack/react-start";
import process from "node:process";
import { z } from "zod";

// Server function: POST OpenWeatherMap One Call 3.0 severe-weather alerts. The
// key is read server-side from process.env and NEVER shipped to the browser.
// If the key is absent the handler throws so the hook falls back to seed
// alerts. Raw network only — mapping happens in the pure adapter.

/** Shape of the slice of the OWM One Call 3.0 response we consume. */
export interface OwmOneCallResponse {
  alerts?: Array<{
    sender_name?: string;
    event?: string;
    start?: number;
    end?: number;
    description?: string;
    tags?: string[];
  }>;
}

export const fetchWeatherAlerts = createServerFn({ method: "POST" })
  .inputValidator(z.object({ lat: z.number(), lng: z.number() }))
  .handler(async ({ data }): Promise<OwmOneCallResponse> => {
    const key = process.env.OPENWEATHER_API_KEY;
    if (!key) {
      console.info("[owm] OPENWEATHER_API_KEY absent — using seed alerts.");
      throw new Error("OPENWEATHER_API_KEY not configured");
    }
    const url =
      `https://api.openweathermap.org/data/3.0/onecall?lat=${data.lat}&lon=${data.lng}` +
      `&exclude=minutely,hourly,daily&appid=${key}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OWM request failed: ${res.status}`);
    return (await res.json()) as OwmOneCallResponse;
  });

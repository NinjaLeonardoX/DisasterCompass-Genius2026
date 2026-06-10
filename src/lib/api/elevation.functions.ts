import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Open-Meteo Elevation (keyless). Batch: pass parallel latitude/longitude
// lists, get an elevation (meters) per point back. Raw network only.
//   await fetchElevations({ data: { lats: [...], lngs: [...] } })
//   → { elevation: number[] }   (same order)

export interface ElevationResponse {
  elevation?: number[];
}

export const fetchElevations = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      lats: z.array(z.number()).min(1).max(100),
      lngs: z.array(z.number()).min(1).max(100),
    }),
  )
  .handler(async ({ data }): Promise<ElevationResponse> => {
    const url =
      `https://api.open-meteo.com/v1/elevation?latitude=${data.lats.join(",")}` +
      `&longitude=${data.lngs.join(",")}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo elevation failed: ${res.status}`);
    return (await res.json()) as ElevationResponse;
  });

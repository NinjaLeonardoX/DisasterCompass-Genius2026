import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const DISASTERS = ["flood", "earthquake", "heat", "hurricane", "wildfire", "winter"] as const;

const RoutePlanSchema = z.object({
  routes: z.array(
    z.object({
      disaster: z.enum(DISASTERS),
      label: z.string(),
      firstAction: z.string(),
      destination: z.string(),
      safeRoute: z.string(),
      avoid: z.string(),
      why: z.string(),
    }),
  ),
});

export const generateCompassPlan = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      locationName: z.string().min(1).max(120),
      locationType: z.string().min(1).max(60),
      address: z.string().min(1).max(300),
      city: z.string().max(120).optional(),
      state: z.string().max(120).optional(),
      country: z.string().max(120).optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);

    const placeLine = [data.address, data.city, data.state, data.country]
      .filter(Boolean)
      .join(", ");

    const prompt = `You are a disaster-preparedness planner. Create six concise, realistic action plans for the location below, one per disaster: flood, earthquake, heat, hurricane, wildfire, winter.

Location:
- Name: ${data.locationName}
- Type: ${data.locationType}
- Address: ${placeLine}
${data.lat && data.lng ? `- Coordinates: ${data.lat}, ${data.lng}` : ""}

Rules:
- Use local terrain/region cues when possible (e.g. for coastal areas mention storm surge; for inland heat-prone areas mention cooling centers).
- "destination" should be a plausible local-style destination phrasing (e.g. "Higher-ground community center north of ${data.locationName}").
- Keep each field to one short sentence (under 160 chars).
- "label" must be a short human label like "Flood", "Earthquake", "Extreme Heat", "Hurricane", "Wildfire", "Winter Storm".
- Output ALL six disasters.`;

    try {
      const { experimental_output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        prompt,
        experimental_output: Output.object({ schema: RoutePlanSchema }),
      });
      return experimental_output;
    } catch (err) {
      // Fallback: return null so caller can use generic routes
      console.error("AI plan generation failed", err);
      return null;
    }
  });

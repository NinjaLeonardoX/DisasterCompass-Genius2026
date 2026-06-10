import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const LOCATION_TYPES = [
  "Home",
  "School",
  "University",
  "Hospital",
  "Church",
  "Library",
  "Community Center",
  "Fire Station",
  "Police Station",
  "Business",
  "Office",
  "Lodging",
  "Campus",
  "Other",
] as const;

const PlaceDetailsSchema = z.object({
  name: z.string(),
  address: z.string(),
  locationType: z.enum(LOCATION_TYPES),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

export const lookupPlaceDetails = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      query: z.string().min(2).max(200),
    }),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `You are a location lookup assistant. The user typed a short phrase that may be the name of a school, business, church, hospital, landmark, or just a partial address. Resolve it to a single best-guess real-world place and return its details.

User input: "${data.query}"

Rules:
- "name": short proper name of the place (e.g. "Lincoln High School").
- "address": best full street address you know, including city/state/country if possible. If you only know city/region, return that.
- "locationType": MUST be one of: ${LOCATION_TYPES.join(", ")}. Pick the closest match.
- Fill city/state/country when known.
- Do not invent fake street numbers if uncertain — leave the street out and use city/state instead.
- Return JSON only.`;

    try {
      const { experimental_output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        prompt,
        experimental_output: Output.object({ schema: PlaceDetailsSchema }),
      });
      return experimental_output;
    } catch (err) {
      console.error("AI place lookup failed", err);
      return null;
    }
  });

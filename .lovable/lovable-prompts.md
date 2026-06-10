# Lovable Prompts — Add Real Nearby Places + Real Routes (ADDITIVE ONLY)

Paste these into Lovable **one at a time, in order**. Wait for each to finish and
build clean before sending the next.

## Global rule (applies to every prompt below)

> **This is purely additive. Do NOT modify, refactor, rename, or delete any
> existing file's logic, data, types, seed data, or behavior.** Do not touch
> `data/seed.ts`, `adapters/evacuation.ts`, `queries/evacuation.ts`,
> `queries/routing.ts`, or any existing scoring/matching code. You may only:
> (a) create new files, and (b) add new, self-contained lines to the few existing
> files explicitly named. With the new `VITE_LIVE_PLACES` flag absent or `false`,
> the app must behave **byte-for-byte identically to today**. Keep the existing
> keyless-first, `useLiveOrSeed` seed-fallback pattern. Never throw to the UI.

---

## Prompt 1 — Add the feature flag (additive)

```
Add a new OPTIONAL feature flag for OpenStreetMap nearby places. ADDITIVE ONLY —
do not change any existing flag or behavior.

1. In src/lib/flags.ts, add ONE new entry to the existing `flags` object,
   alongside the others (do not edit the others):
       /** OpenStreetMap Overpass nearby POIs (keyless). */
       places: flagOn(import.meta.env.VITE_LIVE_PLACES),

2. In .env.example, add ONE new line under the feature-flags section:
       VITE_LIVE_PLACES=false       # OpenStreetMap Overpass nearby POIs (keyless)

Guardrails: default OFF. With it off/absent the app is unchanged. No other edits.
```

---

## Prompt 2 — Overpass server function (NEW file)

```
Create a NEW file src/lib/api/places.functions.ts. Do not edit any existing file.

It is a TanStack Start server function (same pattern as
src/lib/api/routing.functions.ts) that queries the keyless OpenStreetMap Overpass
API for amenities near a point. Raw network only — no mapping here. Return null on
any failure so the caller can fall back to seed (never throw).

Types to export:
  export type PlaceCategory =
    | "shelter" | "cooling" | "warming" | "fire_station"
    | "hospital" | "police" | "food" | "water";
  export interface OverpassElement {
    type: "node" | "way" | "relation";
    id: number;
    lat?: number; lon?: number;            // node
    center?: { lat: number; lon: number }; // way/relation
    tags?: Record<string, string>;
  }
  export interface OverpassResponse { elements?: OverpassElement[]; }

Category → OSM selector(s) (each selector is a [key, value] tag match):
  shelter:      amenity=community_centre, amenity=school, emergency=shelter
  cooling:      amenity=library, amenity=community_centre, shop=mall
  warming:      amenity=library, amenity=community_centre, amenity=place_of_worship
  fire_station: amenity=fire_station
  hospital:     amenity=hospital, amenity=clinic
  police:       amenity=police
  food:         shop=supermarket, shop=convenience
  water:        amenity=drinking_water

Build Overpass QL by emitting node/way/relation lines for EVERY selector of the
chosen category, e.g. for fire_station:
  [out:json][timeout:25];
  (
    node["amenity"="fire_station"](around:8000,LAT,LNG);
    way["amenity"="fire_station"](around:8000,LAT,LNG);
    relation["amenity"="fire_station"](around:8000,LAT,LNG);
  );
  out center 30;
(substitute the real radius/lat/lng; include all selectors for the category).

Implementation:
  export const fetchNearbyPlaces = createServerFn({ method: "POST" })
    .inputValidator(z.object({
      lat: z.number(), lng: z.number(),
      radiusMeters: z.number().min(100).max(25000).default(8000),
      category: z.enum(["shelter","cooling","warming","fire_station",
                        "hospital","police","food","water"]),
    }))
    .handler(async ({ data }): Promise<OverpassResponse | null> => { ... });

- POST form-encoded body `data=<the QL string>` to
  https://overpass-api.de/api/interpreter
  with header { "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "DisasterCompass/1.0 (preparedness app)" }.
- On non-OK or thrown error, try the mirror
  https://overpass.kumi.systems/api/interpreter once; if that also fails,
  return null. Wrap everything in try/catch and return null on failure.

Guardrails: keyless, never throw, return null on failure. New file only.
```

---

## Prompt 3 — Pure adapter (NEW file)

```
Create a NEW file src/lib/adapters/places.ts. Do not edit any existing file.
Pure functions only — no network, no React (so it is unit-testable and
client-safe), mirroring src/lib/adapters/routing.ts.

  import type { OverpassResponse, OverpassElement, PlaceCategory }
    from "../api/places.functions";

  export interface NearbyPlace {
    id: string;
    name: string;
    category: PlaceCategory;
    lat: number;
    lng: number;
    distanceMiles: number;
    address: string | null;       // assembled from addr:* tags when present
    osmTags: Record<string, string>;
  }

  export function mapOverpassToPlaces(
    raw: OverpassResponse,
    origin: [number, number],
    category: PlaceCategory,
  ): NearbyPlace[];

Rules:
- Include a SMALL LOCAL haversine helper inside THIS file (do not import or move
  anything from adapters/evacuation.ts — leave that file untouched):
    const R = 6371; // km
    function haversineMiles(a:[number,number], b:[number,number]): number { ... }
- Resolve coordinates from element.lat/lon (node) or element.center (way/relation);
  skip elements with no resolvable coords.
- Skip elements with no `tags.name` (unnamed POIs).
- name = tags.name; address = join of [addr:housenumber, addr:street, addr:city]
  when any exist, else null.
- distanceMiles = haversineMiles(origin, [lat,lng]); id = `${type}-${osmId}`.
- Sort ascending by distanceMiles; return at most the 8 nearest.

Guardrails: pure, deterministic, no existing files touched. New file only.
```

---

## Prompt 4 — Query hook + tiny demo seed (NEW file)

```
Create a NEW file src/lib/queries/places.ts. Do not edit any existing file except
none. It exposes a hook using the EXISTING useLiveOrSeed contract (see
src/lib/fallback.ts) and the EXISTING flags object.

  import { fetchNearbyPlaces, type OverpassResponse, type PlaceCategory }
    from "../api/places.functions";
  import { mapOverpassToPlaces, type NearbyPlace } from "../adapters/places";
  import { useLiveOrSeed } from "../fallback";
  import { flags } from "../flags";

- Define a small SEED_NEARBY_PLACES: Record<PlaceCategory, NearbyPlace[]> with
  1–2 North-Creek-themed demo entries per category (clearly demo data) so the
  panel still renders something when the flag is off or Overpass is unreachable.
  Use coordinates near the existing seed map center [40.027, -105.263].

  export function useNearbyPlaces(
    origin: [number, number],
    category: PlaceCategory,
    enabled = true,
  ) {
    const [lat, lng] = origin;
    return useLiveOrSeed<OverpassResponse, NearbyPlace[]>({
      enabled: enabled && flags.places,
      fetcher: () => fetchNearbyPlaces({
        data: { lat, lng, category, radiusMeters: 8000 },
      }) as Promise<OverpassResponse>,
      adapter: (raw) => mapOverpassToPlaces(raw, origin, category),
      seed: SEED_NEARBY_PLACES[category],
      deps: [lat, lng, category],
    });
  }

Guardrails: with flags.places off it returns the seed (source "demo") and makes no
network call — identical to today. New file only.
```

---

## Prompt 5 — Nearby Places panel UI + real routes (NEW component, 1 additive mount)

```
Create a NEW file src/components/compass/NearbyPlacesPanel.tsx and mount it with a
SINGLE additive insertion in src/components/phases/RespondPhase.tsx. Do not change
any existing logic, routing, or layout in RespondPhase beyond adding the panel.

NearbyPlacesPanel:
- Props: { lat: number; lng: number; disaster: DisasterKind }.
- Category chips the user can toggle: Shelter, Cooling/Warming, Fire, Hospital,
  Police, Food, Water. Map the chip to a PlaceCategory; for the temperature one,
  pass "warming" when disaster is a cold scenario, else "cooling" (default cooling).
- Call the EXISTING useNearbyPlaces([lat,lng], category) hook for the active chip.
- Render each NearbyPlace as a row: name, address (if any), distance in miles, and
  a "Directions" button.
- Reuse the EXISTING <LiveDataBadge source={source} /> (import from
  "../LiveDataBadge") in the header to show live vs demo.
- Reuse the EXISTING <EmptyState ... /> (import from "../EmptyState") when the list
  is empty, heading "No verified places found nearby", helper "Showing demo set or
  none in range."

"Directions" button — REAL routing by reusing the EXISTING server function (do not
modify it): import { fetchDirection } from "@/lib/api/routing.functions". On click:
  const ors = await fetchDirection({ data: { start: [lng, lat], dest: [place.lng, place.lat] } });
  - If ors?.features?.[0]?.properties?.summary exists, show real distance
    (summary.distance / 1609.34 mi) and time (summary.duration / 60 min) with an
    "Estimated"→"Live" badge (<LiveDataBadge source="live" />).
  - If it returns null (no ORS key), keep showing the haversine distanceMiles and a
    <LiveDataBadge source="estimated" /> with a tooltip that real roads need the key.
  Never throw; wrap in try/catch.

Attribution: add a tiny footer line "Places © OpenStreetMap contributors (ODbL)".

Mount (additive only): in RespondPhase.tsx, inside the existing right-hand column
that already renders <HouseholdCard />, add directly below it:
  <NearbyPlacesPanel lat={household.lat} lng={household.lng} disaster={disaster} />
Add the import at the top. Do not alter any other JSX, hooks, or routing in the file.

Guardrails: additive only. Existing evacuation routing, scoring, and seed flow stay
exactly as they are. New component + one mount line + one import.
```

---

## Prompt 6 — (Optional polish) Plot places on the map (additive prop)

```
Optional. Add an OPTIONAL prop to the map so nearby places can be pinned, without
changing any existing behavior.

In src/components/MapPanel.tsx (the Leaflet map), add an optional prop
`places?: NearbyPlace[]` (import the type from "@/lib/adapters/places"). When
provided, render a Leaflet marker per place with a popup showing name + distance +
category. When the prop is undefined (the default everywhere today), render exactly
as before. Then pass `places` through from
src/components/compass/MapPanel.tsx as an optional pass-through prop.

Guardrails: the prop is optional and defaults to undefined, so every existing
caller and the current map behavior are unchanged. Do not touch the existing
flood polygon, blocked roads, or route polylines.
```

---

## Notes / deliberately excluded (to honor "add-on only")

- **No rewrite of `queries/evacuation.ts` / `adapters/evacuation.ts`.** The synthetic
  compass-bearing destinations and all existing scoring stay untouched. Real routing
  to real places is delivered as a NEW, parallel "Directions" feature on the new
  panel (Prompt 5), reusing the existing `fetchDirection` server fn read-only.
- **No `lib/geo.ts` refactor.** The new adapter carries its own small haversine so no
  existing file is modified.
- **No unit-test prompt for Lovable** (it can't reliably run `bun test`). If you want
  tests, add `src/lib/adapters/places.test.ts` later via Claude Code.
- The keyless **NWS / USGS** wins and the **missing API keys** note from the main plan
  are separate from this additive set — handle them on their own, not here.

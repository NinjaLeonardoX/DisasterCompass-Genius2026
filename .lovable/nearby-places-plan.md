# Implementation Plan — Real Nearby Safety Places + Accurate Routing

## Why this plan exists

Disaster Compass is well-architected but, as of today, it does **not** display real
nearby food, water, fire stations, hospitals, or shelters, and its evacuation
routes go to **synthesized** destinations rather than real places. This plan adds
that capability without breaking the existing "flag-off ⇒ offline demo" guarantee.

### What's real today (audit)

| Capability | Real? | Where |
| --- | --- | --- |
| Address geocode / place search | ✅ live (keyless) | `lib/geocoding.ts` (Nominatim) |
| Elevation (higher-ground pick) | ✅ live (keyless) | `api/elevation.functions.ts` (Open-Meteo) |
| Current weather | ✅ live when `VITE_LIVE_WEATHER=true` | `api/weather.functions.ts` |
| Road geometry / drive time | ✅ live when `ORS_API_KEY` set | `api/routing.functions.ts` (ORS) |
| Basemap tiles | ✅ MapTiler when `MAPTILER_KEY` set, else OSM | `routes/api/tiles.$z.$x.$y.ts` |
| Severe-weather alerts | ✅ OWM when `OPENWEATHER_API_KEY` set | `api/alerts-owm.functions.ts` |
| **Nearby fire stations / hospitals / food / shelters** | ❌ **none** | — |
| Evacuation **destinations** | ❌ synthetic geometric points | `adapters/evacuation.ts` (`generateDestinations`) |

### The two gaps this plan closes

1. **No POI source.** Nothing queries "fire stations / grocery / hospital / shelter
   near me." `SHELTERS` in `data/seed.ts` are three fictional buildings in the
   fictional town of North Creek. `inferLocationType()` only classifies the user's
   *own* saved address — it does not search for nearby amenities.
2. **Routes target invented points.** `generateDestinations()` throws points 4–12 km
   out along compass bearings (`"Higher ground (NE)"`) and routes to them. Real
   roads, fake endpoints. The code honestly labels these "not a vetted shelter."

This plan replaces synthetic destinations with **real OpenStreetMap POIs** and routes
to them with the **existing ORS integration** — reusing the project's keyless-first,
seed-fallback architecture throughout.

---

## Data source decision: OpenStreetMap Overpass API

Chosen because it is **keyless, free, global**, and already consistent with the
Nominatim/OSM stack the app uses. One server function queries the Overpass API for
amenities within a radius, filtered by disaster-appropriate category.

- Endpoint: `https://overpass-api.de/api/interpreter` (POST, form-encoded `data=`).
- Mirror fallback: `https://overpass.kumi.systems/api/interpreter` if the primary 429s.
- Query by `around:<radiusMeters>,<lat>,<lng>` on `node`/`way`/`relation`.

### Amenity → disaster mapping

| Disaster | Primary OSM filters | Destination intent |
| --- | --- | --- |
| Flood | `amenity=community_centre`, `amenity=school`, `leisure=sports_centre` (higher-elevation reranked) | high-ground shelter |
| Heat | `amenity=library`, `amenity=community_centre`, `shop=mall` | cooling center |
| Hurricane | `amenity=community_centre`, `amenity=school`, `emergency=shelter` | evacuation shelter |
| Wildfire | `amenity=community_centre`, `amenity=school` (away from hazard bearing) | evacuation shelter |
| Winter | `amenity=library`, `amenity=community_centre`, `amenity=place_of_worship` | warming center |
| (All) supporting | `amenity=fire_station`, `amenity=hospital`/`clinic`, `amenity=police`, `shop=supermarket`/`convenience`, `amenity=drinking_water` | nearby help & supplies |

---

## File-by-file changes

All new code mirrors the existing **server-fn → pure-adapter → query-hook → UI**
layering and the `useLiveOrSeed` fallback contract.

### 1. NEW `src/lib/api/places.functions.ts` (server fn — raw network only)

```ts
export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number; lon?: number;          // node
  center?: { lat: number; lon: number }; // way/relation
  tags?: Record<string, string>;
}
export interface OverpassResponse { elements?: OverpassElement[]; }

// POST Overpass around a point. Keyless. Returns null on failure so the
// hook falls back to seed. category drives the tag filter set.
export const fetchNearbyPlaces = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    lat: z.number(), lng: z.number(),
    radiusMeters: z.number().min(100).max(25000).default(8000),
    category: z.enum(["shelter","cooling","warming","fire_station",
                      "hospital","police","food","water"]),
  }))
  .handler(async ({ data }) => { /* build Overpass QL, fetch, return OverpassResponse | null */ });
```

- Build Overpass QL from a `CATEGORY_FILTERS` map (e.g. `food` → `node["shop"~"supermarket|convenience"]`).
- 1 request, `out center 30;` to cap results and resolve way/relation centroids.
- Timeout + try/catch; return `null` (never throw) so the hook degrades cleanly.

### 2. NEW `src/lib/adapters/places.ts` (pure, unit-testable)

```ts
export interface NearbyPlace {
  id: string; name: string; category: PlaceCategory;
  lat: number; lng: number;
  distanceMiles: number;       // haversine from origin (reuse adapters/evacuation.haversineMiles)
  address: string | null;      // from addr:* tags when present
  osmTags: Record<string, string>;
}
export function mapOverpassToPlaces(
  raw: OverpassResponse, origin: [number, number], category: PlaceCategory,
): NearbyPlace[];
```

- Resolve coords from `lat/lon` (node) or `center` (way/relation); drop unnamed nodes.
- Compute `distanceMiles` via the **existing** `haversineMiles` in `adapters/evacuation.ts`
  (export it / move both to a shared `lib/geo.ts` — no logic change).
- Sort by distance; return top 8.

### 3. NEW `src/lib/queries/places.ts` (hook, seed fallback)

```ts
export function useNearbyPlaces(origin, category, enabled) {
  return useLiveOrSeed<OverpassResponse, NearbyPlace[]>({
    enabled: enabled && flags.places,
    fetcher: () => fetchNearbyPlaces({ data: { lat, lng, category, radiusMeters: 8000 } }),
    adapter: (raw) => mapOverpassToPlaces(raw, origin, category),
    seed: SEED_NEARBY_PLACES[category],   // small demo set so offline still renders
    deps: [lat, lng, category],
  });
}
```

- Add `places: flagOn(import.meta.env.VITE_LIVE_PLACES)` to `src/lib/flags.ts`.
- Add `VITE_LIVE_PLACES=false  # OpenStreetMap Overpass nearby POIs (keyless)` to
  `.env.example` (keep default OFF, consistent with every other source).
- Seed: a tiny `SEED_NEARBY_PLACES` (North-Creek-themed) so the demo still shows cards.

### 4. WIRE real destinations into evacuation routing

Edit `src/lib/queries/evacuation.ts` (do **not** change `adapters/evacuation.ts` math):

- When `flags.places` is on, first call `fetchNearbyPlaces` for the disaster's
  destination category (flood→shelter w/ elevation rerank, heat→cooling, etc.).
- Convert the top 3 real places into the existing `SafeDestination` shape
  (`{ id, name, lat, lng, kind, bearing }`) — **replacing** `generateDestinations()`
  output when real results exist; keep the synthetic generator as the fallback when
  Overpass returns nothing.
- Everything downstream is unchanged: real elevation rerank (flood), ORS road
  geometry per destination, `scoreRoute` ranking, recolor. Now the endpoints are
  **real named places** with real road routes instead of compass-bearing points.
- Update the honesty note: real places carry their OSM name/address; only the
  synthetic fallback keeps the "computed … not a vetted shelter" caption.

### 5. NEW UI `src/components/compass/NearbyPlacesPanel.tsx`

A card listing real nearby help, grouped by category, used in the Respond phase:

- Tabs/chips: **Shelter · Cooling/Warming · Fire · Hospital · Police · Food · Water**
  (show warming vs cooling based on selected disaster).
- Each row: name, distance (mi), "Directions" button (routes via ORS / opens the map
  pin), and a `<LiveDataBadge source={source} />` so live vs demo is explicit.
- Empty state when Overpass returns nothing: "No verified places found nearby —
  showing demo set" (reuse existing `EmptyState`).
- Mount in `src/components/phases/RespondPhase.tsx` near `HouseholdCard`, passing
  `household.lat/lng` and the current `disasterType`.

### 6. (Optional) Plot POIs on the map

`src/components/compass/MapPanel.tsx` / `src/components/MapPanel.tsx`: accept an
optional `places?: NearbyPlace[]` prop and render category-icon markers (fire,
hospital, food, shelter) with popups. Reuse Leaflet already in the tree.

---

## Guardrails / non-negotiables (match existing conventions)

1. **Keyless + flag-gated.** `VITE_LIVE_PLACES` defaults OFF. With it off, byte-for-byte
   identical to today's demo. No new server secret required (Overpass is keyless).
2. **Never throw to the UI.** Server fn returns `null`, hook returns seed — same
   contract as `fetchRoutes`/`fetchWeatherAlerts`.
3. **Respect OSM usage policy.** Single Overpass request per category change, descriptive
   `User-Agent`, client-side cache by `(lat,lng,category)` rounded to ~3 decimals
   (mirror the Nominatim cache in `geocoding.ts`); debounce on location change.
4. **Honesty preserved.** Real places show their OSM name + "OpenStreetMap" attribution
   via `LiveDataBadge`. Synthetic fallback keeps its "computed, not vetted" caption.
   Add OSM/ODbL attribution wherever POIs render.
5. **Pure adapters stay pure** and get unit tests (`places.test.ts`) like
   `scoring.test.ts` / `matching.test.ts`.

---

## Suggested build order (PR-sized steps)

1. `flags.ts` + `.env.example` flag; `lib/geo.ts` extraction of `haversineMiles`.
2. `api/places.functions.ts` + `adapters/places.ts` + `places.test.ts` (no UI yet).
3. `queries/places.ts` + `SEED_NEARBY_PLACES`.
4. `NearbyPlacesPanel.tsx` wired into `RespondPhase` (list only).
5. Real destinations into `queries/evacuation.ts` (routing upgrade).
6. Map markers (optional polish).

Each step independently falls back to seed data, so the demo never regresses.

---

## Bonus fixes surfaced during the audit (cheap, high-value)

- **Wire NWS alerts.** `lib/nwsAlerts.ts` is fully implemented but unused;
  `queries/alerts.ts` only calls OWM. Add a keyless NWS path (US) behind
  `VITE_LIVE_ALERTS` and merge with OWM — gives real alerts with no API key.
- **USGS earthquakes.** `VITE_LIVE_EARTHQUAKES` flag exists with no fetcher; a keyless
  USGS GeoJSON feed would make the earthquake path live.
- **Keys vs flags note.** Current `.env` turns on `VITE_LIVE_ROUTING`, `VITE_LIVE_TILES`,
  `VITE_LIVE_OWM_ALERTS` but ships no `ORS_API_KEY`/`MAPTILER_KEY`/`OPENWEATHER_API_KEY`,
  so those silently run in demo/estimate mode. Add the keys (or document that they're
  required) to actually light up live routing, tiles, and alerts.

# Top-of-page address entry + saved addresses + real rollup data

## Move + expand the location card
Move `LocationPermissionCard` to the very top of every phase (above the "Phase 1 · Before impact" header), and expand it into a `MyAddressCard` with three modes:

1. **Use my location** (existing browser geolocation)
2. **Enter address manually** (text field → Nominatim forward geocode)
3. **Pick a saved address** (dropdown of names + addresses from localStorage)

When the user enters or picks an address, that address becomes "household #1" — the same `Household` object every screen already consumes via `useHousehold()` — with `locationName` set to the user-provided name (e.g. "Home", "Mom's place").

Includes:
- Editable name field ("Save as: Home")
- Save / Update / Delete buttons
- Address validation (Zod: trimmed, 5–200 chars), Nominatim error toasts
- "Use as my current household" toggle per saved address

## Local persistence (no DB)
Single localStorage key: `dc:saved-addresses:v1` → `Array<{ id, name, address, lat, lng, region, county, state, country, savedAt }>`. Plus `dc:active-address-id` pointing at the currently-selected saved address. No Supabase, no server — matches the user's "just local" requirement.

## Rollups: real data only, "no data" otherwise
Resolve the entered address → `{ city, county, state }` via Nominatim, then fetch from real, CORS-friendly, no-key APIs:

- **Community (your county)** → NWS `https://api.weather.gov/alerts/active?point=lat,lng` → active alerts at that exact point
- **State (rollup)** → NWS `https://api.weather.gov/alerts/active?area={STATE}` → count + severity histogram
- **National** → NWS `https://api.weather.gov/alerts/active` → top hazards nationwide

If a fetch returns 0 alerts or fails → render "No active signals reported for this area" with the source + timestamp. Never fabricate counts. (NWS is US-only — for non-US addresses the rollups show "Coverage unavailable outside US — NWS only".)

A new `RollupPanel` component on Prepare renders the three tiers as cards (Community → State → National), each with: source link, fetched-at timestamp, signal count, top 3 alert headlines, or the explicit "no data" empty state.

## Files
- new: `src/lib/geocoding.ts` (Nominatim forward/reverse, throttled, cached)
- new: `src/lib/nwsAlerts.ts` (typed fetch wrappers, error → null)
- new: `src/lib/savedAddresses.ts` (localStorage CRUD + Zod schema)
- new: `src/components/MyAddressCard.tsx` (replaces `LocationPermissionCard` usage)
- new: `src/components/RollupPanel.tsx` (Community / State / National)
- edited: `src/components/LocationContext.tsx` — accept manual address, expose `setManualAddress`, hydrate active address from localStorage
- edited: `src/components/phases/PreparePhase.tsx` — render `MyAddressCard` at the very top and `RollupPanel` below the risk map
- edited: `src/routes/__root.tsx` — render `MyAddressCard` once at the very top of `AppChrome` instead of per-phase, so it's persistent across Prepare/Respond/Recover

## Out of scope
- No backend / no auth (per user)
- No editing of seed disaster scoring math
- No payment, no AI; rollup fetches are unauthenticated public APIs

## Technical notes
- Nominatim usage policy: max 1 req/sec, send a descriptive `User-Agent`/referrer; we throttle in `geocoding.ts` and cache in-memory + localStorage per `addressNormalized`.
- All fetches client-side (no SSR), wrapped in try/catch, with 8-second AbortController timeouts.
- NWS responses are GeoJSON; we narrow to `features[].properties.{event, severity, headline, areaDesc, sent, ends}`.
- Zod is already used elsewhere; address schema validated on submit + on load from localStorage.

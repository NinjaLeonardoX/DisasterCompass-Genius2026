# Use real device geolocation as the household's "current location"

## Goal
The Prepare → Respond → Recover flow currently pins the Rivera household to North Creek, CO (40.024, -105.272). Replace that with the user's actual device location so all routes, risk maps, and "nearest shelter" logic recenter on them.

## Approach (minimal, frontend-only)

### 1. New geolocation hook — `src/hooks/useDeviceLocation.ts`
- Wraps `navigator.geolocation.getCurrentPosition` with permission states: `idle | prompting | granted | denied | unsupported | error`.
- Returns `{ status, coords, error, request(), clear() }` where `coords = { lat, lng, accuracyMeters }`.
- Caches the last grant in `sessionStorage` so refresh doesn't re-prompt.
- SSR-safe (guards `typeof navigator`).

### 2. Location context — `src/components/LocationContext.tsx`
- Provides `{ household, source: 'device' | 'seed', requestLocation, useSeed }`.
- Starts from seed (`RIVERA_HOUSEHOLD`) so first paint is never blank.
- When the hook returns coords, returns a derived household: same name/members, but `lat/lng` from device and `locationName` reverse-geocoded to "Near {City, State}" via a free reverse-geocode (Nominatim, called once and cached).
- Mounted under the existing `PhaseProvider` in `__root.tsx`.

### 3. Prepare screen permission card
- Add a compact card at the top of `PreparePhase.tsx`: "Use your real location" with Allow / Use demo location buttons, status pill, and accuracy line.
- Hidden once `source === 'device'`.

### 4. Recenter downstream consumers
Switch these reads from the seed constant to `useLocation().household`:
- `MapPanel.tsx`, `PrepareRiskMap.tsx` — map center + household marker
- `EvacuationCountdown.tsx`, `CommunityReadiness.tsx` — proximity calculations
- `compass.tsx`, `action-plan.tsx`, `map.tsx`, `report.tsx`, `index.tsx` — route loaders that read household
- `RecoverPhase.tsx` — recovery checklist anchor

Routes/shelters/volunteers stay at their real Rochester coordinates from the landmark dataset; distances are recomputed against the new origin via the existing scoring lib (no scoring math changes).

### 5. Out of scope
- No backend, no DB writes — purely client geolocation.
- No editing of `realLandmarkScenarios.ts` (already Rochester-centered).
- No changes to `actions.ts`/`matching.ts`/`scoring.ts` math.
- No write back to seed.ts (keep as fallback).

## Technical notes
- Reverse geocode: `https://nominatim.openstreetmap.org/reverse?format=json&lat=&lon=` with a UA header; failures silently fall back to "Your location".
- Permission denied → show inline "Using demo location (North Creek, CO)" badge so the dashboard still works.
- All 4 screens (Prepare/Respond/Recover + Compass) stay functional whether granted, denied, or pending.

## Files touched
- new: `src/hooks/useDeviceLocation.ts`, `src/components/LocationContext.tsx`
- edited: `src/routes/__root.tsx`, `src/components/phases/PreparePhase.tsx`, `MapPanel.tsx`, `PrepareRiskMap.tsx`, `EvacuationCountdown.tsx`, `CommunityReadiness.tsx`, and the 5 route files listed above (single-line import + hook swap each)

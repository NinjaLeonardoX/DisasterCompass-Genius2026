## Problem
The Risk Map in the Prepare phase renders immediately — even when the user has not set a location — which is confusing because the hazards and routes have no real anchor. Also, the prompt text says "Set your safety location" which is unnecessarily wordy.

## Changes

### 1. Hide Risk Map until a location is set (`PreparePhase.tsx`)
- Use `source` from `useLocation()` (already imported) to gate the Risk Map section.
- When `source === "seed"` (no device or saved location yet), hide the entire Risk Map `<section>` and show a compact placeholder card instead:
  - Copy: *"Set your location above to see hazards and rehearsal routes near you."*
- When `source !== "seed"` (device or saved location active), render the Risk Map as normal.

**Why this works:** `LocationContext` returns `source: "seed"` only when no real location is configured. Once the user hits "Use My Location" or saves an address, `source` flips to `"device"` or `"saved"` and the map becomes meaningful.

### 2. Simplify prompt copy (`SafetyLocationPanel.tsx`)
- Change heading from **"Set your safety location"** → **"Set your location"** (line ~726).
- No other text changes needed.

## Files
- `src/components/phases/PreparePhase.tsx`
- `src/components/compass/SafetyLocationPanel.tsx`
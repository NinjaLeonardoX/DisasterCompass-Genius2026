## Goal

On `/compass/prepare`, the readiness questionnaire (Saved Safety Location → "Start readiness onboarding") should:
1. **Persist** the percentage and answers across reloads.
2. Be **editable after onboarding** without re-running the wizard.
3. Use a richer **3-category** structure per hazard instead of only "Do you know…" questions.

## Question structure (per hazard section)

Each of the 6 hazard sections becomes 3 categories × 8 questions total (3 + 3 + 2):

- **Do you know** (3): the existing route/destination/avoid-type knowledge questions, trimmed to the top 3.
- **Physical & Equipment** (3): tangible items — go-bag, flashlight/lantern, water, food, batteries, generator, masks, blankets, etc. Tailored per hazard.
- **Mental Preparedness** (2): household-practiced drill, calm-under-pressure plan, family communication / who-checks-on-whom.

Examples for **Flood**:
- *Know*: nearest higher-ground location · which roads/bridges to avoid · backup plan if route is blocked.
- *Equip*: go-bag ready · waterproof flashlight + batteries · 3 days of water/food.
- *Mental*: practiced the route with everyone · agreed family meet-up point if separated.

The "Base Profile" section stays as-is (it's people demographics, not preparedness).

## Persistence

- Add a new module `src/lib/preparedLocations.ts` with `loadLocations()` / `saveLocations()` reading/writing `localStorage` key `dc:savedLocations:v2`. Schema versioned to invalidate old data.
- `SafetyLocationPanel` hydrates state from `loadLocations()` on mount (falls back to `[MY_ADDRESS, SJFU]`), and writes back on every `setLocations` change via `useEffect`.
- Preloaded SJFU is always present even after persistence (merge if missing).

## Edit-after-onboarding

Two complementary affordances on the results panel (`selected.ready === true`):

**A. Inline toggles on the Gaps tab.** Each open gap row gets a small `Mark done` button that flips the underlying answer to `"yes"` and re-runs `computeScores`. Closed gaps disappear from the list and the percentage rises live.

**B. New "Answers" tab.** Shows every section collapsed; expanding a section reveals each question with Yes / No / Skip-section controls. Editing an answer recomputes scores and persists.

Both paths call a shared helper `updateAnswer(locationId, sectionId, questionKey, value)` that:
- Mutates `locations[i].answers`,
- Recomputes `readinessScore`, `hazardScores`, `gaps` with the existing `computeScores`,
- Persists via the new module.

## Technical notes

- File touched: `src/components/compass/SafetyLocationPanel.tsx` (questions array, persistence, new tab, edit helper, gaps-tab toggle).
- New file: `src/lib/preparedLocations.ts` (Zod-validated load/save).
- Add `category: "know" | "equip" | "mental"` to the `Question` type. `computeScores` is category-agnostic so scoring math stays unchanged.
- Wizard screen renders each hazard step as three labeled sub-cards (Know / Equip / Mental) to match the new structure, still with the Yes-to-all / No-to-all / Skip controls already present.
- Re-run onboarding button stays as an alternative to the new edit flows.
- No backend changes — purely client-side localStorage so it persists per browser, matching the existing "device-only" model used elsewhere in the app.

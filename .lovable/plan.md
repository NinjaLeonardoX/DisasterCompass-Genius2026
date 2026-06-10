## Goal

Refactor the app navigation and composition so the existing DisasterCompass features tell a clear 3-phase story (Prepare → Respond → Recover) without rewriting working logic (Leaflet map, route scores, volunteer match, coordinator, recovery checklist, scoring, seeded data).

## What changes

### 1. Sidebar (`src/components/AppSidebar.tsx`)
Replace the current 7-item nav with:
- **Mode toggle** at top: Resident | Community (via React context)
- **3 phase tabs**: Prepare (Readiness Radar) · Respond (Compass Action Plan) · Recover (Recovery Launchpad)
- **Footer secondary links**: Methodology, AI Disclosure
- Keep dark navy style, polished green active state.

### 2. New phase context
New `src/components/PhaseContext.tsx` provides `activePhase`, `mode`, `setActivePhase`, `setMode`. Wraps app in `__root.tsx`.

### 3. New main app route (replace `/compass` UX, keep route)
`src/routes/compass.tsx` becomes a host that renders:
- **Lifecycle Dashboard** (always at top): title "One family. Three moments. One clear plan." + 3 cinematic gradient cards (Prepare/Respond/Recover) with phase label, status pill, tooltip, "View Actions" expansion, creative tagline. Pure CSS premium look (no new image assets needed) — layered gradients, grid textures, glass overlays, lucide icons.
- **Phase panel** below, switches on `activePhase`.

### 4. Phase screens (new files under `src/components/phases/`)
- `PreparePhase.tsx` — Readiness Radar: drill banner, disaster picker, Rivera profile, readiness ring (SVG), gap list with Fix-now buttons that close gaps via local state, community-mode readiness summary.
- `RespondPhase.tsx` — Compass Action Plan: reuses existing `ActionCard`, `MapPanel`, collapsible `RouteScorePanel`, `VolunteerMatchCard`, compact `CoordinatorPanel`, plus a small Disaster Contrast Panel (Flood/Earthquake/Heat micro-cards).
- `RecoverPhase.tsx` — Recovery Launchpad: single-current-action queue (steps from `getRecoveryChecklist`), Recovery Packet card, "Neighbor network repurposed" using volunteer data, Resource Router chips (reuse list from existing `RecoveryPanel`).

### 5. Reusable bits
- `WhyThisPopover.tsx` — small "Why this?" tooltip used inline on action/route/volunteer/recovery (uses existing shadcn `Popover`). Removes need for AI Disclosure top tab.
- `LifecycleCard.tsx` — premium gradient card used in dashboard.

### 6. Routes
- `/compass` remains the main app (single-page phase switcher).
- Keep existing `/ai-disclosure` and `/methodology` for footer links.
- Other top-level routes (`/map`, `/report`, etc.) untouched, but no longer in sidebar.

## What stays untouched
- `src/lib/scoring.ts`, `src/lib/matching.ts`, `src/lib/recovery.ts`, `src/lib/actions.ts`
- `src/data/seed.ts`
- `src/components/compass/MapPanel.tsx` (Leaflet)
- `src/components/compass/RouteScorePanel.tsx`
- `src/components/compass/VolunteerMatchCard.tsx` (approve button behavior preserved)
- `src/components/compass/CoordinatorPanel.tsx`
- Landing page `src/routes/index.tsx`

## Visual rules
- Dark navy sidebar, light atmospheric main bg, white elevated cards, soft shadows.
- Green = safe/GO, Amber = caution/needs help, Red = danger/rejected only, Blue = water/map.
- Action heading "GO TO HIGHER GROUND" stays navy with green GO badge (not red).

## Out of scope
- No backend, auth, localStorage, live APIs.
- No new image assets — use CSS gradients + icons for cinematic cards.
- No changes to scoring math or seeded data.

## Demo flow it enables
Open app → see 3 lifecycle cards → click Prepare (Rivera gaps) → click Respond (flood GO + Route B + Approve Ana → Rivera En Route) → click Recover (next-action queue + packet + repurposed network). Tagline footer: "AI explains. Rules decide. Humans approve."

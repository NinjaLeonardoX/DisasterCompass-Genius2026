import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Radar,
  Users,
  MapPin,
  Navigation,
  ShieldAlert,
  Building2,
  Landmark,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { HouseholdCard } from "../compass/HouseholdCard";
import { VolunteerMatchCard } from "../compass/VolunteerMatchCard";
import { usePhase } from "../PhaseContext";
import {
  HAZARD_RISKS,
  PREPARE_GAPS,
  SEVERITY_META,
  COMMUNITY_MEMBERS,
  TOWN_READINESS,
  STATE_READINESS,
  NATIONAL_READINESS,
  getHazard,
  getScopeMeta,
  readinessColor,
  type HazardRisk,
  type RollupData,
} from "@/data/prepare";
import { decideAction } from "@/lib/actions";
import { getBestRoute, scoreRoute } from "@/lib/scoring";
import { ROUTES, RIVERA_HOUSEHOLD } from "@/data/seed";

// Prepare leads with the calm risk map. Leaflet touches `window`, so the map is
// lazy-loaded and only mounted client-side (mirrors src/routes/map.tsx).
const PrepareRiskMap = lazy(() => import("../compass/PrepareRiskMap"));

export function PreparePhase() {
  // One lens — the rollup selector (rendered in the page content) zooms the
  // readiness view from your household out to community, town, state, national.
  const { scope } = usePhase();
  const scopeMeta = getScopeMeta(scope);
  const [selectedId, setSelectedId] = useState<string>("flood");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Readiness gaps — seed pre-closed items so the demo opens at 60%.
  const [closed, setClosed] = useState<Set<string>>(
    () => new Set(PREPARE_GAPS.filter((g) => g.closedByDefault).map((g) => g.id)),
  );
  const [rideMatchOpen, setRideMatchOpen] = useState(false);

  const readiness = useMemo(() => Math.round((closed.size / PREPARE_GAPS.length) * 100), [closed]);

  const selectedHazard = getHazard(selectedId);

  function closeGap(id: string) {
    setClosed((s) => new Set(s).add(id));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--severity-low)]">
          Phase 1 · Before impact
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Readiness Radar</h2>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Orient on the risk map → pick a hazard → see your route → fix your gaps.
        </p>
      </div>

      <div className="dc-card flex flex-wrap items-center justify-between gap-3 p-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--severity-low)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--severity-low)] ring-1 ring-[color:var(--severity-low)]/25">
          <Radar className="h-3.5 w-3.5" /> Drill mode — no active alert
        </span>
        <p className="text-xs text-card-foreground/65">
          A calm risk map, not an alert. Same disaster logic, rehearsed in advance.
        </p>
      </div>

      {/* 1 · RISK MAP (lead element) */}
      <section className="dc-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3">
          <MapPin className="h-4 w-4 text-[color:var(--severity-low)]" aria-hidden="true" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Risk map — orient first</h3>
          <span className="ml-auto text-[11px] text-card-foreground/55">
            Tap a hazard zone or the list
          </span>
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="overflow-hidden rounded-2xl">
            {mounted ? (
              <Suspense
                fallback={
                  <div className="flex h-[380px] items-center justify-center rounded-2xl bg-surface text-sm text-foreground/60">
                    Loading risk map…
                  </div>
                }
              >
                <PrepareRiskMap selectedHazardId={selectedId} onSelectHazard={setSelectedId} />
              </Suspense>
            ) : (
              <div className="flex h-[380px] items-center justify-center rounded-2xl bg-surface text-sm text-foreground/60">
                Loading risk map…
              </div>
            )}
          </div>

          {/* Tappable hazard list with severity strip */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-card-foreground/55">
              Hazards near North Creek
            </p>
            {HAZARD_RISKS.map((h) => {
              const active = h.id === selectedId;
              const sev = SEVERITY_META[h.severity];
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedId(h.id)}
                  className={[
                    "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-[color:var(--foreground)]/70 bg-card-foreground/5 ring-1 ring-[color:var(--foreground)]/20"
                      : "border-border hover:border-slate-300",
                  ].join(" ")}
                >
                  <span className="text-sm font-semibold">{h.shortLabel}</span>
                  <span className="flex items-center gap-2">
                    <SeverityBars severity={h.severity} />
                    <span
                      className="w-16 text-right text-xs font-medium"
                      style={{ color: sev.color }}
                    >
                      {sev.label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2 · ROUTE READINESS */}
      <RouteReadinessPanel hazard={selectedHazard} />

      {/* 3 · READINESS — rolls up from household to national */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-card-foreground">
            Who&rsquo;s ready?
          </h3>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Readiness for{" "}
            <span className="font-semibold text-card-foreground">{scopeMeta.place}</span> —{" "}
            {scopeMeta.blurb}
          </p>
        </div>

        {scope === "household" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="dc-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight">
                      Readiness gaps for Rivera Family
                    </h3>
                    <p className="mt-1 text-sm text-card-foreground/70">
                      Close gaps before the warning. Each fix raises the score live.
                    </p>
                  </div>
                  <ReadinessRing value={readiness} />
                </div>

                <ul className="mt-5 space-y-3">
                  {PREPARE_GAPS.map((g) => {
                    const isClosed = closed.has(g.id);
                    const showRideMatch = g.id === "ride" && rideMatchOpen && !isClosed;
                    return (
                      <li
                        key={g.id}
                        className={[
                          "rounded-xl border p-4 transition-colors",
                          isClosed
                            ? "border-[color:var(--severity-low)]/40 bg-[color:var(--severity-low)]/5"
                            : "border-[color:var(--severity-moderate)]/40 bg-[color:var(--severity-moderate)]/5",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            {isClosed ? (
                              <CheckCircle2 className="mt-0.5 h-5 w-5 text-[color:var(--severity-low)]" />
                            ) : (
                              <AlertTriangle className="mt-0.5 h-5 w-5 text-[color:var(--severity-moderate)]" />
                            )}
                            <div>
                              <p className="font-semibold">{isClosed ? g.fixedLabel : g.label}</p>
                              {!isClosed && (
                                <p className="mt-0.5 text-xs text-card-foreground/70">{g.detail}</p>
                              )}
                            </div>
                          </div>
                          {!isClosed && !showRideMatch && (
                            <button
                              onClick={() =>
                                g.fix === "volunteer" ? setRideMatchOpen(true) : closeGap(g.id)
                              }
                              className="shrink-0 rounded-full bg-[color:var(--foreground)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
                            >
                              {g.fix === "volunteer"
                                ? "Pre-assign ride"
                                : g.id === "power"
                                  ? "Mark plan"
                                  : "Mark ready"}
                            </button>
                          )}
                        </div>

                        {/* Ride gap → reuse Volunteer Match to pre-assign a driver */}
                        {showRideMatch && (
                          <div className="mt-3">
                            <VolunteerMatchCard
                              volunteerApproved={false}
                              onApprove={() => {
                                closeGap("ride");
                                setRideMatchOpen(false);
                              }}
                            />
                            <p className="mt-2 text-[11px] text-card-foreground/60">
                              Pre-assigning now means the siren executes the plan instead of
                              starting it.
                            </p>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {readiness === 100 && (
                  <div className="mt-5 rounded-xl bg-[color:var(--severity-low)]/10 p-4 text-sm font-medium text-[color:var(--severity-low)] ring-1 ring-[color:var(--severity-low)]/30">
                    Rivera Family is rehearsed. Transport pre-matched, shelter confirmed. The siren
                    no longer starts the plan — it executes it.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <HouseholdCard />
              <div className="dc-card p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-card-foreground/55">
                  Preparedness signature
                </p>
                <p className="mt-2 text-sm font-medium text-card-foreground">
                  Preparedness is rehearsal that solves the evacuation before the siren.
                </p>
                <p className="mt-3 text-xs text-card-foreground/65">
                  Rivera Family should be pre-matched with transport before flood risk increases.
                </p>
              </div>
            </div>
          </div>
        )}

        {scope === "community" && <CommunityReadinessPanel />}

        {scope === "town" && (
          <RollupStatsPanel
            title="North Creek · town-wide"
            Icon={Building2}
            ringLabel="Town readiness"
            data={TOWN_READINESS}
          />
        )}

        {scope === "state" && (
          <RollupStatsPanel
            title="Colorado · statewide"
            Icon={Landmark}
            ringLabel="State readiness"
            data={STATE_READINESS}
            context
          />
        )}

        {scope === "national" && (
          <RollupStatsPanel
            title="United States · national"
            Icon={Globe}
            ringLabel="National readiness"
            data={NATIONAL_READINESS}
            context
          />
        )}
      </section>
    </div>
  );
}

function ReadinessBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-card-foreground/10">
      <div
        className="h-full rounded-full"
        style={{ width: `${value}%`, background: readinessColor(value) }}
      />
    </div>
  );
}

function CommunityReadinessPanel() {
  const ready = COMMUNITY_MEMBERS.filter((m) => m.readiness >= 80).length;
  const avg = Math.round(
    COMMUNITY_MEMBERS.reduce((sum, m) => sum + m.readiness, 0) / COMMUNITY_MEMBERS.length,
  );
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="dc-card p-6 lg:col-span-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[color:var(--severity-low)]" aria-hidden="true" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            North Creek block · 5 households
          </h3>
        </div>
        <ul className="mt-4 space-y-3">
          {COMMUNITY_MEMBERS.map((m) => (
            <li key={m.name} className="rounded-xl border border-border bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-card-foreground">{m.name}</p>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: readinessColor(m.readiness) }}
                >
                  {m.readiness}%
                </span>
              </div>
              <div className="mt-2">
                <ReadinessBar value={m.readiness} />
              </div>
              <p className="mt-1.5 text-xs text-card-foreground/70">{m.note}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-6">
        <div className="dc-card flex items-center gap-4 p-6">
          <ReadinessRing value={avg} />
          <div>
            <p className="text-2xl font-bold leading-none text-card-foreground">{ready} of 5</p>
            <p className="mt-1 text-sm text-card-foreground/70">households ready</p>
            <p className="mt-2 text-xs text-card-foreground/60">
              {COMMUNITY_MEMBERS.length - ready} still need pre-disaster support.
            </p>
          </div>
        </div>
        <div className="dc-card p-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "Households analyzed", v: 5 },
              { l: "Need support", v: 2 },
              { l: "Transport gap", v: 1 },
              { l: "Medicine gap", v: 1 },
            ].map((c) => (
              <div key={c.l} className="rounded-xl bg-card-foreground/5 p-3">
                <p className="text-2xl font-bold text-card-foreground">{c.v}</p>
                <p className="mt-1 text-[11px] text-card-foreground/70">{c.l}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs italic text-card-foreground/65">
            3 households rehearsed. 2 need pre-disaster support before the next warning.
          </p>
        </div>
      </div>
    </div>
  );
}

function RollupStatsPanel({
  title,
  Icon,
  ringLabel,
  data,
  context = false,
}: {
  title: string;
  Icon: LucideIcon;
  ringLabel: string;
  data: RollupData;
  context?: boolean;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="dc-card p-6 lg:col-span-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[color:var(--severity-low)]" aria-hidden="true" />
          <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
          {context && (
            <span className="ml-auto rounded-full bg-card-foreground/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-card-foreground/55">
              Situational awareness
            </span>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data.stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-card-foreground/5 p-3">
              <p className="text-xl font-bold text-card-foreground">{s.value}</p>
              <p className="mt-1 text-[11px] text-card-foreground/70">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-card-foreground/75">{data.note}</p>
      </div>

      <div className="dc-card flex flex-col items-center justify-center gap-2 p-6 text-center">
        <ReadinessRing value={data.readiness} />
        <p className="text-sm font-semibold text-card-foreground">{ringLabel}</p>
        <p className="text-xs text-card-foreground/60">
          {context
            ? "Seeded demo figures — not live data."
            : "Aggregated across households, shelters, and transport coverage."}
        </p>
      </div>
    </div>
  );
}

function SeverityBars({ severity }: { severity: HazardRisk["severity"] }) {
  const { bars, color } = SEVERITY_META[severity];
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-3 w-1.5 rounded-[1px]"
          style={{ background: i < bars ? color : "rgba(100,116,139,0.22)" }}
        />
      ))}
    </span>
  );
}

/**
 * Route readiness for the selected hazard. Uses the same decision + scoring
 * engine as Respond — flood pulls the best route and its live score — but
 * renders BELOW the map with no active route drawn on the calm map itself.
 */
function RouteReadinessPanel({ hazard }: { hazard: HazardRisk }) {
  const decision = decideAction(hazard.disasterType, RIVERA_HOUSEHOLD);

  // Flood enriches the seeded route line with the live engine score.
  let routeLine = hazard.routeLine;
  if (hazard.id === "flood") {
    const best = getBestRoute(ROUTES);
    if (best) {
      const { score } = scoreRoute(best);
      routeLine = `${hazard.routeLine} · score ${score} · ${best.distanceMiles.toFixed(1)} mi`;
    }
  }

  const Icon = hazard.postShaking ? ShieldAlert : Navigation;
  const accent = hazard.postShaking
    ? "var(--severity-moderate)"
    : hazard.full
      ? "var(--severity-low)"
      : "var(--muted-foreground)";

  return (
    <section className="dc-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wider">Route readiness</h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-card-foreground/5 px-2.5 py-1 text-[11px] font-semibold text-card-foreground/70">
          {hazard.shortLabel}
          {hazard.full ? " · full plan" : " · seeded"}
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)` }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} aria-hidden="true" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-card-foreground/55">
            First action
          </p>
          <p className="text-lg font-bold leading-snug" style={{ color: accent }}>
            {hazard.firstAction}
          </p>
          <p className="mt-1 text-sm text-card-foreground/75">{decision.primaryInstruction}</p>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-card-foreground/5 p-3">
          <dt className="text-[11px] uppercase tracking-wider text-card-foreground/55">
            Destination
          </dt>
          <dd className="mt-0.5 text-sm font-semibold">{hazard.destinationName}</dd>
          <dd className="text-xs text-card-foreground/65">{hazard.destinationType}</dd>
        </div>
        <div className="rounded-xl bg-card-foreground/5 p-3">
          <dt className="text-[11px] uppercase tracking-wider text-card-foreground/55">
            Pre-mapped route
          </dt>
          <dd className="mt-0.5 text-sm font-semibold">{routeLine}</dd>
          {hazard.postShaking && (
            <dd className="text-xs text-card-foreground/65">
              No route during shaking — assembly area is off the fault line.
            </dd>
          )}
        </div>
      </dl>

      <p className="mt-4 text-[11px] italic text-card-foreground/60">
        AI explains. Rules decide. The route is pre-mapped now so it is ready before the warning.
      </p>
    </section>
  );
}

function ReadinessRing({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const stroke =
    value === 100
      ? "var(--severity-low)"
      : value >= 50
        ? "var(--severity-moderate)"
        : "var(--severity-critical)";
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} stroke="#E2E8F0" strokeWidth="8" fill="none" />
        <circle
          cx="40"
          cy="40"
          r={r}
          stroke={stroke}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 400ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xl font-bold leading-none">{value}%</p>
        <p className="text-[9px] uppercase tracking-wider text-card-foreground/55">Ready</p>
      </div>
    </div>
  );
}

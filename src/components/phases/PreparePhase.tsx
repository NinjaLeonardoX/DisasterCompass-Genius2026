import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  Radar,
  CheckCircle2,
  AlertTriangle,
  Info,
  Droplets,
  Sun,
  Wind,
  Flame,
  Activity,
  ShieldAlert,
  ArrowUpRight,
  MapPin,
  Users,
} from "lucide-react";
import { HouseholdCard } from "../compass/HouseholdCard";
import { VolunteerMatchCard } from "../compass/VolunteerMatchCard";
import { usePhase } from "../PhaseContext";
import { RIVERA_HOUSEHOLD } from "@/data/seed";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Leaflet map is lazily imported — reuses the same component as Respond /map.
const LeafletMap = lazy(() => import("../MapPanel"));

type Hazard = "flood" | "heat" | "hurricane" | "wildfire" | "earthquake";
type Severity = "High" | "Moderate" | "Low";

interface HazardDef {
  id: Hazard;
  label: string;
  severity: Severity;
  Icon: typeof Droplets;
  source: string;
}

// Sorted highest first. FEMA National Risk Index (demo) for North Creek.
const HAZARDS: HazardDef[] = [
  { id: "flood", label: "Flood", severity: "High", Icon: Droplets, source: "FEMA NRI + FEMA flood maps" },
  { id: "heat", label: "Extreme Heat", severity: "Moderate", Icon: Sun, source: "FEMA NRI + NOAA climate normals" },
  { id: "hurricane", label: "Hurricane", severity: "Moderate", Icon: Wind, source: "FEMA NRI + NHC surge zones" },
  { id: "wildfire", label: "Wildfire", severity: "Low", Icon: Flame, source: "FEMA NRI + USFS WHP" },
  { id: "earthquake", label: "Earthquake", severity: "Low", Icon: Activity, source: "FEMA NRI + USGS faults" },
];

interface HazardPlan {
  destination: string;
  destinationType: string;
  routeSummary: string;
  firstAction: string;
  rationale: string;
  postShaking?: boolean;
}

const PLANS: Record<Hazard, HazardPlan> = {
  flood: {
    destination: "Hilltop Community Center",
    destinationType: "Higher-ground shelter outside the flood zone",
    routeSummary: "Route B — Hilltop Avenue (gains elevation, avoids river + flooded bridge).",
    firstAction: "Move to higher ground.",
    rationale: "Home sits inside the flood polygon. Route A is rejected — it crosses the flooded River Road bridge.",
  },
  earthquake: {
    destination: "Lincoln Park Open Field",
    destinationType: "Open assembly area, away from buildings + fault line",
    routeSummary: "Post-shaking only: walk west via Lincoln Ave to open ground (no overpasses).",
    firstAction: "Drop, Cover, Hold On — do not go outside during shaking.",
    rationale: "Home is ~0.6 mi from the Boulder Creek fault trace. Assembly area chosen for distance from buildings and overhead hazards.",
    postShaking: true,
  },
  hurricane: {
    destination: "Hilltop Community Center (pet-friendly, accessible)",
    destinationType: "Shelter outside surge / evacuation zone",
    routeSummary: "Pre-deadline route inland via Hilltop Ave; depart before mandatory-evacuation cutoff.",
    firstAction: "Depart before the evacuation deadline.",
    rationale: "Pet + accessibility + medical needs require a compatible shelter; surge maps place coastal routes underwater.",
  },
  wildfire: {
    destination: "Eastside Middle School Shelter",
    destinationType: "Evacuation shelter away from fire-prone west ridge",
    routeSummary: "Primary: Lincoln Ave east. Backup: River Road south. Fastest safe exit away from fire path.",
    firstAction: "Take the fastest safe exit east. Keep backup route ready.",
    rationale: "Prevailing winds push fire east-to-west; routes east of the home keep the fire behind you.",
  },
  heat: {
    destination: "Hilltop Community Center (cooling + charging)",
    destinationType: "Cooling / charging center — stay & cool",
    routeSummary: "Short transport to cooling center during peak heat hours.",
    firstAction: "Pre-arrange cooling transport; power-dependent medical first.",
    rationale: "Heat-vulnerable members + power-dependent medical equipment make a cooling/charging center the safe destination.",
  },
};

interface Gap {
  id: string;
  label: string;
  detail: string;
  fixedLabel: string;
  appliesTo: (h: Hazard) => boolean;
  opensVolunteer?: boolean;
}

const GAPS: Gap[] = [
  {
    id: "ride",
    label: "No ride arranged",
    detail: "Household has no vehicle. Pre-match a volunteer driver before any warning.",
    fixedLabel: "Pre-assigned: Ana (truck · 4 seats · pet + accessibility)",
    appliesTo: () => !RIVERA_HOUSEHOLD.hasCar,
    opensVolunteer: true,
  },
  {
    id: "gobag",
    label: "Go-bag not confirmed",
    detail: "Medications, documents, pet supplies, copies of contacts.",
    fixedLabel: "Go-bag confirmed packed",
    appliesTo: () => true,
  },
  {
    id: "backup-power",
    label: "Backup power not confirmed",
    detail: "Medical needs household — confirm a backup plan for power-dependent devices.",
    fixedLabel: "Backup power plan confirmed",
    appliesTo: (h) =>
      RIVERA_HOUSEHOLD.medicalNeeds && (h === "hurricane" || h === "wildfire" || h === "heat"),
  },
  {
    id: "shelter-transport",
    label: "Nearest suitable shelter far, no vehicle",
    detail: "Pre-arrange transport now — walking is unsafe during impact.",
    fixedLabel: "Transport pre-arranged for shelter run",
    appliesTo: (h) => !RIVERA_HOUSEHOLD.hasCar && (h === "flood" || h === "hurricane"),
  },
];

const SEVERITY_STYLES: Record<Severity, { dot: string; chip: string; bar: string; pct: number }> = {
  High: {
    dot: "bg-[color:var(--severity-critical)]",
    chip: "bg-[color:var(--severity-critical)]/12 text-[color:var(--severity-critical)] ring-[color:var(--severity-critical)]/30",
    bar: "bg-[color:var(--severity-critical)]",
    pct: 90,
  },
  Moderate: {
    dot: "bg-[color:var(--severity-moderate)]",
    chip: "bg-[color:var(--severity-moderate)]/12 text-[color:var(--severity-moderate)] ring-[color:var(--severity-moderate)]/30",
    bar: "bg-[color:var(--severity-moderate)]",
    pct: 60,
  },
  Low: {
    dot: "bg-[color:var(--severity-low)]",
    chip: "bg-[color:var(--severity-low)]/12 text-[color:var(--severity-low)] ring-[color:var(--severity-low)]/30",
    bar: "bg-[color:var(--severity-low)]",
    pct: 28,
  },
};

export function PreparePhase() {
  const [selected, setSelected] = useState<Hazard>("flood");
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [volunteerApproved, setVolunteerApproved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { mode } = usePhase();

  useEffect(() => setMounted(true), []);

  const activeGaps = useMemo(() => GAPS.filter((g) => g.appliesTo(selected)), [selected]);
  const readiness = useMemo(() => {
    if (activeGaps.length === 0) return 100;
    const fixed = activeGaps.filter((g) => closed.has(g.id)).length;
    return Math.round((fixed / activeGaps.length) * 100);
  }, [activeGaps, closed]);

  const hazardsWithOpenGaps = useMemo(() => {
    return new Set(
      HAZARDS.filter((h) =>
        GAPS.some((g) => g.appliesTo(h.id) && !closed.has(g.id)),
      ).map((h) => h.id),
    );
  }, [closed]);

  function fix(g: Gap) {
    setClosed((s) => new Set(s).add(g.id));
    if (g.opensVolunteer) setVolunteerApproved(true);
  }

  const plan = PLANS[selected];
  const selectedDef = HAZARDS.find((h) => h.id === selected)!;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--severity-low)]">
          Phase 1 · Before impact
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Readiness Radar</h2>
        <p className="mt-1 max-w-3xl text-sm text-[color:var(--muted-foreground)]">
          Calm-time rehearsal. We pre-solve <span className="font-semibold">where you go</span> and{" "}
          <span className="font-semibold">how</span> for every hazard — and surface what would stop you.
          This is not a forecast.
        </p>
      </div>

      {/* No-alert banner */}
      <div className="dc-card flex flex-wrap items-center justify-between gap-3 border-[color:var(--severity-low)]/30 p-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--severity-low)]/12 px-3 py-1 text-xs font-semibold text-[color:var(--severity-low)] ring-1 ring-[color:var(--severity-low)]/25">
          <Radar className="h-3.5 w-3.5" /> No active alert · Readiness mode
        </span>
        <p className="text-xs text-card-foreground/65">
          Same disaster engine, run in calm time as rehearsal.
        </p>
      </div>

      {/* === 1. RISK RADAR === */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-bold tracking-tight">Standing risk for your area</h3>
          <p className="text-[11px] text-card-foreground/55">
            Standing risk — FEMA National Risk Index (demo data).
            <DefensibilityPopover
              label="Why this?"
              sources={[
                "FEMA National Risk Index (county-level annualized loss)",
                "FEMA flood-hazard maps (zone overlay)",
                "USGS Quaternary faults (proximity)",
              ]}
              rule="Severity = NRI annualized-loss percentile blended with hazard-specific overlays. Tie-break highest first."
              note="Risk shown is standing exposure, not a forecast."
            />
          </p>
        </div>

        <div className="dc-card divide-y divide-border/60 overflow-hidden p-0">
          {HAZARDS.map(({ id, label, severity, Icon, source }) => {
            const active = selected === id;
            const s = SEVERITY_STYLES[severity];
            const flagged = severity === "High" && hazardsWithOpenGaps.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelected(id)}
                aria-pressed={active}
                className={[
                  "flex w-full items-center gap-4 px-4 py-3 text-left transition-colors",
                  active ? "bg-[color:var(--foreground)]/[0.04]" : "hover:bg-card-foreground/[0.03]",
                ].join(" ")}
              >
                <span className={["flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1", s.chip].join(" ")}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{label}</p>
                    {flagged && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--severity-critical)]/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--severity-critical)] ring-1 ring-[color:var(--severity-critical)]/30">
                        <ShieldAlert className="h-3 w-3" /> High risk · gaps open
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-card-foreground/8">
                    <div className={["h-full rounded-full transition-all", s.bar].join(" ")} style={{ width: `${s.pct}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-card-foreground/55">{source}</p>
                </div>
                <span className={["inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ring-1", s.chip].join(" ")}>
                  {severity}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* === 2. ROUTE READINESS === */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-center gap-2">
            <selectedDef.Icon className="h-4 w-4 text-card-foreground/65" />
            <h3 className="text-lg font-bold tracking-tight">
              Pre-mapped plan — {selectedDef.label}
            </h3>
          </div>
          <DefensibilityPopover
            label="Why this route?"
            sources={[
              "Household profile (vehicle, accessibility, pets, medical)",
              "Shelter registry (capacity, fit)",
              "FEMA flood maps + USGS faults (demo)",
            ]}
            rule="Route score = (avoid floodExposure × 35) + (elevationGain × 20) + (shelterFit × 25) − (blockedRoad × 50). See scoring.ts."
            note="AI explains; rules decide."
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          {/* Map — Leaflet for flood, lightweight summary for others */}
          <div className="dc-card overflow-hidden p-0">
            {selected === "flood" ? (
              mounted ? (
                <Suspense
                  fallback={
                    <div className="flex h-[420px] items-center justify-center text-sm text-card-foreground/60">
                      Loading map…
                    </div>
                  }
                >
                  <LeafletMap selectedRouteId="route-b" onSelectRoute={() => {}} />
                </Suspense>
              ) : (
                <div className="flex h-[420px] items-center justify-center text-sm text-card-foreground/60">
                  Loading map…
                </div>
              )
            ) : (
              <NonFloodMapSummary plan={plan} hazard={selected} />
            )}
          </div>

          {/* Plan card */}
          <div className="space-y-3">
            <div className="dc-card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-card-foreground/55">
                First action
              </p>
              <p className="mt-1.5 text-lg font-bold tracking-tight">{plan.firstAction}</p>
              {plan.postShaking && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--severity-critical)]/10 px-2.5 py-1 text-[11px] font-semibold text-[color:var(--severity-critical)] ring-1 ring-[color:var(--severity-critical)]/25">
                  <ShieldAlert className="h-3 w-3" /> Route shown is post-shaking only
                </p>
              )}

              <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
                <Row label="Destination" value={plan.destination} Icon={MapPin} />
                <Row label="Type" value={plan.destinationType} />
                <Row label="Route" value={plan.routeSummary} />
                <Row label="Why" value={plan.rationale} muted />
              </div>
            </div>
            <p className="px-1 text-xs italic text-card-foreground/60">
              You already know where you go — for all five.
            </p>
          </div>
        </div>
      </section>

      {/* === 3. READINESS GAPS === */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-bold tracking-tight">Readiness gaps — what would stop you</h3>
          <p className="text-[11px] text-card-foreground/55">
            Derived from the {RIVERA_HOUSEHOLD.name} profile + the {selectedDef.label} plan.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="dc-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-card-foreground/55">
                  Readiness score
                </p>
                <p className="mt-1 text-sm text-card-foreground/70">
                  Score rises as gaps close. Same logic runs across all five hazards.
                </p>
              </div>
              <ReadinessRing value={readiness} />
            </div>

            <ul className="mt-5 space-y-3">
              {activeGaps.length === 0 && (
                <li className="rounded-xl bg-[color:var(--severity-low)]/8 p-4 text-sm text-[color:var(--severity-low)] ring-1 ring-[color:var(--severity-low)]/25">
                  No gaps detected for this hazard.
                </li>
              )}
              {activeGaps.map((g) => {
                const isClosed = closed.has(g.id);
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
                      {!isClosed && (
                        <button
                          onClick={() => fix(g)}
                          className="shrink-0 rounded-full bg-[color:var(--foreground)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
                        >
                          Fix now
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {readiness === 100 && activeGaps.length > 0 && (
              <div className="mt-5 rounded-xl bg-[color:var(--severity-low)]/10 p-4 text-sm font-medium text-[color:var(--severity-low)] ring-1 ring-[color:var(--severity-low)]/30">
                Rehearsed for {selectedDef.label}. The siren no longer starts the plan — it executes it.
              </div>
            )}
          </div>

          <div className="space-y-5">
            <HouseholdCard />
            {!RIVERA_HOUSEHOLD.hasCar && (
              <VolunteerMatchCard
                volunteerApproved={volunteerApproved}
                onApprove={() => {
                  setVolunteerApproved(true);
                  setClosed((s) => new Set(s).add("ride"));
                }}
              />
            )}
          </div>
        </div>

        {mode === "community" && (
          <div className="dc-card p-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[color:var(--severity-low)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Community readiness</h3>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { l: "Households analyzed", v: 5 },
                { l: "Need pre-disaster support", v: 2 },
                { l: "Transport gap", v: 1 },
                { l: "Medicine gap", v: 1 },
              ].map((c) => (
                <div key={c.l} className="rounded-xl bg-card-foreground/5 p-3">
                  <p className="text-2xl font-bold">{c.v}</p>
                  <p className="mt-1 text-[11px] text-card-foreground/70">{c.l}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="dc-hover-lift mt-4 inline-flex items-center gap-2 rounded-xl bg-[color:var(--foreground)] px-4 py-2 text-xs font-semibold text-white"
            >
              Push routes to the block <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

/* ============================================================= */

function Row({
  label,
  value,
  Icon,
  muted,
}: {
  label: string;
  value: string;
  Icon?: typeof MapPin;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-card-foreground/55">
        {label}
      </p>
      <p
        className={[
          "mt-0.5 flex items-start gap-1.5 text-sm",
          muted ? "text-card-foreground/70" : "text-card-foreground",
        ].join(" ")}
      >
        {Icon && <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-card-foreground/55" />}
        <span>{value}</span>
      </p>
    </div>
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

function DefensibilityPopover({
  label,
  sources,
  rule,
  note,
}: {
  label: string;
  sources: string[];
  rule: string;
  note: string;
}) {
  return (
    <Popover>
      <PopoverTrigger className="ml-2 inline-flex items-center gap-1 rounded-full bg-card-foreground/8 px-2 py-0.5 text-[10px] font-medium text-card-foreground/70 hover:bg-card-foreground/12">
        <Info className="h-3 w-3" aria-hidden="true" />
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-80 text-xs" align="end">
        <div className="space-y-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-card-foreground/55">
              Data sources
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-card-foreground/85">
              {sources.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-card-foreground/55">
              Rule
            </p>
            <p className="mt-1 text-card-foreground/85">{rule}</p>
          </div>
          <p className="border-t border-border/60 pt-2 text-[10px] italic text-card-foreground/60">
            {note}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NonFloodMapSummary({ plan, hazard }: { plan: HazardPlan; hazard: Hazard }) {
  const gradient: Record<Hazard, string> = {
    flood: "",
    earthquake: "radial-gradient(circle at 30% 70%, #FECACA 0%, transparent 55%), linear-gradient(135deg,#FEF2F2 0%,#E2E8F0 100%)",
    hurricane: "radial-gradient(circle at 70% 30%, #CFFAFE 0%, transparent 55%), linear-gradient(135deg,#E0F2FE 0%,#E2E8F0 100%)",
    wildfire: "radial-gradient(circle at 65% 60%, #FED7AA 0%, transparent 55%), linear-gradient(135deg,#FFF7ED 0%,#E2E8F0 100%)",
    heat: "radial-gradient(circle at 50% 50%, #FEF3C7 0%, transparent 60%), linear-gradient(135deg,#FFFBEB 0%,#E2E8F0 100%)",
  };
  return (
    <div className="relative h-[420px] w-full" style={{ background: gradient[hazard] }}>
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(42,59,85,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(42,59,85,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute left-4 top-4 max-w-sm rounded-2xl bg-white/85 p-4 text-xs shadow-md ring-1 ring-border/60 backdrop-blur">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-card-foreground/55">
          Pre-mapped destination
        </p>
        <p className="mt-1 text-sm font-bold text-card-foreground">{plan.destination}</p>
        <p className="mt-1 text-card-foreground/75">{plan.routeSummary}</p>
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/85 px-3 py-2 text-[11px] font-medium text-card-foreground/75 shadow-md ring-1 ring-border/60 backdrop-blur">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[color:var(--foreground)]" /> Rivera Family
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[color:var(--severity-low)]" /> {plan.destination}
        </span>
      </div>
      {/* Simple route line */}
      <svg viewBox="0 0 400 320" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path
          d="M70,260 C140,220 240,180 330,90"
          stroke="#16A34A"
          strokeOpacity="0.25"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M70,260 C140,220 240,180 330,90"
          stroke="#16A34A"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={hazard === "earthquake" ? "10 8" : undefined}
        />
        <circle cx="70" cy="260" r="10" fill="#2a3b55" />
        <circle cx="70" cy="260" r="4" fill="#FFFFFF" />
        <circle cx="330" cy="90" r="11" fill="#16A34A" />
        <circle cx="330" cy="90" r="5" fill="#FFFFFF" />
      </svg>
    </div>
  );
}

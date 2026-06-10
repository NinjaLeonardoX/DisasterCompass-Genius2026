import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Radar, Users } from "lucide-react";
import { DisasterPicker, type DisasterKind } from "../compass/DisasterPicker";
import { HouseholdCard } from "../compass/HouseholdCard";
import { usePhase } from "../PhaseContext";

interface Gap {
  id: string;
  label: string;
  detail: string;
  fixedLabel: string;
}

const GAPS: Gap[] = [
  {
    id: "ride",
    label: "No ride arranged",
    detail: "Rivera has no vehicle. Pre-match a volunteer driver before any flood warning.",
    fixedLabel: "Pre-assigned: Ana (truck, 4 seats, pet + accessibility)",
  },
  {
    id: "shelter",
    label: "Nearest suitable shelter not confirmed",
    detail: "Needs pet-friendly, accessible, high-elevation shelter.",
    fixedLabel: "Confirmed: Hilltop Community Center",
  },
  {
    id: "gobag",
    label: "Go-bag not confirmed",
    detail: "Medications, documents, pet supplies.",
    fixedLabel: "Go-bag confirmed packed",
  },
  {
    id: "contacts",
    label: "Emergency contacts not printed",
    detail: "Printed copy survives a dead phone.",
    fixedLabel: "Emergency contacts printed",
  },
];

export function PreparePhase() {
  const [disaster, setDisaster] = useState<DisasterKind>("Flood");
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const { mode } = usePhase();

  const readiness = useMemo(
    () => Math.round((closed.size / GAPS.length) * 100),
    [closed],
  );

  function fix(id: string) {
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
          Run the plan before the warning becomes urgent.
        </p>
      </div>

      <div className="dc-card flex flex-wrap items-center justify-between gap-3 p-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--severity-low)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--severity-low)] ring-1 ring-[color:var(--severity-low)]/25">
          <Radar className="h-3.5 w-3.5" /> Drill mode — no active alert
        </span>
        <p className="text-xs text-card-foreground/65">
          The same disaster logic runs in calm time as a rehearsal.
        </p>
      </div>

      <div className="dc-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-card-foreground/55">
          Disaster type
        </p>
        <div className="mt-3">
          <DisasterPicker selected={disaster} onSelect={setDisaster} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="dc-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Readiness for Rivera Family</h3>
                <p className="mt-1 text-sm text-card-foreground/70">
                  Close gaps before the warning. Each fix updates the score live.
                </p>
              </div>
              <ReadinessRing value={readiness} />
            </div>

            <ul className="mt-5 space-y-3">
              {GAPS.map((g) => {
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
                          <p className="font-semibold">
                            {isClosed ? g.fixedLabel : g.label}
                          </p>
                          {!isClosed && (
                            <p className="mt-0.5 text-xs text-card-foreground/70">{g.detail}</p>
                          )}
                        </div>
                      </div>
                      {!isClosed && (
                        <button
                          onClick={() => fix(g.id)}
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

            {readiness === 100 && (
              <div className="mt-5 rounded-xl bg-[color:var(--severity-low)]/10 p-4 text-sm font-medium text-[color:var(--severity-low)] ring-1 ring-[color:var(--severity-low)]/30">
                Rivera Family is rehearsed. Transport pre-matched, shelter confirmed. The siren
                no longer starts the plan — it executes it.
              </div>
            )}
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
              <p className="mt-4 text-xs text-card-foreground/65 italic">
                3 households ready/shelter-ready. 2 need pre-disaster support before the next warning.
              </p>
            </div>
          )}
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

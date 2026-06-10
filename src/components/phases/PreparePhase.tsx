import { lazy, Suspense, useEffect, useState } from "react";
import { Radar, MapPin } from "lucide-react";
import { HAZARD_RISKS, SEVERITY_META, type HazardRisk } from "@/data/prepare";
import { useLocation } from "../LocationContext";
import { RollupPanel } from "../RollupPanel";

// Prepare leads with the calm risk map. Leaflet touches `window`, so the map is
// lazy-loaded and only mounted client-side (mirrors src/routes/map.tsx).
const PrepareRiskMap = lazy(() => import("../compass/PrepareRiskMap"));

export function PreparePhase() {
  const { resolved, source } = useLocation();
  const hasLocation = source !== "seed";
  const townLabel = resolved?.city ?? resolved?.county ?? "your town";
  const [selectedId, setSelectedId] = useState<string>("flood");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);


  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--severity-low)]">
          Phase 1 · Before impact
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Readiness Radar</h2>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Orient on the risk map → pick a hazard → see your route.
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


      {/* 1 · RISK MAP (lead element) — only after a real location is set */}
      {hasLocation ? (
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
                Hazards near {townLabel}
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
      ) : (
        <section className="dc-card flex items-center gap-3 p-5 text-sm text-card-foreground/75">
          <MapPin className="h-4 w-4 shrink-0 text-[color:var(--severity-low)]" aria-hidden="true" />
          Set your location above to see hazards and rehearsal routes near you.
        </section>
      )}

      <RollupPanel />

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


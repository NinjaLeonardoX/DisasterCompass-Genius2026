import { Radar } from "lucide-react";
import { RollupPanel } from "../RollupPanel";

// Prepare phase content. The risk map + hazard list now live inside the
// Saved Safety Location card (SafetyLocationPanel "Risk map" tab), so this
// component is just the phase header, drill-mode banner, and rollup.

export function PreparePhase() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--severity-low)]">
          Phase 1 · Before impact
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Prepare</h2>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          One family. Three moments. One clear plan.
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

      <RollupPanel />
    </div>
  );
}

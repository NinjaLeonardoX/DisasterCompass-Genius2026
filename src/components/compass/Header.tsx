import { Compass, ShieldCheck } from "lucide-react";

export function Header() {
  return (
    <header className="flex flex-col gap-4 rounded-2xl bg-surface px-6 py-5 text-surface-foreground shadow-md shadow-black/20 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
          <Compass className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[1.6rem]">
            <span className="text-white">Disaster</span>
            <span className="text-[color:var(--severity-low)]">Compass</span>
          </h1>
          <p className="text-sm text-slate-300">
            Community Disaster Action Planner
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-100 ring-1 ring-white/10">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--severity-low)]" aria-hidden="true" />
          North Creek Demo
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--severity-low)]/15 px-3 py-1 text-xs font-medium text-[color:var(--severity-low)] ring-1 ring-[color:var(--severity-low)]/30">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Rules-Based Guidance
        </span>
      </div>
    </header>
  );
}

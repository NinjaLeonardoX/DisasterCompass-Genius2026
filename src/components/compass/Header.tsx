import { Compass } from "lucide-react";

export function Header() {
  return (
    <header className="flex flex-col gap-3 rounded-2xl bg-card p-5 text-card-foreground shadow-md shadow-black/10 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Compass className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">DisasterCompass</h1>
          <p className="text-sm text-card-foreground/70">
            Community Disaster Action Planner
          </p>
        </div>
      </div>
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
        Demo: North Creek seeded scenario
      </span>
    </header>
  );
}

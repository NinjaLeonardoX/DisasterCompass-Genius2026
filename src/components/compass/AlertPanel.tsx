import { AlertTriangle } from "lucide-react";

export function AlertPanel() {
  return (
    <div
      role="alert"
      className="dc-glow-red relative flex items-start gap-3 overflow-hidden rounded-2xl border border-[color:var(--severity-critical)]/30 bg-gradient-to-r from-[color:var(--severity-critical)]/12 via-white to-white p-4 text-foreground"
    >
      <span
        aria-hidden="true"
        className="dc-pulse mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-[color:var(--severity-critical)]"
      />
      <AlertTriangle
        className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--severity-critical)]"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--severity-critical)]">
          Flood Warning — North Creek Active
        </p>
        <p className="mt-1 text-sm text-foreground/85">
          Low-lying roads are affected. Avoid flooded bridges and underpasses.
        </p>
      </div>
    </div>
  );
}

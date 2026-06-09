import { AlertTriangle } from "lucide-react";

export function AlertPanel() {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-[color:var(--severity-critical)]/40 bg-[color:var(--severity-critical)]/15 p-4 text-foreground"
    >
      <AlertTriangle
        className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--severity-critical)]"
        aria-hidden="true"
      />
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[color:var(--severity-critical)]">
          Flood Warning — North Creek Active
        </p>
        <p className="mt-1 text-sm text-foreground/90">
          Low-lying roads are affected. Avoid flooded bridges and underpasses.
        </p>
      </div>
    </div>
  );
}

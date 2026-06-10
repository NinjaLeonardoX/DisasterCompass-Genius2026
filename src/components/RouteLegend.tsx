import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const statusItems = [
  {
    icon: CheckCircle2,
    label: "Open",
    desc: "Passable with no major delays reported.",
    cls: "text-emerald-300",
  },
  {
    icon: AlertTriangle,
    label: "Congested",
    desc: "Slowed by traffic or partial obstructions.",
    cls: "text-amber-300",
  },
  {
    icon: XCircle,
    label: "Blocked",
    desc: "Impassable — closures, hazards, or active fire.",
    cls: "text-red-300",
  },
];

const sourceItems = [
  {
    label: "Official",
    desc: "Published by emergency services or local government.",
  },
  {
    label: "Suggested",
    desc: "Recommended by Disaster Compass based on community signals.",
  },
  {
    label: "Estimated",
    desc: "Inferred from sparse data — treat with extra caution.",
  },
];

export function RouteLegend() {
  return (
    <aside
      className="rounded-2xl border border-border bg-card p-5 text-card-foreground"
      aria-label="Route legend"
    >
      <h3 className="text-sm font-semibold">Legend</h3>

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-card-foreground/60">
          Status
        </p>
        <ul className="mt-2 space-y-2">
          {statusItems.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.label} className="flex items-start gap-2 text-xs">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${s.cls}`} aria-hidden="true" />
                <span>
                  <span className="font-medium">{s.label}</span>
                  <span className="text-card-foreground/70"> — {s.desc}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-card-foreground/60">
          Source labels
        </p>
        <ul className="mt-2 space-y-2">
          {sourceItems.map((s) => (
            <li key={s.label} className="text-xs">
              <span className="mr-1 inline-flex items-center rounded-md border border-border bg-surface px-1.5 py-0.5 font-medium text-foreground/80">
                {s.label}
              </span>
              <span className="text-card-foreground/70">{s.desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

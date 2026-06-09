import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

type Status = "Best" | "Caution" | "Rejected";

interface RouteEntry {
  name: string;
  score: number;
  status: Status;
  factors: { label: string; value: number }[];
}

const ROUTES: RouteEntry[] = [
  {
    name: "Route A",
    score: 48,
    status: "Rejected",
    factors: [
      { label: "Flood", value: -30 },
      { label: "Bridge", value: -20 },
      { label: "Blocked", value: -10 },
      { label: "Distance", value: -2 },
      { label: "Elevation", value: +5 },
      { label: "Shelter fit", value: +5 },
      { label: "Accessibility", value: 0 },
      { label: "Final", value: 48 },
    ],
  },
  {
    name: "Route B",
    score: 91,
    status: "Best",
    factors: [
      { label: "Flood", value: 0 },
      { label: "Bridge", value: 0 },
      { label: "Blocked", value: 0 },
      { label: "Distance", value: -9 },
      { label: "Elevation", value: +20 },
      { label: "Shelter fit", value: +10 },
      { label: "Accessibility", value: +5 },
      { label: "Final", value: 91 },
    ],
  },
  {
    name: "Route C",
    score: 70,
    status: "Caution",
    factors: [
      { label: "Flood", value: -5 },
      { label: "Bridge", value: 0 },
      { label: "Blocked", value: -5 },
      { label: "Distance", value: -5 },
      { label: "Elevation", value: +10 },
      { label: "Shelter fit", value: +5 },
      { label: "Accessibility", value: 0 },
      { label: "Final", value: 70 },
    ],
  },
];

function StatusBadge({ status }: { status: Status }) {
  const map = {
    Best: {
      Icon: CheckCircle2,
      cls: "bg-[color:var(--severity-low)]/15 text-[color:var(--severity-low)]",
    },
    Caution: {
      Icon: AlertTriangle,
      cls: "bg-[color:var(--severity-moderate)]/15 text-[color:var(--severity-moderate)]",
    },
    Rejected: {
      Icon: XCircle,
      cls: "bg-[color:var(--severity-critical)]/15 text-[color:var(--severity-critical)]",
    },
  } as const;
  const { Icon, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {status}
    </span>
  );
}

export function RouteScorePanel() {
  return (
    <section className="dc-card p-6 text-card-foreground">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-base font-bold tracking-tight">Route scoring</h3>
        <p className="text-xs text-card-foreground/60">Rules-based, explainable</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {ROUTES.map((r) => {
          const borderCls =
            r.status === "Best"
              ? "dc-glow-green border-[color:var(--severity-low)]/40 bg-[color:var(--severity-low)]/5"
              : r.status === "Caution"
                ? "border-[color:var(--severity-moderate)]/50 bg-[color:var(--severity-moderate)]/5 shadow-[0_12px_30px_-18px_rgba(245,158,11,0.45)]"
                : "border-[color:var(--severity-critical)]/45 bg-[color:var(--severity-critical)]/5 shadow-[0_12px_30px_-18px_rgba(220,38,38,0.45)]";
          return (
          <div
            key={r.name}
            className={`dc-hover-lift rounded-2xl border p-4 ${borderCls}`}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">{r.name}</p>
              <StatusBadge status={r.status} />
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight">{r.score}</p>
            <dl className="mt-3 space-y-1 text-xs">
              {r.factors.map((f) => (
                <div
                  key={f.label}
                  className={[
                    "flex items-center justify-between",
                    f.label === "Final" ? "mt-2 border-t border-card-foreground/10 pt-2 font-semibold" : "",
                  ].join(" ")}
                >
                  <dt className="text-card-foreground/70">{f.label}</dt>
                  <dd
                    className={
                      f.value > 0
                        ? "text-[color:var(--severity-low)]"
                        : f.value < 0
                          ? "text-[color:var(--severity-critical)]"
                          : "text-card-foreground/70"
                    }
                  >
                    {f.value > 0 ? `+${f.value}` : f.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-card-foreground/75">
        Best: Route B — avoids the flooded bridge and reaches higher ground.
      </p>
    </section>
  );
}

import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import type { RouteOption } from "@/types";
import { scoreRoute, getBestRoute } from "@/lib/scoring";
import { LiveDataBadge, type BadgeSource } from "../LiveDataBadge";

type Status = "Best" | "Safe" | "Caution" | "Rejected";

// Short labels for the engine's breakdown rows, to keep the compact infographic
// look. The values themselves come straight from scoreRoute() — no hardcoding.
const LABELS: Record<string, string> = {
  "Flood exposure": "Flood",
  "Flooded bridge": "Bridge",
  "Blocked road": "Blocked",
  "Distance & travel time": "Distance",
  "Elevation gain": "Elevation",
  "Shelter fit": "Shelter fit",
  Accessibility: "Accessibility",
};

function StatusBadge({ status }: { status: Status }) {
  const map = {
    Best: {
      Icon: ShieldCheck,
      cls: "bg-[color:var(--severity-low)]/15 text-[color:var(--severity-low)]",
    },
    Safe: {
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
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {status}
    </span>
  );
}

interface Props {
  routes: RouteOption[];
  source: BadgeSource;
  selectedRouteId?: string | null;
  onSelectRoute?: (id: string) => void;
  isLoading?: boolean;
}

export function RouteScorePanel({
  routes,
  source,
  selectedRouteId,
  onSelectRoute,
  isLoading = false,
}: Props) {
  // Rules decide: the same engine that powers /map. With routing flag off these
  // are the seed routes, so the scores read 48 / 91 / 70, best = Route B.
  const bestRoute = getBestRoute(routes);

  return (
    <section className="dc-card p-6 text-card-foreground">
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h3 className="text-base font-bold tracking-tight">Route scoring</h3>
        <div className="flex items-center gap-2">
          <LiveDataBadge source={source} />
          <p className="text-xs text-card-foreground/60">Rules-based, explainable</p>
        </div>
      </div>

      {routes.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card-foreground/5 px-4 py-10 text-sm text-card-foreground/60">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Calculating safe
              routes from your location…
            </>
          ) : (
            "No routes to show yet — set your location above to compute safe routes."
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {routes.map((route) => {
              const { score, breakdown } = scoreRoute(route);
              const isBest = bestRoute?.id === route.id;
              const status: Status = isBest
                ? "Best"
                : route.colorType === "rejected"
                  ? "Rejected"
                  : route.colorType === "caution"
                    ? "Caution"
                    : "Safe";

              const borderCls =
                status === "Best"
                  ? "dc-glow-green border-[color:var(--severity-low)]/40 bg-[color:var(--severity-low)]/5"
                  : status === "Safe"
                    ? "border-[color:var(--severity-low)]/30 bg-[color:var(--severity-low)]/5"
                    : status === "Caution"
                      ? "border-[color:var(--severity-moderate)]/50 bg-[color:var(--severity-moderate)]/5 shadow-[0_12px_30px_-18px_rgba(245,158,11,0.45)]"
                      : "border-[color:var(--severity-critical)]/45 bg-[color:var(--severity-critical)]/5 shadow-[0_12px_30px_-18px_rgba(220,38,38,0.45)]";

              const selected = selectedRouteId === route.id;
              const rows = [
                ...breakdown.map((b) => ({ label: LABELS[b.label] ?? b.label, value: b.value })),
                { label: "Final", value: score },
              ];

              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => onSelectRoute?.(route.id)}
                  className={`dc-hover-lift rounded-2xl border p-4 text-left transition ${borderCls} ${
                    selected ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{route.name}</p>
                    <StatusBadge status={status} />
                  </div>
                  <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{score}</p>
                  <dl className="mt-3 space-y-1 text-xs">
                    {rows.map((f) => (
                      <div
                        key={f.label}
                        className={[
                          "flex items-center justify-between",
                          f.label === "Final"
                            ? "mt-2 border-t border-card-foreground/10 pt-2 font-semibold"
                            : "",
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
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-card-foreground/75">
            {bestRoute
              ? `Best: ${bestRoute.name} — highest safety score for your situation.`
              : "No eligible route — escalate to a coordinator."}
          </p>
        </>
      )}
    </section>
  );
}

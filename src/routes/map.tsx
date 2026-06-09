import { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { MapPin, ShieldAlert, Check, X, AlertTriangle } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { EmptyState } from "../components/EmptyState";
import { NextBackNav } from "../components/NextBackNav";
import { useScenario } from "../components/ScenarioContext";
import { decideAction } from "@/lib/actions";
import { scoreRoute, getBestRoute } from "@/lib/scoring";
import { ROUTES, RIVERA_HOUSEHOLD } from "@/data/seed";
import type { RouteOption } from "@/types";

// MapPanel is imported lazily so Leaflet (which touches `window`) never loads
// during SSR — it only loads on the client after mount.
const MapPanel = lazy(() => import("../components/MapPanel"));

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Disaster Signal Map — Relief Radar" },
      { name: "description", content: "Live community disaster signals visualized on a map." },
    ],
  }),
  component: MapPage,
});

const COLOR_BADGE: Record<RouteOption["colorType"], string> = {
  safe: "bg-severity-low text-white",
  caution: "bg-severity-moderate text-white",
  rejected: "bg-severity-critical text-white",
};

function MapPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { selectedDisaster, selectedRouteId, setSelectedRouteId } = useScenario();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!selectedDisaster) {
    return (
      <PageShell title="Disaster Signal Map">
        <EmptyState
          icon={MapPin}
          heading="No scenario loaded"
          helper="Load a demo scenario to see signals on the map."
        />
        <NextBackNav currentPath={pathname} />
      </PageShell>
    );
  }

  const decision = decideAction(selectedDisaster, RIVERA_HOUSEHOLD);

  // No routing during an earthquake — shelter in place.
  if (!decision.shouldShowRoute) {
    return (
      <PageShell title="Disaster Signal Map">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-severity-high/40 bg-severity-high/10 px-6 py-16 text-center">
          <ShieldAlert className="mb-4 h-12 w-12 text-severity-high" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-foreground">{decision.actionLabel}</h2>
          <p className="mt-2 max-w-md text-foreground/80">{decision.primaryInstruction}</p>
          <p className="mt-3 max-w-md text-sm text-foreground/65">
            No evacuation route is shown during shaking. Routing only matters afterward, and only if
            your building is unsafe.
          </p>
        </div>
        <NextBackNav currentPath={pathname} />
      </PageShell>
    );
  }

  const bestRoute = getBestRoute(ROUTES);

  return (
    <PageShell
      title="Disaster Signal Map"
      description="Flood signals, blocked roads, and scored evacuation routes to high ground."
    >
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="overflow-hidden rounded-2xl">
          {mounted ? (
            <Suspense
              fallback={
                <div className="flex h-[520px] items-center justify-center rounded-2xl bg-surface text-sm text-foreground/60">
                  Loading map…
                </div>
              }
            >
              <MapPanel selectedRouteId={selectedRouteId} onSelectRoute={setSelectedRouteId} />
            </Suspense>
          ) : (
            <div className="flex h-[520px] items-center justify-center rounded-2xl bg-surface text-sm text-foreground/60">
              Loading map…
            </div>
          )}
        </div>

        {/* Route score panel */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">
            Route safety scores
          </h3>
          {ROUTES.map((route) => {
            const { score, breakdown, rejectedReasons } = scoreRoute(route);
            const selected = route.id === selectedRouteId;
            const recommended = bestRoute?.id === route.id;
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => setSelectedRouteId(route.id)}
                className={[
                  "w-full rounded-2xl bg-card p-4 text-left text-card-foreground shadow-md shadow-black/10 transition",
                  selected ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-primary/40",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${COLOR_BADGE[route.colorType]}`}
                    >
                      {route.colorType.toUpperCase()}
                    </span>
                    <span className="font-semibold">{route.name}</span>
                  </div>
                  <span className="text-2xl font-bold tabular-nums">{score}</span>
                </div>

                {recommended && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-severity-low">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" /> Recommended route
                  </p>
                )}

                <dl className="mt-3 space-y-1">
                  {breakdown
                    .filter((b) => b.value !== 0)
                    .map((b) => (
                      <div key={b.label} className="flex items-center justify-between text-xs">
                        <dt className="text-card-foreground/70">{b.label}</dt>
                        <dd
                          className={
                            b.value < 0
                              ? "font-medium text-severity-critical"
                              : "font-medium text-severity-low"
                          }
                        >
                          {b.value > 0 ? `+${b.value}` : b.value}
                        </dd>
                      </div>
                    ))}
                </dl>

                {rejectedReasons.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-card-foreground/10 pt-2">
                    {rejectedReasons.map((reason) => (
                      <li
                        key={reason}
                        className="flex items-center gap-1.5 text-xs text-severity-critical"
                      >
                        <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {reason}
                      </li>
                    ))}
                  </ul>
                )}

                <p className="mt-2 flex items-start gap-1.5 text-xs text-card-foreground/60">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                  {route.notes}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <NextBackNav currentPath={pathname} />
    </PageShell>
  );
}

import { lazy, Suspense, useEffect, useState } from "react";
import { Map as MapIcon } from "lucide-react";
import type { RouteOption } from "@/types";
import type { DisasterKind } from "./DisasterPicker";

// The real Leaflet map (MapTiler/OSM tiles, flood polygon, blocked roads, live
// or seed route polylines). Lazy-loaded + mount-guarded so Leaflet's `window`
// access never runs during SSR.
const LeafletMap = lazy(() => import("../MapPanel"));

interface Props {
  disaster: DisasterKind;
  routes: RouteOption[];
  selectedRouteId: string | null;
  onSelectRoute: (id: string) => void;
}

export function MapPanel({ disaster, routes, selectedRouteId, onSelectRoute }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const loading = (
    <div className="flex h-80 items-center justify-center text-sm text-card-foreground/60">
      Loading map…
    </div>
  );

  return (
    <section
      aria-label="Map"
      className="dc-elev-hero overflow-hidden rounded-3xl border border-border/70 bg-card text-card-foreground"
    >
      <div className="flex items-center justify-between border-b border-border/60 bg-white/70 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-[color:var(--severity-low)]" aria-hidden="true" />
          <h3 className="text-sm font-semibold">Neighborhood map</h3>
        </div>
        <ul className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-card-foreground/70">
          <li className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full bg-[color:var(--severity-low)] shadow-[0_0_0_3px_rgba(22,163,74,0.18)]"
              aria-hidden="true"
            />
            Best route
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full bg-[color:var(--severity-moderate)] shadow-[0_0_0_3px_rgba(245,158,11,0.18)]"
              aria-hidden="true"
            />
            Caution
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full bg-[color:var(--severity-critical)] shadow-[0_0_0_3px_rgba(220,38,38,0.18)]"
              aria-hidden="true"
            />
            Blocked
          </li>
        </ul>
      </div>

      {disaster === "Earthquake" ? (
        <div className="flex h-80 items-center justify-center p-6">
          <p className="dc-glass max-w-md rounded-2xl px-6 py-4 text-center text-sm text-foreground/80 shadow-md">
            Current guidance is to shelter in place during shaking. A route appears only after
            shaking stops if the building is unsafe.
          </p>
        </div>
      ) : mounted ? (
        <Suspense fallback={loading}>
          <LeafletMap
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={onSelectRoute}
            height="320px"
          />
        </Suspense>
      ) : (
        loading
      )}
    </section>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Phone, AlertTriangle, Map as MapIcon } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { RouteCard, type RouteCardData } from "../components/RouteCard";
import { RouteFilters } from "../components/RouteFilters";
import { RouteLegend } from "../components/RouteLegend";

export const Route = createFileRoute("/shelters-routes")({
  head: () => ({
    meta: [
      { title: "Shelters & Routes — Disaster Compass" },
      {
        name: "description",
        content: "Evacuation routes and shelter locations with advisory risk scoring.",
      },
    ],
  }),
  component: SheltersRoutesPage,
});

const MOCK_ROUTES: RouteCardData[] = [
  {
    id: "r1",
    name: "North Ridge Exit",
    fromZone: "Ridgeview Heights",
    shelter: "Northgate Community Center",
    status: "open",
    source: "Suggested",
    freshness: "Demo",
    advisoryRisk: 22,
    note: "Lower advisory risk — clear lanes reported by recent signals.",
    factors: [
      { label: "Wind exposure", value: 18 },
      { label: "Traffic load", value: 30 },
      { label: "Smoke proximity", value: 20 },
    ],
  },
  {
    id: "r2",
    name: "South Canyon Road",
    fromZone: "Canyon Mesa",
    shelter: "Mesa High School",
    status: "blocked",
    source: "Official",
    freshness: "Live • 12:04",
    advisoryRisk: 92,
    note: "Active fire crossing — DO NOT use. Follow official detour signage.",
    factors: [
      { label: "Active fire crossing", value: 95 },
      { label: "Visibility", value: 85 },
      { label: "Official closure", value: 100 },
    ],
  },
  {
    id: "r3",
    name: "Pine Hollow Bypass",
    fromZone: "Pine Hollow",
    shelter: "Westview Arena",
    status: "congested",
    source: "Suggested",
    freshness: "Live • 12:01",
    advisoryRisk: 58,
    note: "Heavy outbound traffic — expect 25–40 min delays.",
    factors: [
      { label: "Traffic load", value: 78 },
      { label: "Lane reductions", value: 55 },
      { label: "Smoke proximity", value: 40 },
    ],
  },
  {
    id: "r4",
    name: "Lakeview Connector",
    fromZone: "Lakeview East",
    shelter: "Lakeview Rec Center",
    status: "open",
    source: "Official",
    freshness: "Live • 11:58",
    advisoryRisk: 14,
    note: "Recommended primary route — clear conditions confirmed by CAL FIRE.",
    factors: [
      { label: "Wind exposure", value: 10 },
      { label: "Traffic load", value: 18 },
    ],
  },
  {
    id: "r5",
    name: "Old Mill Trail Road",
    fromZone: "Old Mill",
    shelter: "Northgate Community Center",
    status: "congested",
    source: "Estimated",
    freshness: "Demo",
    advisoryRisk: 64,
    note: "Sparse data — estimate based on similar past events. Use with caution.",
    factors: [
      { label: "Data confidence", value: 35 },
      { label: "Modelled congestion", value: 70 },
      { label: "Smoke proximity", value: 50 },
    ],
  },
  {
    id: "r6",
    name: "Eastfork Highway 12",
    fromZone: "Eastfork",
    shelter: "Mesa High School",
    status: "blocked",
    source: "Estimated",
    freshness: "Live • 11:47",
    advisoryRisk: 81,
    note: "Heads toward active fire — avoid. Awaiting official confirmation.",
    factors: [
      { label: "Modelled fire proximity", value: 88 },
      { label: "Wind exposure", value: 72 },
      { label: "Data confidence", value: 40 },
    ],
  },
];

function SheltersRoutesPage() {
  return (
    <PageShell
      title="Shelters & Routes"
      description="Evacuation routes with advisory risk scores. Mock wildfire scenario."
    >
      {/* Emergency banner */}
      <div
        className="mb-4 flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200"
        role="alert"
      >
        <Phone className="h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-sm">
          <strong>Life-threatening emergency?</strong> Call{" "}
          <a href="tel:911" className="underline font-semibold">
            911
          </a>{" "}
          immediately.
        </p>
      </div>

      <section aria-labelledby="routes-heading" className="space-y-4">
        <h2 id="routes-heading" className="sr-only">
          Evacuation routes
        </h2>

        {/* Map placeholder with route lines */}
        <div
          className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-card-foreground"
          aria-label="Map of routes (placeholder)"
        >
          <div className="flex items-center gap-2 text-sm text-card-foreground/70">
            <MapIcon className="h-4 w-4" aria-hidden="true" />
            <span>Route lines load here</span>
          </div>
          <div className="relative mt-4 h-48 w-full overflow-hidden rounded-xl bg-card-foreground/5">
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 400 200"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M20,170 C 100,120 160,140 220,80 S 360,40 390,30"
                stroke="rgb(16 185 129)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M10,40 C 80,80 140,60 210,120 S 340,180 395,160"
                stroke="rgb(245 158 11)"
                strokeWidth="3"
                fill="none"
                strokeDasharray="6 6"
                strokeLinecap="round"
              />
              <path
                d="M30,100 C 110,100 180,180 260,150 S 360,90 390,100"
                stroke="rgb(239 68 68)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Advisory disclaimer */}
        <div
          className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-100"
          role="note"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
          <p className="text-sm">
            Routes are advisory only and not guaranteed safe. Conditions change rapidly — always
            follow official local guidance and evacuation orders.
          </p>
        </div>

        {/* Filters */}
        <RouteFilters />

        <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
          {/* Route list */}
          <div className="space-y-3">
            {MOCK_ROUTES.map((r) => (
              <RouteCard key={r.id} route={r} />
            ))}
          </div>

          {/* Legend */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <RouteLegend />
          </div>
        </div>
      </section>
    </PageShell>
  );
}

import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { BarChart3, Sparkles } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { EmptyState } from "../components/EmptyState";
import { NextBackNav } from "../components/NextBackNav";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Community Dashboard — Relief Radar" },
      { name: "description", content: "Community resilience scores and resource gaps." },
    ],
  }),
  component: DashboardPage,
});

const kpiLabels = [
  "Active Signals",
  "Critical Reports",
  "Open Requests",
  "Shelters Available",
  "Power Status",
  "Water Status",
  "Volunteers Online",
  "Resilience Score",
];

const chartTiles = [
  { label: "Resources", helper: "Inventory & coverage" },
  { label: "Vulnerability", helper: "Exposed populations" },
  { label: "Priority", helper: "Ranked needs" },
  { label: "Readiness", helper: "Preparedness over time" },
];

function DashboardPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <PageShell
      title="Community Dashboard"
      description="The central hub — KPIs, gaps, and resilience signals at a glance."
    >
      <div className="relative">
        {/* Dashboard placeholder grid */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {kpiLabels.map((label) => (
              <div
                key={label}
                className="rounded-2xl bg-card p-5 text-card-foreground shadow-md shadow-black/10"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-card-foreground/60">
                  {label}
                </p>
                <div className="mt-3 h-7 w-16 rounded-md bg-card-foreground/10" aria-hidden="true" />
                <div className="mt-2 h-2 w-24 rounded-md bg-card-foreground/5" aria-hidden="true" />
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {chartTiles.map((c) => (
              <div
                key={c.label}
                className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{c.label}</h3>
                    <p className="text-xs text-card-foreground/60">{c.helper}</p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-card-foreground/30" aria-hidden="true" />
                </div>
                <div
                  className="mt-4 h-44 w-full rounded-xl bg-card-foreground/5"
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
        </div>

        {/* EmptyState overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-background/70 backdrop-blur-sm">
          <div className="pointer-events-auto w-full max-w-md px-4">
            <EmptyState
              icon={Sparkles}
              heading="Dashboard awaiting data"
              helper="Load a demo scenario to populate your dashboard."
            />
          </div>
        </div>
      </div>

      <NextBackNav currentPath={pathname} />
    </PageShell>
  );
}

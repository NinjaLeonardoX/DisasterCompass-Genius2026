import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { MessageSquarePlus, ClipboardList } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { EmptyState } from "../components/EmptyState";
import { NextBackNav } from "../components/NextBackNav";
import { useScenario } from "../components/ScenarioContext";
import { COORDINATOR_HOUSEHOLDS } from "@/data/seed";
import type { CoordinatorStatus } from "@/types";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report a Community Signal — Relief Radar" },
      { name: "description", content: "Submit a community disaster signal." },
    ],
  }),
  component: SignalDropPage,
});

const STATUS_STYLES: Record<CoordinatorStatus, string> = {
  "Needs Transport": "bg-severity-high/20 text-severity-high",
  "En Route": "bg-primary/20 text-primary",
  Safe: "bg-severity-low/20 text-severity-low",
  Unaccounted: "bg-severity-critical/20 text-severity-critical",
  Sheltering: "bg-surface text-foreground/80",
  "Needs Medicine": "bg-severity-moderate/20 text-severity-moderate",
};

function SignalDropPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { selectedDisaster, volunteerApproved } = useScenario();

  if (!selectedDisaster) {
    return (
      <PageShell title="Report a Community Signal">
        <EmptyState
          icon={MessageSquarePlus}
          heading="No scenario loaded"
          helper="Load a demo scenario to see the community coordination board."
        />
        <NextBackNav currentPath={pathname} />
      </PageShell>
    );
  }

  // Rivera's live status reflects the volunteer approval made on the Action Plan
  // page — shared state survives navigation.
  const households = COORDINATOR_HOUSEHOLDS.map((hh) =>
    hh.id === "hh-rivera" && volunteerApproved
      ? {
          ...hh,
          status: "En Route" as CoordinatorStatus,
          note: "Volunteer Ana approved — en route.",
        }
      : hh,
  );

  const counts = households.reduce<Record<string, number>>((acc, hh) => {
    acc[hh.status] = (acc[hh.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <PageShell
      title="Report a Community Signal"
      description="Coordinator board — household statuses across North Creek."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {Object.entries(counts).map(([status, count]) => (
            <span
              key={status}
              className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[status as CoordinatorStatus]}`}
            >
              {count} {status}
            </span>
          ))}
        </div>

        <section className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-card-foreground/50" aria-hidden="true" />
            <h3 className="text-lg font-semibold">Household coordination</h3>
          </div>
          <ul className="divide-y divide-card-foreground/10">
            {households.map((hh) => (
              <li key={hh.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-medium">{hh.name}</p>
                  <p className="text-sm text-card-foreground/60">{hh.note}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[hh.status]}`}
                >
                  {hh.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <NextBackNav currentPath={pathname} />
    </PageShell>
  );
}

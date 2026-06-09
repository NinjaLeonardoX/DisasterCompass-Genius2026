import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { ListChecks } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { EmptyState } from "../components/EmptyState";
import { NextBackNav } from "../components/NextBackNav";

export const Route = createFileRoute("/action-plan")({
  head: () => ({
    meta: [
      { title: "Recommended Response Plan — Relief Radar" },
      { name: "description", content: "A prioritized action plan based on community signals." },
    ],
  }),
  component: ActionPlanPage,
});

function ActionPlanPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <PageShell title="Recommended Response Plan">
      <EmptyState
        icon={ListChecks}
        heading="No scenario loaded"
        helper="Load a demo scenario to generate a prioritized action plan."
      />
      <NextBackNav currentPath={pathname} />
    </PageShell>
  );
}

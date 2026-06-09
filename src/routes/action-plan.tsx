import { createFileRoute } from "@tanstack/react-router";
import { ListChecks } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { EmptyState } from "../components/EmptyState";

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
  return (
    <PageShell title="Recommended Response Plan">
      <EmptyState
        icon={ListChecks}
        heading="No scenario loaded"
        helper="Load a demo scenario to generate a prioritized action plan."
      />
    </PageShell>
  );
}

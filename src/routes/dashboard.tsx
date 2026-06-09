import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { EmptyState } from "../components/EmptyState";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Community Dashboard — Relief Radar" },
      { name: "description", content: "Community resilience scores and resource gaps." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <PageShell title="Community Dashboard">
      <EmptyState
        icon={BarChart3}
        heading="No scenario loaded"
        helper="Load a demo scenario to view resilience scores and resource gaps."
      />
    </PageShell>
  );
}

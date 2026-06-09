import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { MessageSquarePlus } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { EmptyState } from "../components/EmptyState";
import { NextBackNav } from "../components/NextBackNav";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report a Community Signal — Relief Radar" },
      { name: "description", content: "Submit a community disaster signal." },
    ],
  }),
  component: SignalDropPage,
});

function SignalDropPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <PageShell title="Report a Community Signal">
      <EmptyState
        icon={MessageSquarePlus}
        heading="Form coming soon"
        helper="The signal report form will appear here."
      />
      <NextBackNav currentPath={pathname} />
    </PageShell>
  );
}

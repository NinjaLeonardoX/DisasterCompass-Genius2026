import { createFileRoute } from "@tanstack/react-router";
import { MessageSquarePlus } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { EmptyState } from "../components/EmptyState";

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
  return (
    <PageShell title="Report a Community Signal">
      <EmptyState
        icon={MessageSquarePlus}
        heading="Form coming soon"
        helper="The signal report form will appear here."
      />
    </PageShell>
  );
}

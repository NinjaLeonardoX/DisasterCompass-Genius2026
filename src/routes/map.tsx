import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { EmptyState } from "../components/EmptyState";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Disaster Signal Map — Relief Radar" },
      { name: "description", content: "Live community disaster signals visualized on a map." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  return (
    <PageShell title="Disaster Signal Map">
      <EmptyState
        icon={MapPin}
        heading="No scenario loaded"
        helper="Load a demo scenario to see signals on the map."
      />
    </PageShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { PreparePhase } from "../components/phases/PreparePhase";

export const Route = createFileRoute("/compass/prepare")({
  head: () => ({
    meta: [
      { title: "Prepare — Disaster Compass" },
      { name: "description", content: "Readiness Radar: household profile, hazards, and gaps to close before a warning." },
    ],
  }),
  component: PreparePhase,
});

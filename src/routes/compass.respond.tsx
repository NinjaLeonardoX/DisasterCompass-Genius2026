import { createFileRoute } from "@tanstack/react-router";
import { RespondQuickAction } from "../components/phases/RespondQuickAction";

export const Route = createFileRoute("/compass/respond")({
  head: () => ({
    meta: [
      { title: "Respond — Disaster Compass" },
      { name: "description", content: "Active alert: safe route and one-tap status during a disaster." },
    ],
  }),
  component: RespondQuickAction,
});

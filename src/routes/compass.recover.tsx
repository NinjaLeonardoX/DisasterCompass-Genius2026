import { createFileRoute } from "@tanstack/react-router";
import { RecoverPhase } from "../components/phases/RecoverPhase";

export const Route = createFileRoute("/compass/recover")({
  head: () => ({
    meta: [
      { title: "Recover — DisasterCompass" },
      { name: "description", content: "Recovery Launchpad for first responders and households after the event." },
    ],
  }),
  component: RecoverPhase,
});

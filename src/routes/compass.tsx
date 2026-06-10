import { createFileRoute } from "@tanstack/react-router";
import { LifecycleDashboard } from "../components/LifecycleDashboard";
import { SafetyLocationPanel } from "../components/compass/SafetyLocationPanel";
import { PreparePhase } from "../components/phases/PreparePhase";
import { RespondPhase } from "../components/phases/RespondPhase";
import { RecoverPhase } from "../components/phases/RecoverPhase";
import { usePhase } from "../components/PhaseContext";

export const Route = createFileRoute("/compass")({
  head: () => ({
    meta: [
      { title: "DisasterCompass — One family. Three moments. One clear plan." },
      {
        name: "description",
        content:
          "Prepare, respond, and recover with one community safety system: Readiness Radar, Compass Action Plan, Recovery Launchpad.",
      },
    ],
  }),
  component: CompassPage,
});

function CompassPage() {
  const { activePhase } = usePhase();
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-10">
        {activePhase !== "prepare" && <SafetyLocationPanel />}

        <LifecycleDashboard />


        <div className="border-t border-border/60 pt-8">
          {activePhase === "prepare" && <PreparePhase />}
          {activePhase === "respond" && <RespondPhase />}
          {activePhase === "recover" && <RecoverPhase />}
        </div>

        <footer className="rounded-2xl border border-border/60 bg-white p-5 text-center text-sm text-card-foreground/75 shadow-sm">
          <p className="font-semibold text-card-foreground">Data → Rules → Action</p>
          <p className="mt-1 text-xs">
            <span className="font-medium">Data:</span> household needs, hazards, shelters, routes, volunteers
            &nbsp;·&nbsp;
            <span className="font-medium">Rules:</span> GO / STAY / WAIT, route scoring, volunteer matching, recovery priority
            &nbsp;·&nbsp;
            <span className="font-medium">Action:</span> safe route, volunteer help, recovery packet
          </p>
          <p className="mt-2 text-[11px] italic text-card-foreground/55">
            AI explains. Rules decide. Humans approve.
          </p>
        </footer>
      </div>
    </main>
  );
}

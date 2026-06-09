import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Header } from "../components/compass/Header";
import { AlertPanel } from "../components/compass/AlertPanel";
import {
  DisasterPicker,
  type DisasterKind,
} from "../components/compass/DisasterPicker";
import { HouseholdCard } from "../components/compass/HouseholdCard";
import { ActionCard } from "../components/compass/ActionCard";
import { MapPanel } from "../components/compass/MapPanel";
import { RouteScorePanel } from "../components/compass/RouteScorePanel";
import { VolunteerMatchCard } from "../components/compass/VolunteerMatchCard";
import { CoordinatorPanel } from "../components/compass/CoordinatorPanel";
import { RecoveryPanel } from "../components/compass/RecoveryPanel";
import { AiSummaryPanel } from "../components/compass/AiSummaryPanel";
import { AboutFooter } from "../components/compass/AboutFooter";

export const Route = createFileRoute("/compass")({
  head: () => ({
    meta: [
      { title: "DisasterCompass — Community Disaster Action Planner" },
      {
        name: "description",
        content:
          "Know whether to go, stay, or wait — and what to do next. A rules-based household action plan.",
      },
    ],
  }),
  component: CompassPage,
});

function CompassPage() {
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterKind>("Flood");
  const [planGenerated, setPlanGenerated] = useState(false);
  const [volunteerApproved, setVolunteerApproved] = useState(false);
  const [showCoordinator, setShowCoordinator] = useState(true);
  const [showRecovery, setShowRecovery] = useState(false);
  const [simplifiedSummary, setSimplifiedSummary] = useState(false);

  const actionRef = useRef<HTMLDivElement>(null);

  const handleGenerate = () => {
    setPlanGenerated(true);
    actionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => setPlanGenerated(false), 1500);
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-6">
        <Header />
        <AlertPanel />

        <div className="rounded-2xl bg-card p-5 text-card-foreground shadow-md shadow-black/10">
          <p className="text-xs font-medium uppercase tracking-wide text-card-foreground/60">
            Disaster type
          </p>
          <div className="mt-3">
            <DisasterPicker
              selected={selectedDisaster}
              onSelect={setSelectedDisaster}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ActionCard
              ref={actionRef}
              disaster={selectedDisaster}
              volunteerApproved={volunteerApproved}
              highlight={planGenerated}
            />
            <MapPanel disaster={selectedDisaster} />
            {selectedDisaster === "Flood" && <RouteScorePanel />}
            <AiSummaryPanel
              simplified={simplifiedSummary}
              onToggle={setSimplifiedSummary}
            />
          </div>

          <div className="space-y-6">
            <HouseholdCard onGeneratePlan={handleGenerate} />
            {selectedDisaster === "Flood" && (
              <VolunteerMatchCard
                volunteerApproved={volunteerApproved}
                onApprove={() => setVolunteerApproved(true)}
              />
            )}

            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                Panels
              </p>
              <div className="mt-3 space-y-2">
                <label className="flex items-center justify-between gap-3 text-sm">
                  <span>Coordinator panel</span>
                  <input
                    type="checkbox"
                    checked={showCoordinator}
                    onChange={(e) => setShowCoordinator(e.target.checked)}
                    className="h-4 w-4 rounded text-primary focus:ring-primary"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-sm">
                  <span>Recovery panel</span>
                  <input
                    type="checkbox"
                    checked={showRecovery}
                    onChange={(e) => setShowRecovery(e.target.checked)}
                    className="h-4 w-4 rounded text-primary focus:ring-primary"
                  />
                </label>
              </div>
            </div>

            {showCoordinator && (
              <CoordinatorPanel volunteerApproved={volunteerApproved} />
            )}
            {showRecovery && <RecoveryPanel />}
          </div>
        </div>

        <AboutFooter />
      </div>
    </main>
  );
}

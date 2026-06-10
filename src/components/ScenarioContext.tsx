import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { DemoScenario } from "./DemoScenarioDropdown";
import type { DisasterType, RecoveryItem } from "@/types";
import { getRecoveryChecklist } from "@/lib/recovery";
import { getBestRoute } from "@/lib/scoring";
import { ROUTES, SCENARIO_TO_DISASTER } from "@/data/seed";

// Root-level Disaster Compass state. It lives above the routes (provided in
// __root.tsx) so the golden-path flow survives navigation between /, /map,
// /report and /action-plan — approving a volunteer on one page is still
// reflected on another.
interface ScenarioCtx {
  // Scenario / disaster selection (the sidebar still uses activeScenario).
  activeScenario: DemoScenario | null;
  selectedDisaster: DisasterType | null;
  planGenerated: boolean;
  setActiveScenario: (s: DemoScenario) => void;

  // Route selection on the map.
  selectedRouteId: string | null;
  setSelectedRouteId: (id: string) => void;

  // Volunteer coordination.
  volunteerApproved: boolean;
  approveVolunteer: () => void;

  // Recovery checklist.
  recoveryItems: RecoveryItem[];
  toggleRecoveryItem: (id: string) => void;

  // AI summary plain-language toggle (no live AI).
  simplifiedSummary: boolean;
  toggleSimplifiedSummary: () => void;
}

const Ctx = createContext<ScenarioCtx | null>(null);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [activeScenario, setActiveScenarioState] = useState<DemoScenario | null>(null);
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterType | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [volunteerApproved, setVolunteerApproved] = useState(false);
  const [recoveryItems, setRecoveryItems] = useState<RecoveryItem[]>([]);
  const [simplifiedSummary, setSimplifiedSummary] = useState(false);

  function setActiveScenario(s: DemoScenario) {
    const disaster = SCENARIO_TO_DISASTER[s] ?? null;
    setActiveScenarioState(s);
    setSelectedDisaster(disaster);
    // Default the recommended route to the best one (used by the flood flow).
    setSelectedRouteId(getBestRoute(ROUTES)?.id ?? null);
    // Reset the flow so each new scenario starts clean.
    setVolunteerApproved(false);
    setRecoveryItems(disaster ? getRecoveryChecklist(disaster) : []);
  }

  function approveVolunteer() {
    setVolunteerApproved(true);
  }

  function toggleRecoveryItem(id: string) {
    setRecoveryItems((items) =>
      items.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)),
    );
  }

  function toggleSimplifiedSummary() {
    setSimplifiedSummary((v) => !v);
  }

  const value = useMemo<ScenarioCtx>(
    () => ({
      activeScenario,
      selectedDisaster,
      planGenerated: selectedDisaster !== null,
      setActiveScenario,
      selectedRouteId,
      setSelectedRouteId,
      volunteerApproved,
      approveVolunteer,
      recoveryItems,
      toggleRecoveryItem,
      simplifiedSummary,
      toggleSimplifiedSummary,
    }),
    [
      activeScenario,
      selectedDisaster,
      selectedRouteId,
      volunteerApproved,
      recoveryItems,
      simplifiedSummary,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useScenario() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useScenario must be used within ScenarioProvider");
  return v;
}

import { createContext, useContext, useState, type ReactNode } from "react";
import type { DemoScenario } from "./DemoScenarioDropdown";

interface ScenarioCtx {
  activeScenario: DemoScenario | null;
  setActiveScenario: (s: DemoScenario) => void;
}

const Ctx = createContext<ScenarioCtx | null>(null);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [activeScenario, setActiveScenario] = useState<DemoScenario | null>(null);
  return <Ctx.Provider value={{ activeScenario, setActiveScenario }}>{children}</Ctx.Provider>;
}

export function useScenario() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useScenario must be used within ScenarioProvider");
  return v;
}

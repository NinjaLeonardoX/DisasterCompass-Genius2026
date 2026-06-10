import { createContext, useContext, useState, type ReactNode } from "react";
import type { ReadinessScope } from "@/data/prepare";

export type Phase = "prepare" | "respond" | "recover";
export type Mode = "resident" | "community";

interface PhaseContextValue {
  activePhase: Phase;
  setActivePhase: (p: Phase) => void;
  /** Rollup lens: household → community → town → state → national. */
  scope: ReadinessScope;
  setScope: (s: ReadinessScope) => void;
  /** Derived binary lens kept for the Respond/Recover coordinator views. */
  mode: Mode;
  setMode: (m: Mode) => void;
}

const PhaseContext = createContext<PhaseContextValue | null>(null);

export function PhaseProvider({ children }: { children: ReactNode }) {
  const [activePhase, setActivePhase] = useState<Phase>("respond");
  const [scope, setScope] = useState<ReadinessScope>("household");

  const mode: Mode = scope === "household" ? "resident" : "community";
  const setMode = (m: Mode) => setScope(m === "resident" ? "household" : "community");

  return (
    <PhaseContext.Provider value={{ activePhase, setActivePhase, scope, setScope, mode, setMode }}>
      {children}
    </PhaseContext.Provider>
  );
}

export function usePhase() {
  const ctx = useContext(PhaseContext);
  if (!ctx) throw new Error("usePhase must be used within PhaseProvider");
  return ctx;
}

export const PHASE_META: Record<
  Phase,
  { label: string; sub: string; when: "BEFORE" | "DURING" | "AFTER" }
> = {
  prepare: { label: "Prepare", sub: "Readiness Radar", when: "BEFORE" },
  respond: { label: "Respond", sub: "Compass Action Plan", when: "DURING" },
  recover: { label: "Recover", sub: "Recovery Launchpad", when: "AFTER" },
};

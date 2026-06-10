import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Phase = "prepare" | "respond" | "recover";
export type Mode = "resident" | "community";

interface PhaseContextValue {
  activePhase: Phase;
  setActivePhase: (p: Phase) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
}

const PhaseContext = createContext<PhaseContextValue | null>(null);

const PHASE_KEY = "dc.activePhase";
const MODE_KEY = "dc.mode";

function isPhase(v: unknown): v is Phase {
  return v === "prepare" || v === "respond" || v === "recover";
}
function isMode(v: unknown): v is Mode {
  return v === "resident" || v === "community";
}

export function PhaseProvider({ children }: { children: ReactNode }) {
  // Default to Prepare — the dashboard landing phase.
  const [activePhase, setActivePhaseState] = useState<Phase>("prepare");
  const [mode, setModeState] = useState<Mode>("resident");

  // Restore mode (but not phase) from sessionStorage after mount.
  useEffect(() => {
    try {
      const m = sessionStorage.getItem(MODE_KEY);
      if (isMode(m)) setModeState(m);
    } catch {
      /* ignore */
    }
  }, []);

  const setActivePhase = (p: Phase) => {
    setActivePhaseState(p);
  };
  const setMode = (m: Mode) => {
    setModeState(m);
    try {
      sessionStorage.setItem(MODE_KEY, m);
    } catch {
      /* ignore */
    }
  };


  return (
    <PhaseContext.Provider value={{ activePhase, setActivePhase, mode, setMode }}>
      {children}
    </PhaseContext.Provider>
  );
}

export function usePhase() {
  const ctx = useContext(PhaseContext);
  if (!ctx) throw new Error("usePhase must be used within PhaseProvider");
  return ctx;
}

export const PHASE_META: Record<Phase, { label: string; sub: string; when: "BEFORE" | "DURING" | "AFTER" }> = {
  prepare: { label: "Prepare", sub: "Readiness Radar", when: "BEFORE" },
  respond: { label: "Respond", sub: "Compass Action Plan", when: "DURING" },
  recover: { label: "Recover", sub: "Recovery Launchpad", when: "AFTER" },
};

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

const SCOPE_KEY = "dc.scope";
const SCOPES: ReadinessScope[] = ["household", "community", "town", "state", "national"];

function isScope(v: unknown): v is ReadinessScope {
  return typeof v === "string" && (SCOPES as string[]).includes(v);
}

export function PhaseProvider({ children }: { children: ReactNode }) {
  // Default to Prepare — the dashboard landing phase.
  const [activePhase, setActivePhaseState] = useState<Phase>("prepare");
  const [scope, setScopeState] = useState<ReadinessScope>("household");

  // Restore the lens (but not phase) from sessionStorage after mount.
  useEffect(() => {
    try {
      const s = sessionStorage.getItem(SCOPE_KEY);
      if (isScope(s)) setScopeState(s);
    } catch {
      /* ignore */
    }
  }, []);

  const setActivePhase = (p: Phase) => {
    setActivePhaseState(p);
  };

  const setScope = (s: ReadinessScope) => {
    setScopeState(s);
    try {
      sessionStorage.setItem(SCOPE_KEY, s);
    } catch {
      /* ignore */
    }
  };

  // The binary mode is derived from the rollup scope: household = resident,
  // every wider level = community (used by the Respond/Recover coordinator views).
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

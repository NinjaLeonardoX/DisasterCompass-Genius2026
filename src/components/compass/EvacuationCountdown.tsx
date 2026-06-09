import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import type { DisasterKind } from "./DisasterPicker";

// Realistic action-window per hazard (minutes until conditions become unsafe
// to leave). Calibrated for the demo so a fresh page-load shows a healthy
// "early" window that ticks down through "mid" and "critical".
const WINDOW_MINUTES: Record<DisasterKind, number> = {
  Flood: 90,
  Wildfire: 60,
  Hurricane: 240,
  Earthquake: 15, // post-event safe-assembly window
  "Extreme Heat": 180,
};

type Phase = "early" | "mid" | "critical" | "passed";

function phaseFor(remaining: number, total: number): Phase {
  if (remaining <= 0) return "passed";
  const pct = remaining / total;
  if (pct > 0.66) return "early";
  if (pct > 0.33) return "mid";
  return "critical";
}

const PHASE_META: Record<
  Phase,
  { label: string; tone: string; bar: string; ring: string; note: string }
> = {
  early: {
    label: "Early window",
    tone: "text-emerald-700",
    bar: "bg-emerald-500",
    ring: "ring-emerald-200 bg-emerald-50",
    note: "Pack go-bag, brief household, confirm route.",
  },
  mid: {
    label: "Move now",
    tone: "text-amber-700",
    bar: "bg-amber-500",
    ring: "ring-amber-200 bg-amber-50",
    note: "Leave on Route B. Coordinate volunteer pickup.",
  },
  critical: {
    label: "Critical — go immediately",
    tone: "text-red-700",
    bar: "bg-red-500",
    ring: "ring-red-200 bg-red-50",
    note: "Do not delay. Shelter in place only if route is blocked.",
  },
  passed: {
    label: "Window closed — shelter in place",
    tone: "text-slate-700",
    bar: "bg-slate-400",
    ring: "ring-slate-200 bg-slate-50",
    note: "Do not attempt to evacuate. Await coordinator contact.",
  },
};

function format(remaining: number) {
  const s = Math.max(0, Math.floor(remaining));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function EvacuationCountdown({ disaster }: { disaster: DisasterKind }) {
  const totalSeconds = WINDOW_MINUTES[disaster] * 60;
  const [remaining, setRemaining] = useState(totalSeconds);

  // Reset countdown when the disaster type changes.
  useEffect(() => {
    setRemaining(totalSeconds);
  }, [disaster, totalSeconds]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const phase = phaseFor(remaining, totalSeconds);
  const meta = PHASE_META[phase];
  const pct = Math.max(0, Math.min(100, (remaining / totalSeconds) * 100));

  const phases: { key: Phase; label: string; range: string }[] = [
    { key: "early", label: "Early", range: "100–66%" },
    { key: "mid", label: "Mid", range: "66–33%" },
    { key: "critical", label: "Critical", range: "33–0%" },
  ];

  return (
    <section
      aria-label="Evacuation countdown"
      className="dc-card p-5 text-card-foreground"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-card-foreground/70" aria-hidden />
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-card-foreground/55">
            Time-to-evacuate window
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${meta.ring} ${meta.tone}`}
        >
          {meta.label}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-3">
        <p className={`text-4xl font-bold tabular-nums ${meta.tone}`}>
          {format(remaining)}
        </p>
        <p className="text-xs text-card-foreground/55">
          of {WINDOW_MINUTES[disaster]} min total window
        </p>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${meta.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {phases.map((p) => {
          const active = p.key === phase;
          const past =
            (phase === "mid" && p.key === "early") ||
            (phase === "critical" && p.key !== "critical") ||
            phase === "passed";
          return (
            <div
              key={p.key}
              className={[
                "rounded-lg border px-3 py-2 text-left transition-colors",
                active
                  ? `${PHASE_META[p.key].ring} border-transparent`
                  : past
                    ? "border-border bg-white/40 text-card-foreground/40"
                    : "border-border bg-white/60 text-card-foreground/70",
              ].join(" ")}
            >
              <p
                className={`text-[10px] font-semibold uppercase tracking-wider ${active ? PHASE_META[p.key].tone : ""}`}
              >
                {p.label}
              </p>
              <p className="text-[10px] text-card-foreground/50">{p.range}</p>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-card-foreground/70">
        {meta.note}
      </p>
    </section>
  );
}

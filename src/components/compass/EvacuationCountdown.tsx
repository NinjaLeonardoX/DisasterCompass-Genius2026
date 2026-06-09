import { useEffect, useState } from "react";
import { Clock, Droplets, Flame, Wind, Activity, Sun } from "lucide-react";
import type { DisasterKind } from "./DisasterPicker";

// Per-hazard impact context: action window (minutes until conditions become
// unsafe to leave), the community most likely to be hit first, and a
// hazard-specific phrasing for the countdown header.
interface HazardCtx {
  windowMinutes: number;
  community: string;
  households: number;
  hazardLabel: string; // e.g. "until floodwaters reach"
  source: string; // source-of-truth attribution
  Icon: typeof Droplets;
  accent: string; // tailwind text color for icon
}

const HAZARD: Record<DisasterKind, HazardCtx> = {
  Flood: {
    windowMinutes: 90,
    community: "North Creek (Riverside)",
    households: 412,
    hazardLabel: "until floodwaters reach",
    source: "NWS gauge + county drainage model",
    Icon: Droplets,
    accent: "text-blue-600",
  },
  Wildfire: {
    windowMinutes: 60,
    community: "Ridge Hollow (WUI)",
    households: 198,
    hazardLabel: "until fire front reaches",
    source: "CAL FIRE perimeter + wind forecast",
    Icon: Flame,
    accent: "text-orange-600",
  },
  Hurricane: {
    windowMinutes: 240,
    community: "Bayshore (Surge Zone A)",
    households: 356,
    hazardLabel: "until tropical-storm winds hit",
    source: "NHC advisory + surge model",
    Icon: Wind,
    accent: "text-sky-600",
  },
  Earthquake: {
    windowMinutes: 15,
    community: "Old Town (URM block)",
    households: 174,
    hazardLabel: "safe-assembly window for",
    source: "USGS ShakeAlert + city URM inventory",
    Icon: Activity,
    accent: "text-amber-600",
  },
  "Extreme Heat": {
    windowMinutes: 180,
    community: "Senior Village",
    households: 142,
    hazardLabel: "until heat index peaks for",
    source: "NWS HeatRisk + utility load forecast",
    Icon: Sun,
    accent: "text-red-500",
  },
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
  const ctx = HAZARD[disaster];
  const totalSeconds = ctx.windowMinutes * 60;
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

  // Compute the projected impact clock time (now + remaining).
  const impactAt = new Date(Date.now() + remaining * 1000);
  const impactClock = impactAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const phases: { key: Phase; label: string; range: string }[] = [
    { key: "early", label: "Early", range: "100–66%" },
    { key: "mid", label: "Mid", range: "66–33%" },
    { key: "critical", label: "Critical", range: "33–0%" },
  ];

  const HazardIcon = ctx.Icon;

  return (
    <section
      aria-label={`${disaster} evacuation countdown for ${ctx.community}`}
      className="dc-card p-5 text-card-foreground"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <HazardIcon className={`h-4 w-4 ${ctx.accent}`} aria-hidden />
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-card-foreground/55">
            {disaster} · {ctx.community}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${meta.ring} ${meta.tone}`}
        >
          {meta.label}
        </span>
      </div>

      <p className="mt-2 text-sm text-card-foreground/75">
        Time {ctx.hazardLabel}{" "}
        <span className="font-semibold text-card-foreground">{ctx.community}</span>{" "}
        — {ctx.households} households at risk.
      </p>

      <div className="mt-3 flex items-baseline gap-3">
        <p className={`text-4xl font-bold tabular-nums ${meta.tone}`}>
          {format(remaining)}
        </p>
        <p className="text-xs text-card-foreground/55">
          impact ≈ {impactClock} · {ctx.windowMinutes} min window
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
      <p className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-card-foreground/45">
        <Clock className="h-3 w-3" aria-hidden /> Source: {ctx.source}
      </p>
    </section>
  );
}

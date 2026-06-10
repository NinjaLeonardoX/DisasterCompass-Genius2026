import { useEffect, useState } from "react";
import { Map as MapIcon } from "lucide-react";
import type { DisasterKind } from "./DisasterPicker";

interface Props {
  disaster: DisasterKind;
}

// The Respond map is a stylized live feed, not a tile map. To keep it from
// reading as a frozen screenshot we tick a "last updated" counter that resets
// every few seconds (simulating a poll) and animate the route + signals so the
// map always looks like it is refreshing in real time.
const REFRESH_SECONDS = 4;

export function MapPanel({ disaster }: Props) {
  const [secsAgo, setSecsAgo] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setSecsAgo((s) => (s + 1) % (REFRESH_SECONDS + 1)),
      1000,
    );
    return () => clearInterval(id);
  }, []);

  const justRefreshed = secsAgo === 0;

  return (
    <section
      aria-label="Map"
      className="dc-elev-hero overflow-hidden rounded-3xl border border-border/70 bg-card text-card-foreground"
    >
      <div className="flex items-center justify-between border-b border-border/60 bg-white/70 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-[color:var(--severity-low)]" aria-hidden="true" />
          <h3 className="text-sm font-semibold">Neighborhood map</h3>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--severity-low)]/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--severity-low)]">
            <span className="dc-live-dot h-1.5 w-1.5 rounded-full bg-[color:var(--severity-low)]" aria-hidden="true" />
            Live
          </span>
          <span className="text-[10px] font-medium tabular-nums text-card-foreground/55">
            {justRefreshed ? "Re-checking routes…" : `Updated ${secsAgo}s ago`}
          </span>
        </div>
        <ul className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-card-foreground/70">
          <li className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[color:var(--severity-low)] shadow-[0_0_0_3px_rgba(22,163,74,0.18)]" aria-hidden="true" />
            Best route
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[color:var(--severity-moderate)] shadow-[0_0_0_3px_rgba(245,158,11,0.18)]" aria-hidden="true" />
            Caution
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[color:var(--severity-critical)] shadow-[0_0_0_3px_rgba(220,38,38,0.18)]" aria-hidden="true" />
            Blocked
          </li>
        </ul>
      </div>
      <div
        className="relative h-80 overflow-hidden"
        role="img"
        aria-label="Map showing flood zone, blocked Route A, best Route B to Hilltop Community Center, and caution Route C"
      >
        {/* Base terrain gradient */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 70%, #DCFCE7 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, #E0F2FE 0%, transparent 60%), linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)",
          }}
        />
        {/* Grid pattern */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(42,59,85,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(42,59,85,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {disaster === "Earthquake" ? (
          <div className="relative z-10 flex h-full items-center justify-center">
            <p className="dc-glass max-w-md rounded-2xl px-6 py-4 text-center text-sm text-foreground/80 shadow-md">
              Current guidance is to shelter in place during shaking. Route appears only after
              shaking stops if the building is unsafe.
            </p>
          </div>
        ) : (
          <svg
            viewBox="0 0 400 320"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
            preserveAspectRatio="none"
          >
            {/* Flood polygon */}
            <path
              d="M0,210 C80,180 140,260 220,230 C290,205 340,250 400,225 L400,320 L0,320 Z"
              fill="#38BDF8"
              fillOpacity="0.28"
              stroke="#0EA5E9"
              strokeOpacity="0.4"
              strokeWidth="1.5"
            />
            {/* Route A — rejected (red, dashed-blocked at bridge) */}
            <path
              d="M70,260 C130,250 170,230 210,220"
              stroke="#94A3B8"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M210,220 L240,215"
              stroke="#DC2626"
              strokeWidth="4"
              strokeDasharray="6 6"
              fill="none"
              strokeLinecap="round"
            >
              {/* Blocked segment blinks so the rejection reads as a live alert */}
              <animate
                attributeName="stroke-opacity"
                values="1;0.25;1"
                dur="1.1s"
                repeatCount="indefinite"
              />
            </path>
            {/* Route C — caution amber */}
            <path
              d="M70,260 C120,220 200,200 280,160"
              stroke="#F59E0B"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              opacity="0.85"
            />
            {/* Route B — best green (thicker, glowing). The glow pulses, a dash
                pattern flows toward the shelter, and a live dot travels the
                route so the safe path never looks frozen. */}
            <path
              d="M70,260 C100,200 180,140 330,90"
              stroke="#16A34A"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
            >
              <animate
                attributeName="stroke-opacity"
                values="0.18;0.4;0.18"
                dur="2.4s"
                repeatCount="indefinite"
              />
            </path>
            <path
              d="M70,260 C100,200 180,140 330,90"
              stroke="#16A34A"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Flowing dashes — direction of safe travel */}
            <path
              d="M70,260 C100,200 180,140 330,90"
              stroke="#DCFCE7"
              strokeWidth="2.5"
              strokeDasharray="2 18"
              fill="none"
              strokeLinecap="round"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="0;-20"
                dur="0.9s"
                repeatCount="indefinite"
              />
            </path>
            {/* Live position dot traveling the route */}
            <circle r="4" fill="#FFFFFF" stroke="#16A34A" strokeWidth="2">
              <animateMotion
                dur="2.8s"
                repeatCount="indefinite"
                keyPoints="0;1"
                keyTimes="0;1"
                path="M70,260 C100,200 180,140 330,90"
              />
            </circle>
            {/* Household marker (navy) */}
            <circle cx="70" cy="260" r="10" fill="#2a3b55" />
            <circle cx="70" cy="260" r="4" fill="#FFFFFF" />
            {/* Volunteer marker (blue) with a live ping ring */}
            <circle cx="115" cy="245" r="7" fill="none" stroke="#38BDF8" strokeWidth="2">
              <animate attributeName="r" values="7;15" dur="1.9s" repeatCount="indefinite" />
              <animate
                attributeName="stroke-opacity"
                values="0.7;0"
                dur="1.9s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="115" cy="245" r="7" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2" />
            {/* Shelter (destination) with a pulsing arrival ring */}
            <circle cx="330" cy="90" r="11" fill="none" stroke="#16A34A" strokeWidth="2">
              <animate attributeName="r" values="11;22" dur="1.8s" repeatCount="indefinite" />
              <animate
                attributeName="stroke-opacity"
                values="0.6;0"
                dur="1.8s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="330" cy="90" r="11" fill="#16A34A" />
            <circle cx="330" cy="90" r="5" fill="#FFFFFF" />
          </svg>
        )}

        {disaster !== "Earthquake" && (
          <>
            {/* Floating labels */}
            <div className="dc-glass absolute left-4 top-4 rounded-xl px-3 py-2 text-[11px] font-semibold text-[color:var(--severity-low)] shadow-md ring-1 ring-[color:var(--severity-low)]/25">
              Best Route — Route B
            </div>
            <div className="dc-glass absolute right-4 top-4 rounded-xl px-3 py-2 text-[11px] font-semibold text-[color:var(--severity-critical)] shadow-md ring-1 ring-[color:var(--severity-critical)]/25">
              Rejected — Route A crosses flooded bridge
            </div>
            <div className="dc-glass absolute bottom-4 right-4 rounded-xl px-3 py-2 text-[11px] font-medium text-foreground/75 shadow-md">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[color:var(--severity-low)]" />
                Hilltop Community Center
              </span>
            </div>
            <div className="dc-glass absolute bottom-4 left-4 rounded-xl px-3 py-2 text-[11px] font-medium text-foreground/75 shadow-md">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[color:var(--foreground)]" />
                Rivera Family
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

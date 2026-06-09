import { Map as MapIcon } from "lucide-react";
import type { DisasterKind } from "./DisasterPicker";

interface Props {
  disaster: DisasterKind;
}

export function MapPanel({ disaster }: Props) {
  return (
    <section
      aria-label="Map"
      className="dc-elev-hero overflow-hidden rounded-3xl border border-border/70 bg-card text-card-foreground"
    >
      <div className="flex items-center justify-between border-b border-border/60 bg-white/70 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-[color:var(--severity-low)]" aria-hidden="true" />
          <h3 className="text-sm font-semibold">Neighborhood map</h3>
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
              "linear-gradient(rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.06) 1px, transparent 1px)",
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
            />
            {/* Route C — caution amber */}
            <path
              d="M70,260 C120,220 200,200 280,160"
              stroke="#F59E0B"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              opacity="0.85"
            />
            {/* Route B — best green (thicker, glowing) */}
            <path
              d="M70,260 C100,200 180,140 330,90"
              stroke="#16A34A"
              strokeOpacity="0.25"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M70,260 C100,200 180,140 330,90"
              stroke="#16A34A"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Household marker (navy) */}
            <circle cx="70" cy="260" r="10" fill="#0F172A" />
            <circle cx="70" cy="260" r="4" fill="#FFFFFF" />
            {/* Volunteer marker (blue) */}
            <circle cx="115" cy="245" r="7" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2" />
            {/* Shelter (green star-ish) */}
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

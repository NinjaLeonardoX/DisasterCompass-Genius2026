import { useState, type ReactNode } from "react";
import { ChevronDown, Info, type LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Phase } from "./PhaseContext";

interface Props {
  phase: Phase;
  when: "BEFORE" | "DURING" | "AFTER";
  title: string;
  subtitle: string;
  statusLabel: string;
  statusTone: "amber" | "green" | "navy";
  tooltip: string;
  tagline: string;
  actions: string[];
  Icon: LucideIcon;
  active: boolean;
  onSelect: () => void;
  /** Tailwind background classes describing the cinematic photo-like layered scene. */
  visualClass: string;
  /** Readiness Snapshot content rendered in the upper area of the card. */
  snapshot?: ReactNode;
  /** Render a muted, route-free risk-map texture behind the snapshot. */
  riskTexture?: boolean;
}

const TONE: Record<Props["statusTone"], string> = {
  amber: "bg-[color:var(--severity-moderate)] text-white ring-white/40 shadow-sm",
  green: "bg-[color:var(--severity-low)] text-white ring-white/40 shadow-sm",
  navy: "bg-slate-900/80 text-white ring-white/30 shadow-sm",
};

export function LifecycleCard({
  when,
  title,
  subtitle,
  statusLabel,
  statusTone,
  tooltip,
  tagline,
  actions,
  Icon,
  active,
  onSelect,
  visualClass,
  snapshot,
  riskTexture = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "group dc-hover-lift relative flex flex-col overflow-hidden rounded-3xl text-left text-white transition-all duration-300 ease-out hover:scale-[1.03]",
        "min-h-[340px] border cursor-pointer",
        active
          ? "border-[color:var(--severity-low)]/70 ring-2 ring-[color:var(--severity-low)]/60 shadow-[0_24px_70px_-20px_rgba(22,163,74,0.55)]"
          : "border-white/10 shadow-[0_18px_55px_rgba(15,26,46,0.35)] hover:shadow-[0_24px_70px_-20px_rgba(15,26,46,0.55)]",
      ].join(" ")}
    >
      {/* Cinematic visual layer */}
      <div aria-hidden="true" className={`absolute inset-0 ${visualClass}`} />
      {/* Texture grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      {/* Muted, route-free risk-map texture (decorative only) */}
      {riskTexture && (
        <svg
          aria-hidden="true"
          viewBox="0 0 400 340"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full opacity-[0.13]"
        >
          {/* contour lines */}
          {[40, 90, 140, 190].map((y) => (
            <path
              key={y}
              d={`M0,${y} C90,${y - 26} 150,${y + 24} 240,${y - 8} C320,${y - 32} 360,${y + 14} 400,${y - 4}`}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          ))}
          {/* shaded risk zone (no route) */}
          <path
            d="M40,250 C120,225 170,290 250,260 C310,238 360,278 400,258 L400,340 L0,340 Z"
            fill="#FFFFFF"
            fillOpacity="0.5"
          />
        </svg>
      )}

      {/* Subtle bottom legibility scrim — keeps phase color visible */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 via-black/20 to-transparent"
      />

      <div className="relative z-10 flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/85 ring-1 ring-white/15 backdrop-blur">
            <Icon className="h-3 w-3" />
            {when}
          </span>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15 backdrop-blur hover:bg-white/20"
                >
                  <Info className="h-3.5 w-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[260px] text-xs">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {snapshot && (
          <div className="mt-5 rounded-xl bg-slate-950/35 p-3 ring-1 ring-white/10 backdrop-blur-sm">
            {snapshot}
          </div>
        )}

        <div className="mt-auto pt-10">
          <h3 className="text-3xl font-bold leading-tight tracking-tight">{title}</h3>
          <p className="mt-1 text-sm font-medium text-white/85">{subtitle}</p>

          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ring-1 ${TONE[statusTone]}`}
          >
            {statusLabel}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </div>

          {expanded && (
            <ul className="mt-3 space-y-1.5 rounded-xl bg-slate-950/55 p-3 text-xs text-white ring-1 ring-white/15 backdrop-blur">
              {actions.map((a) => (
                <li key={a} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--severity-low)]" />
                  {a}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-[11px] italic text-white/80">{tagline}</p>
        </div>
      </div>
    </button>
  );
}

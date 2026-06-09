import { forwardRef } from "react";
import {
  MapPin,
  Route as RouteIcon,
  Ban,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Info,
} from "lucide-react";
import type { DisasterKind } from "./DisasterPicker";

interface Props {
  disaster: DisasterKind;
  volunteerApproved: boolean;
  /** For Extreme Heat: which verb to render (supplied by logic later). */
  extremeHeatLabel?: "STAY COOL" | "GO TO COOLING CENTER" | "WAIT FOR COOLING TRANSPORT";
  highlight?: boolean;
}

function Hero({
  verb,
  tone,
}: {
  verb: string;
  tone: "go" | "stay" | "wait";
}) {
  const toneClass =
    tone === "go"
      ? "text-[color:var(--severity-critical)]"
      : tone === "stay"
        ? "text-[color:var(--severity-low)]"
        : "text-[color:var(--severity-moderate)]";
  return (
    <p
      className={`text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl ${toneClass}`}
    >
      {verb}
    </p>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-card-foreground/5 px-2.5 py-1 text-xs font-medium text-card-foreground/85">
      {children}
    </span>
  );
}

function SafetyNote() {
  return (
    <p className="mt-4 flex items-start gap-2 rounded-lg bg-card-foreground/5 p-3 text-xs text-card-foreground/80">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-card-foreground/60" aria-hidden="true" />
      For life-threatening emergencies, call 911 and follow local officials.
    </p>
  );
}

export const ActionCard = forwardRef<HTMLDivElement, Props>(function ActionCard(
  { disaster, volunteerApproved, extremeHeatLabel = "GO TO COOLING CENTER", highlight = false },
  ref,
) {
  return (
    <section
      ref={ref}
      aria-label="Recommended action"
      className={[
        "rounded-2xl bg-card p-6 text-card-foreground shadow-lg shadow-black/15 transition-all",
        highlight ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "",
      ].join(" ")}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-card-foreground/60">
        Compass recommendation — {disaster}
      </p>

      {disaster === "Flood" && (
        <>
          <Hero verb="GO TO HIGHER GROUND" tone="go" />
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                Destination
              </p>
              <p className="mt-1 text-base font-medium">Hilltop Community Center</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge>Pet-friendly</Badge>
                <Badge>Accessible</Badge>
                <Badge>High elevation</Badge>
                <Badge>65 spaces available</Badge>
              </div>
            </div>
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <RouteIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                Best route
              </p>
              <p className="mt-1 text-base font-medium">Route B — Hilltop Avenue Route</p>
              <p className="mt-2 flex items-start gap-1.5 text-sm text-card-foreground/80">
                <Ban
                  className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--severity-critical)]"
                  aria-hidden="true"
                />
                <span>
                  Avoid: River Road bridge · Bridge Street underpass · Old Mill crossing
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-card-foreground/5 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Info className="h-4 w-4 text-card-foreground/70" aria-hidden="true" />
              Why
            </p>
            <p className="mt-1 text-sm text-card-foreground/85">
              Route B avoids flooded crossings and reaches higher ground while matching the
              household's pet and accessibility needs.
            </p>
          </div>

          <div className="mt-3 rounded-xl border border-[color:var(--severity-moderate)]/40 bg-[color:var(--severity-moderate)]/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-[color:var(--severity-moderate)]">
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Help needed
            </p>
            <p className="mt-1 text-sm text-card-foreground/85">
              No vehicle listed. Transportation support required.
            </p>
            {volunteerApproved && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--severity-low)]/15 px-2.5 py-1 text-xs font-medium text-[color:var(--severity-low)]">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Volunteer approved — Ana en route.
              </p>
            )}
          </div>
          <SafetyNote />
        </>
      )}

      {disaster === "Earthquake" && (
        <>
          <Hero verb="SHELTER NOW" tone="stay" />
          <p className="mt-4 text-base text-card-foreground/90">
            Drop, Cover, and Hold On. Do not go outside during shaking. After shaking stops,
            check injuries and move to an assembly point only if the building is unsafe.
          </p>
          <SafetyNote />
        </>
      )}

      {disaster === "Hurricane" && (
        <>
          <Hero verb="GO BEFORE DEADLINE" tone="go" />
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-card-foreground/5 p-4">
              <p className="text-sm font-semibold">Shelter selection</p>
              <p className="mt-1 text-sm text-card-foreground/80">
                Choose an inland, hardened shelter that fits household needs.
              </p>
            </div>
            <div className="rounded-xl border border-[color:var(--severity-high)]/40 bg-[color:var(--severity-high)]/10 p-4">
              <p className="text-sm font-semibold text-[color:var(--severity-high)]">
                Official evacuation order is in effect
              </p>
              <p className="mt-1 text-sm text-card-foreground/85">
                Leave before the local deadline. Roads close as conditions worsen.
              </p>
            </div>
          </div>
          <SafetyNote />
        </>
      )}

      {disaster === "Wildfire" && (
        <>
          <Hero verb="GO AWAY FROM FIRE PATH" tone="go" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-card-foreground/5 p-4">
              <p className="text-sm font-semibold">Fastest safe exit</p>
              <p className="mt-1 text-sm text-card-foreground/80">Primary upwind route</p>
            </div>
            <div className="rounded-xl bg-card-foreground/5 p-4">
              <p className="text-sm font-semibold">Backup route</p>
              <p className="mt-1 text-sm text-card-foreground/80">Use if primary becomes blocked</p>
            </div>
          </div>
          <SafetyNote />
        </>
      )}

      {disaster === "Extreme Heat" && (
        <>
          <Hero
            verb={extremeHeatLabel}
            tone={extremeHeatLabel === "STAY COOL" ? "stay" : extremeHeatLabel === "WAIT FOR COOLING TRANSPORT" ? "wait" : "go"}
          />
          <p className="mt-4 text-base text-card-foreground/85">
            Stay hydrated, avoid direct sun, and check on vulnerable neighbors.
          </p>
          <SafetyNote />
        </>
      )}
    </section>
  );
});

import { useRef, useState } from "react";
import { ChevronDown, Droplets, Activity, Sun, ArrowRight, ShieldAlert, Clock } from "lucide-react";

import { ActionCard } from "../compass/ActionCard";
import { MapPanel } from "../compass/MapPanel";
import { RouteScorePanel } from "../compass/RouteScorePanel";
import { VolunteerMatchCard } from "../compass/VolunteerMatchCard";
import { CoordinatorPanel } from "../compass/CoordinatorPanel";
import { HouseholdCard } from "../compass/HouseholdCard";
import { DisasterPicker, type DisasterKind } from "../compass/DisasterPicker";
import { WhyThisPopover } from "../WhyThisPopover";
import { WeatherCard } from "../WeatherCard";
import { RollupPanel } from "../RollupPanel";
import { RespondLocationBar } from "../RespondLocationBar";
import { usePhase } from "../PhaseContext";
import { useHousehold, useLocation } from "../LocationContext";
import { useRoutes, resolveDestinationShelter } from "@/lib/queries/routing";
import { useEvacuationRoutes } from "@/lib/queries/evacuation";
import { useWeatherAlerts } from "@/lib/queries/alerts";
import type { DisasterAlert } from "@/lib/adapters/alerts";
import { LiveDataBadge, type BadgeSource } from "../LiveDataBadge";
import type { DisasterType } from "@/types";

const KIND_TO_TYPE: Record<DisasterKind, DisasterType> = {
  Flood: "flood",
  Earthquake: "earthquake",
  Wildfire: "wildfire",
  Hurricane: "hurricane",
  "Extreme Heat": "heat",
};

export function RespondPhase() {
  const [disaster, setDisaster] = useState<DisasterKind>("Flood");
  const [volunteerApproved, setVolunteerApproved] = useState(false);
  const [scoresOpen, setScoresOpen] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const { mode } = usePhase();
  const household = useHousehold();
  const { source: locationSource } = useLocation();
  const actionRef = useRef<HTMLDivElement>(null);

  const home: [number, number] = [household.lat, household.lng];
  const disasterType = KIND_TO_TYPE[disaster];

  // Two routing modes:
  //  - Demo (no real location set): the seeded North Creek flow (48/91/70).
  //  - Location-aware (real device/saved location): computed safe targets near
  //    the user, routed by ORS when a key is present, else straight-line
  //    estimates. Earthquake ⇒ shelter in place (no routes).
  const locationAware = locationSource !== "seed" && disaster !== "Earthquake";

  const destShelter = resolveDestinationShelter();
  const seedDest: [number, number] = destShelter ? [destShelter.lat, destShelter.lng] : home;
  const seedRouting = useRoutes(home, seedDest);
  const evac = useEvacuationRoutes(home, disasterType, locationAware);

  const routes = locationAware ? evac.routes : seedRouting.data;
  const routeSource: BadgeSource = locationAware ? evac.source : seedRouting.source;
  const showScores = locationAware ? routes.length > 0 || evac.isLoading : disaster === "Flood";
  const alerts = useWeatherAlerts(household.lat, household.lng);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--severity-low)]">
            Phase 2 · During impact
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Compass Action Plan</h2>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Turn the warning into the safest next action: GO, STAY, or WAIT.
          </p>
        </div>
        <WhyThisPopover
          label="Why this action?"
          data="Household needs, hazard polygon, available routes, blocked roads, volunteer capacity."
          rule="GO / STAY / WAIT decision: Flood + low-elevation home → GO to higher ground."
          fallback="If shelter is full, recommend next-best high-elevation, accessible, pet-friendly shelter."
        />
      </div>

      <RespondLocationBar />

      <RecommendationBanner disaster={disaster} alerts={alerts.data} />

      <ActiveAlertsStrip alerts={alerts.data} source={alerts.source} />

      <RollupPanel />


      <div className="dc-card p-4">
        <DisasterPicker selected={disaster} onSelect={setDisaster} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:items-stretch">
        <div className="lg:col-span-3">
          <ActionCard ref={actionRef} disaster={disaster} volunteerApproved={volunteerApproved} />
        </div>
        <div className="lg:col-span-2">
          <MapPanel
            disaster={disaster}
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            locationAware={locationAware}
            destinations={locationAware ? evac.destinations : undefined}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {showScores && (
            <div className="dc-card overflow-hidden">
              <div className="flex w-full items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setScoresOpen((v) => !v)}
                    className="flex items-center gap-3 text-left"
                  >
                    <h3 className="text-sm font-bold uppercase tracking-wider">Route scoring</h3>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${scoresOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <WhyThisPopover
                    data="Distance, elevation gain, flood exposure, blocked-road flags, shelter fit, accessibility."
                    rule="Weighted sum; flood + blocked-road force rejection regardless of distance."
                    fallback="If all routes < 60, escalate to coordinator for manual override."
                  />
                </div>
              </div>
              {scoresOpen && (
                <div className="border-t border-border/60">
                  <RouteScorePanel
                    routes={routes}
                    source={routeSource}
                    selectedRouteId={selectedRouteId}
                    onSelectRoute={setSelectedRouteId}
                    isLoading={evac.isLoading}
                  />
                </div>
              )}
              <p className="border-t border-border/60 px-5 py-2 text-[11px] italic text-card-foreground/60">
                AI explains. Rules decide.
              </p>
            </div>
          )}

          {mode === "community" && <CoordinatorPanel volunteerApproved={volunteerApproved} />}

          <DisasterContrastPanel />
        </div>

        <div className="space-y-6">
          <WeatherCard lat={household.lat} lng={household.lng} />
          <HouseholdCard />
          {disaster === "Flood" && (
            <div className="space-y-2">
              <VolunteerMatchCard
                volunteerApproved={volunteerApproved}
                onApprove={() => setVolunteerApproved(true)}
              />
              <div className="flex justify-end">
                <WhyThisPopover
                  label="Why Ana?"
                  data="Volunteer roster: vehicle type, seats, distance, availability, pet/accessibility flags."
                  rule="Match priority: available > enough seats > truck/van > pets > accessibility > distance."
                  fallback="If no match, escalate to coordinator unmet-needs queue."
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type Recommendation = {
  verdict: "GO" | "STAY" | "WAIT";
  headline: string;
  detail: string;
  steps: string[];
  tone: string;
  Icon: typeof ArrowRight;
};

function buildRecommendation(disaster: DisasterKind, alerts: DisasterAlert[]): Recommendation {
  const hasCritical = alerts.some((a) => a.severity === "critical" || a.severity === "high");
  const hasAny = alerts.length > 0;

  if (disaster === "Earthquake") {
    return {
      verdict: "STAY",
      headline: "STAY — Drop, Cover, Hold On",
      detail: "Do not run outside. Stay until shaking stops, then check for hazards before moving.",
      steps: [
        "Drop to hands and knees under a sturdy table or against an interior wall.",
        "Cover your head and neck; hold on until shaking stops.",
        "After shaking, check for gas leaks, injuries, and structural damage before exiting.",
      ],
      tone: "var(--severity-moderate)",
      Icon: ShieldAlert,
    };
  }

  if (disaster === "Flood" || disaster === "Hurricane" || disaster === "Wildfire") {
    if (hasCritical || hasAny) {
      return {
        verdict: "GO",
        headline: `GO — evacuate to the safest ${disaster === "Wildfire" ? "smoke-free area" : "higher ground"} now`,
        detail: "An active alert is in your area. Take the recommended route below and grab your go-bag.",
        steps: [
          "Grab your go-bag, IDs, meds, phone + charger.",
          "Follow the highest-scored route on the map (avoids blocked or flooded roads).",
          "Notify a neighbor and your check-in contact when you leave and arrive.",
        ],
        tone: "var(--severity-high)",
        Icon: ArrowRight,
      };
    }
    return {
      verdict: "WAIT",
      headline: "WAIT — no active alert; stay ready",
      detail: "Conditions are calm. Keep your plan and go-bag ready in case the situation changes.",
      steps: [
        "Confirm your go-bag and important documents are accessible.",
        "Review your rehearsed route on the map.",
        "Watch for new alerts; this page will update as they arrive.",
      ],
      tone: "var(--severity-low)",
      Icon: Clock,
    };
  }

  // Extreme Heat
  if (hasCritical) {
    return {
      verdict: "GO",
      headline: "GO — move to a cooling center now",
      detail: "Heat is dangerous, especially for kids, elders, and people with medical needs.",
      steps: [
        "Drink water; avoid alcohol and caffeine.",
        "Move to the nearest cooling center, library, or air-conditioned space.",
        "Check on neighbors who are alone or medically vulnerable.",
      ],
      tone: "var(--severity-high)",
      Icon: ArrowRight,
    };
  }
  return {
    verdict: "WAIT",
    headline: "WAIT — stay cool and hydrated indoors",
    detail: "Heat is elevated but not critical. Limit exertion and watch for symptoms.",
    steps: [
      "Drink water on a schedule; close blinds during peak sun.",
      "Identify your nearest cooling center in case you need it.",
      "Check on vulnerable household members and neighbors.",
    ],
    tone: "var(--severity-moderate)",
    Icon: Clock,
  };
}

function RecommendationBanner({ disaster, alerts }: { disaster: DisasterKind; alerts: DisasterAlert[] }) {
  const rec = buildRecommendation(disaster, alerts);
  const Icon = rec.Icon;
  return (
    <div
      className="dc-card overflow-hidden border-l-4 p-5"
      style={{ borderLeftColor: rec.tone }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{ background: `color-mix(in oklab, ${rec.tone} 18%, transparent)`, color: rec.tone }}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
              style={{
                background: `color-mix(in oklab, ${rec.tone} 18%, transparent)`,
                color: rec.tone,
              }}
            >
              Recommendation
            </span>
            <span
              className="rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white"
              style={{ background: rec.tone }}
            >
              {rec.verdict}
            </span>
            <span className="text-[11px] text-card-foreground/60">· {disaster}</span>
          </div>
          <h3 className="mt-2 text-lg font-bold tracking-tight">{rec.headline}</h3>
          <p className="mt-1 text-sm text-card-foreground/75">{rec.detail}</p>
          <ol className="mt-3 space-y-1.5 text-sm text-card-foreground/85">
            {rec.steps.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    background: `color-mix(in oklab, ${rec.tone} 15%, transparent)`,
                    color: rec.tone,
                  }}
                >
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

const SEVERITY_VAR: Record<DisasterAlert["severity"], string> = {

  low: "var(--severity-low)",
  moderate: "var(--severity-moderate)",
  high: "var(--severity-moderate)",
  critical: "var(--severity-critical)",
};

function ActiveAlertsStrip({
  alerts,
  source,
}: {
  alerts: DisasterAlert[];
  source: BadgeSource;
}) {
  if (alerts.length === 0) return null;
  return (
    <div className="dc-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider">Active alerts</h3>
        <LiveDataBadge source={source} />
      </div>
      <ul className="flex flex-wrap gap-2">
        {alerts.map((a) => {
          const color = SEVERITY_VAR[a.severity];
          return (
            <li
              key={a.id}
              title={a.description}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: `color-mix(in oklab, ${color} 15%, transparent)`,
                color: color,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              {a.event}
              <span className="text-[10px] font-normal opacity-75">· {a.source}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DisasterContrastPanel() {
  const cases = [
    {
      Icon: Droplets,
      name: "Flood",
      verb: "GO to higher ground",
      tone: "text-[color:var(--severity-low)]",
    },
    {
      Icon: Activity,
      name: "Earthquake",
      verb: "STAY — Drop, Cover, Hold On",
      tone: "text-[color:var(--foreground)]",
    },
    {
      Icon: Sun,
      name: "Heat",
      verb: "GO to cooling center · WAIT if medically vulnerable, no car",
      tone: "text-[color:var(--severity-moderate)]",
    },
  ];
  return (
    <div className="dc-card p-5">
      <h3 className="text-base font-bold tracking-tight">Not every disaster means evacuate.</h3>
      <ul className="mt-3 space-y-2">
        {cases.map((c) => (
          <li key={c.name} className="flex items-start gap-3 rounded-xl bg-card-foreground/5 p-3">
            <c.Icon className="mt-0.5 h-4 w-4 text-card-foreground/60" />
            <div>
              <p className="text-sm font-semibold">{c.name}</p>
              <p className={`text-xs ${c.tone}`}>{c.verb}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] italic text-card-foreground/60">
        The decision is disaster-aware. It rejects the flooded bridge, not every road.
      </p>
    </div>
  );
}

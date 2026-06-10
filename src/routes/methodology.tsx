import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Compass, LifeBuoy } from "lucide-react";
import { PageShell } from "../components/PageShell";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "Methodology — DisasterCompass" },
      {
        name: "description",
        content:
          "How DisasterCompass works across the three phases of an emergency: Prepare, Respond, and Recover.",
      },
    ],
  }),
  component: MethodologyPage,
});

type Phase = {
  id: string;
  label: string;
  sub: string;
  when: "BEFORE" | "DURING" | "AFTER";
  icon: typeof ShieldCheck;
  intro: string;
  points: { title: string; body: string }[];
};

const phases: Phase[] = [
  {
    id: "prepare",
    label: "Prepare",
    sub: "Readiness Radar",
    when: "BEFORE",
    icon: ShieldCheck,
    intro:
      "Before any warning, every household builds a profile so the plan is ready the moment it is needed.",
    points: [
      {
        title: "Household risk profile",
        body: "People, elderly, toddlers, pets, vehicles, medical and accessibility needs, and power-dependent devices are captured once and reused everywhere.",
      },
      {
        title: "Community readiness score",
        body: "We aggregate household readiness into a single block-level resilience signal so coordinators can see gaps before a disaster, not after.",
      },
      {
        title: "Hazard awareness",
        body: "Flood, earthquake, wildfire, hurricane, and extreme-heat hazards each have tailored guidance grounded in FEMA-aligned preparedness steps.",
      },
    ],
  },
  {
    id: "respond",
    label: "Respond",
    sub: "Compass Action Plan",
    when: "DURING",
    icon: Compass,
    intro:
      "When the warning hits, the engine turns signals into one clear action — go, stay, or wait — with the safest route and who needs help.",
    points: [
      {
        title: "Deterministic action decision",
        body: "A pure rules engine (decideAction) maps the active disaster and household profile to a single recommended action with a plain-language reason. Same inputs always produce the same output.",
      },
      {
        title: "Open route-safety scoring",
        body: "Each route scores from 100 with named terms: flood exposure, flooded-bridge and blocked-road penalties, distance-and-time cost, and bonuses for elevation gain, shelter fit, and accessibility. The full breakdown is shown, not hidden.",
      },
      {
        title: "Rejected-route transparency",
        body: "Routes that cross a flooded bridge, use a blocked road, or carry high floodwater exposure are flagged and excluded — and we show exactly why.",
      },
      {
        title: "Volunteer matching",
        body: "Neighbors with capacity are matched to households that cannot leave alone, prioritizing transport, medicine, and eyes-on needs.",
      },
    ],
  },
  {
    id: "recover",
    label: "Recover",
    sub: "Recovery Launchpad",
    when: "AFTER",
    icon: LifeBuoy,
    intro:
      "After the event, a phase-aware checklist guides households through safe return, documentation, and assistance.",
    points: [
      {
        title: "Recovery checklist",
        body: "A tailored, trackable list covers safety checks, damage documentation, and the steps to access aid — persisted as the household works through it.",
      },
      {
        title: "Data sources & demo fallback",
        body: "The demo runs on in-memory seed data for the fictional town of North Creek — no live APIs, no database — so the full flow is reproducible offline.",
      },
      {
        title: "Limitations & privacy",
        body: "This is a demonstration, not an official emergency service. Profiles stay client-side; nothing is sent to a third party.",
      },
    ],
  },
];

function MethodologyPage() {
  return (
    <PageShell
      title="Methodology"
      description="DisasterCompass follows the emergency lifecycle: Prepare before, Respond during, Recover after."
      showStepIndicator={false}
    >
      <div className="space-y-10">
        {phases.map((phase) => (
          <section key={phase.id} id={phase.id} className="scroll-mt-24">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <phase.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {phase.when} · {phase.sub}
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {phase.label}
                </h2>
              </div>
            </div>
            <p className="mt-3 max-w-3xl text-base text-foreground/75">{phase.intro}</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {phase.points.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10"
                >
                  <h3 className="text-base font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm text-card-foreground/70">{p.body}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}

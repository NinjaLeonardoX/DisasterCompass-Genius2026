import { createFileRoute } from "@tanstack/react-router";
import {
  Navigation,
  Route as RouteIcon,
  Users,
  ClipboardCheck,
  Database,
  ShieldAlert,
} from "lucide-react";
import { PageShell } from "../components/PageShell";
import { SiteHeader } from "../components/SiteHeader";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "Methodology — How Disaster Compass decides" },
      {
        name: "description",
        content:
          "How Disaster Compass turns a disaster alert into a household action plan using deterministic, explainable rules — not machine learning.",
      },
    ],
  }),
  component: MethodologyPage,
});

type Rule = {
  n: number;
  icon: typeof Navigation;
  title: string;
  fn: string;
  body: string;
};

const rules: Rule[] = [
  {
    n: 1,
    icon: Navigation,
    title: "Action decision (GO / STAY / WAIT)",
    fn: "decideAction(disasterType, household)",
    body: "Per-hazard rules: Flood → GO TO HIGHER GROUND; Earthquake → STAY / SHELTER NOW (Drop, Cover, Hold On), no evacuation route; Hurricane → GO before the deadline; Wildfire → GO away from the fire path; Extreme heat → cooling-center logic (including WAIT for cooling transport). Household factors — elderly, toddler, pets, vehicle access, medical/accessibility needs — adjust the guidance.",
  },
  {
    n: 3,
    icon: Users,
    title: "Volunteer matching",
    fn: "matchVolunteer(household, volunteers)",
    body: "Matches a household needing transport to the best-fit available volunteer (vehicle capacity, distance, pet/accessibility support). A human coordinator must approve before anyone is dispatched.",
  },
  {
    n: 4,
    icon: ClipboardCheck,
    title: "Recovery",
    fn: "getRecoveryChecklist()",
    body: "A standard post-disaster checklist of next steps.",
  },
];

function RuleCard({ rule }: { rule: Rule }) {
  return (
    <section className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
          <rule.icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Rule {rule.n}
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{rule.title}</h2>
        </div>
      </div>
      <code className="mt-3 inline-block rounded-lg bg-foreground/5 px-2.5 py-1 font-mono text-xs text-foreground/80">
        {rule.fn}
      </code>
      <p className="mt-3 text-sm text-card-foreground/75">{rule.body}</p>
    </section>
  );
}

function MethodologyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageShell
        title="Methodology"
        description="How Disaster Compass decides."
        showStepIndicator={false}
      >
        <div className="space-y-8">
          <p className="max-w-3xl text-base text-foreground/75">
            Disaster Compass turns a disaster alert into a household action plan using
            deterministic, explainable rules — not machine learning. Every recommendation traces to
            a specific rule, so it's auditable and student-explainable.
          </p>

          <RuleCard rule={rules[0]} />

          {/* Rule 2 — route scoring, rendered separately for the formula + caveat. */}
          <section className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <RouteIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Rule 2
                </p>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Route scoring
                </h2>
              </div>
            </div>
            <code className="mt-3 inline-block rounded-lg bg-foreground/5 px-2.5 py-1 font-mono text-xs text-foreground/80">
              scoreRoute(route)
            </code>
            <div className="mt-3 overflow-x-auto rounded-lg bg-foreground/5 p-3 font-mono text-xs leading-relaxed text-foreground/80">
              score = 100 − floodPenalty − bridgePenalty − blockedRoadPenalty − distancePenalty +
              elevationBonus + shelterFitBonus + accessibilityBonus
            </div>
            <p className="mt-3 text-sm text-card-foreground/75">
              Higher is safer; getBestRoute() picks the maximum. In the North Creek demo this yields
              Route A ≈ 48 (crosses a flooded bridge), Route B ≈ 91 (best), Route C ≈ 70 (caution).
            </p>
            <p className="mt-3 rounded-lg border border-severity-moderate/30 bg-severity-moderate/10 p-3 text-xs italic text-card-foreground/75">
              NOTE: these weights are illustrative and demo-calibrated to make the example legible —
              they are not validated emergency-management coefficients.
            </p>
          </section>

          <RuleCard rule={rules[1]} />
          <RuleCard rule={rules[2]} />

          <section className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <Database className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Data &amp; live feeds
              </h2>
            </div>
            <p className="mt-3 text-sm text-card-foreground/75">
              Shelters, routes, and road closures are seeded demo data for the fictional town of
              North Creek — there is no reliable free live feed for these, and stale data for
              life-safety routing would be unsafe. Hazard signals (earthquakes, weather, alerts) can
              optionally run on live public APIs behind a fallback; if a feed is unavailable, the
              app falls back to bundled data and labels it.
            </p>
          </section>

          <section className="rounded-2xl border border-severity-critical/30 bg-severity-critical/5 p-6 text-card-foreground shadow-md shadow-black/10">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-severity-critical/15 text-severity-critical">
                <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Safety</h2>
            </div>
            <p className="mt-3 text-sm text-card-foreground/80">
              Routes are suggested/estimated — never “guaranteed safe.” Disaster Compass complements
              and never replaces 911, FEMA, the Red Cross, or local officials.{" "}
              <strong className="font-semibold text-foreground">In an emergency, call 911.</strong>
            </p>
          </section>
        </div>
      </PageShell>
    </div>
  );
}

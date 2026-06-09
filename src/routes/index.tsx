import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { AlertTriangle, Sparkles, Users, ArrowRightCircle, ShieldCheck, Clock } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { EmptyState } from "../components/EmptyState";
import { NextBackNav } from "../components/NextBackNav";
import { DemoScenarioDropdown } from "../components/DemoScenarioDropdown";
import { useScenario } from "../components/ScenarioContext";
import { decideAction } from "@/lib/actions";
import { DISASTER_LABELS, RIVERA_HOUSEHOLD } from "@/data/seed";
import type { ActionType } from "@/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Relief Radar — Community Dashboard" },
      {
        name: "description",
        content: "Community resilience scores, resource gaps, and disaster signals at a glance.",
      },
    ],
  }),
  component: DashboardPage,
});

const ACTION_STYLES: Record<ActionType, { badge: string; icon: typeof ArrowRightCircle }> = {
  GO: { badge: "bg-severity-critical text-white", icon: ArrowRightCircle },
  WAIT: { badge: "bg-severity-high text-white", icon: Clock },
  STAY: { badge: "bg-severity-low text-white", icon: ShieldCheck },
};

function DashboardPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { selectedDisaster, setActiveScenario, simplifiedSummary, toggleSimplifiedSummary } =
    useScenario();

  if (!selectedDisaster) {
    return (
      <PageShell
        title="Community Dashboard"
        description="The central hub — load a demo scenario to see the recommended action."
        actions={<DemoScenarioDropdown onSelect={setActiveScenario} />}
      >
        <EmptyState
          icon={Sparkles}
          heading="No scenario loaded"
          helper="Load a demo scenario to populate the alert, recommended action, and route plan."
        />
        <NextBackNav currentPath={pathname} />
      </PageShell>
    );
  }

  const household = RIVERA_HOUSEHOLD;
  const decision = decideAction(selectedDisaster, household);
  const style = ACTION_STYLES[decision.actionType];
  const ActionIcon = style.icon;
  const disasterLabel = DISASTER_LABELS[selectedDisaster];

  return (
    <PageShell
      title="Community Dashboard"
      description="Active alert and the recommended action for your household."
      actions={<DemoScenarioDropdown onSelect={setActiveScenario} />}
    >
      <div className="space-y-6">
        {/* Alert banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-severity-critical/40 bg-severity-critical/15 p-5">
          <AlertTriangle
            className="mt-0.5 h-6 w-6 shrink-0 text-severity-critical"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-severity-critical">
              Active alert
            </p>
            <h2 className="text-xl font-semibold text-foreground">
              {disasterLabel} warning — North Creek
            </h2>
            <p className="mt-1 text-sm text-foreground/75">{decision.why}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          {/* Household card */}
          <section className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-card-foreground/50" aria-hidden="true" />
              <h3 className="text-lg font-semibold">{household.name}</h3>
            </div>
            <p className="text-xs text-card-foreground/60">{household.locationName}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <HouseholdFact label="People" value={String(household.people)} />
              <HouseholdFact label="Elderly" value={String(household.elderly)} />
              <HouseholdFact label="Toddlers" value={String(household.toddlers)} />
              <HouseholdFact label="Pets" value={String(household.pets)} />
              <HouseholdFact label="Vehicle" value={household.hasCar ? "Yes" : "None"} />
              <HouseholdFact label="Medical needs" value={household.medicalNeeds ? "Yes" : "No"} />
              <HouseholdFact
                label="Accessibility"
                value={household.accessibilityNeeds ? "Needs support" : "None"}
              />
              <HouseholdFact label="Home cooling" value={household.hasCooling ? "Yes" : "No"} />
            </dl>
          </section>

          {/* Action card */}
          <section className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${style.badge}`}
              >
                <ActionIcon className="h-4 w-4" aria-hidden="true" />
                {decision.actionLabel}
              </span>
              <span className="rounded-full bg-card-foreground/10 px-2.5 py-1 text-xs font-medium text-card-foreground/70">
                {decision.actionType}
              </span>
            </div>
            <p className="mt-4 text-base font-medium">{decision.primaryInstruction}</p>
            <ol className="mt-4 space-y-2">
              {decision.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-card-foreground/80">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-card-foreground/10 text-[11px] font-semibold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 rounded-xl bg-severity-high/15 p-3 text-sm text-card-foreground/80">
              <strong className="font-semibold">Safety:</strong> {decision.safetyNote}
            </p>
            {decision.needsTransport && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary/15 px-3 py-1.5 text-sm font-medium text-primary">
                No vehicle — volunteer transport needed (see Action Plan).
              </p>
            )}
          </section>
        </div>

        {/* AI summary panel */}
        <section className="rounded-2xl bg-surface/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              Plain-language summary
            </h3>
            <button
              type="button"
              onClick={toggleSimplifiedSummary}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 hover:bg-surface"
            >
              {simplifiedSummary ? "Show detailed" : "Simplify"}
            </button>
          </div>
          <p className="mt-3 text-sm text-foreground/80">
            {simplifiedSummary
              ? `${disasterLabel}. ${decision.actionLabel}. ${decision.primaryInstruction}`
              : `A ${disasterLabel.toLowerCase()} alert is active for North Creek. The recommended action for the ${household.name} is "${decision.actionLabel}". ${decision.why}`}
          </p>
        </section>
      </div>

      <NextBackNav currentPath={pathname} />
    </PageShell>
  );
}

function HouseholdFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card-foreground/5 p-2.5">
      <dt className="text-[11px] uppercase tracking-wide text-card-foreground/55">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

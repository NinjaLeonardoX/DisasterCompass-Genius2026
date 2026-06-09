import { createFileRoute, useRouterState } from "@tanstack/react-router";
import {
  ListChecks,
  Route as RouteIcon,
  Truck,
  CheckCircle2,
  Circle,
  HeartPulse,
} from "lucide-react";
import { PageShell } from "../components/PageShell";
import { EmptyState } from "../components/EmptyState";
import { NextBackNav } from "../components/NextBackNav";
import { useScenario } from "../components/ScenarioContext";
import { decideAction } from "@/lib/actions";
import { getBestRoute, scoreRoute } from "@/lib/scoring";
import { matchVolunteer } from "@/lib/matching";
import { ROUTES, VOLUNTEERS, RIVERA_HOUSEHOLD, SHELTERS } from "@/data/seed";

export const Route = createFileRoute("/action-plan")({
  head: () => ({
    meta: [
      { title: "Recommended Response Plan — Relief Radar" },
      { name: "description", content: "A prioritized action plan based on community signals." },
    ],
  }),
  component: ActionPlanPage,
});

function ActionPlanPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const {
    selectedDisaster,
    volunteerApproved,
    approveVolunteer,
    recoveryItems,
    toggleRecoveryItem,
  } = useScenario();

  if (!selectedDisaster) {
    return (
      <PageShell title="Recommended Response Plan">
        <EmptyState
          icon={ListChecks}
          heading="No scenario loaded"
          helper="Load a demo scenario to generate a prioritized action plan."
        />
        <NextBackNav currentPath={pathname} />
      </PageShell>
    );
  }

  const decision = decideAction(selectedDisaster, RIVERA_HOUSEHOLD);
  const bestRoute = decision.shouldShowRoute ? getBestRoute(ROUTES) : null;
  const bestScore = bestRoute ? scoreRoute(bestRoute).score : null;
  const destination = bestRoute ? SHELTERS.find((s) => s.id === bestRoute.destinationId) : null;
  const match = matchVolunteer(RIVERA_HOUSEHOLD, VOLUNTEERS);
  const completedCount = recoveryItems.filter((i) => i.completed).length;

  return (
    <PageShell
      title="Recommended Response Plan"
      description="Everything for the Rivera Family in one place — action, route, transport, recovery."
    >
      <div className="space-y-6">
        {/* Action recap */}
        <section className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-card-foreground/55">
            Recommended action
          </h3>
          <p className="mt-1 text-2xl font-bold">{decision.actionLabel}</p>
          <p className="mt-1 text-sm text-card-foreground/75">{decision.primaryInstruction}</p>
        </section>

        {/* Best route */}
        {bestRoute && (
          <section className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10">
            <div className="flex items-center gap-2">
              <RouteIcon className="h-5 w-5 text-severity-low" aria-hidden="true" />
              <h3 className="text-lg font-semibold">Best route</h3>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="text-base font-semibold">{bestRoute.name}</span>
              <span className="rounded-full bg-severity-low/20 px-2.5 py-0.5 text-xs font-bold text-severity-low">
                Score {bestScore}
              </span>
              <span className="text-card-foreground/70">
                {bestRoute.distanceMiles.toFixed(1)} mi · ~{bestRoute.estimatedMinutes} min
              </span>
              {destination && <span className="text-card-foreground/70">→ {destination.name}</span>}
            </div>
            <p className="mt-2 text-sm text-card-foreground/65">{bestRoute.notes}</p>
          </section>
        )}

        {/* Volunteer match */}
        {decision.needsTransport && match.bestVolunteer && (
          <section className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="text-lg font-semibold">Volunteer transport match</h3>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold">{match.bestVolunteer.name}</p>
                <p className="text-sm text-card-foreground/60">
                  {match.bestVolunteer.vehicle} · {match.bestVolunteer.seats} seats ·{" "}
                  {match.bestVolunteer.distanceMiles.toFixed(1)} mi away
                </p>
              </div>
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                {volunteerApproved ? "En Route" : match.bestVolunteer.status}
              </span>
            </div>

            <ul className="mt-3 flex flex-wrap gap-2">
              {match.matchReasons.map((reason) => (
                <li
                  key={reason}
                  className="rounded-full bg-card-foreground/5 px-2.5 py-1 text-xs text-card-foreground/70"
                >
                  {reason}
                </li>
              ))}
            </ul>

            {volunteerApproved ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-severity-low/15 p-3 text-sm text-card-foreground/85">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-severity-low"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-semibold">Approved.</strong> {match.bestVolunteer.name} is
                  en route to the {RIVERA_HOUSEHOLD.name}. Their status is now{" "}
                  <strong>En Route</strong> on the coordinator board.
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={approveVolunteer}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:brightness-110 active:scale-[0.98]"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Approve {match.bestVolunteer.name} for transport
              </button>
            )}
          </section>
        )}

        {/* Recovery checklist */}
        <section className="rounded-2xl bg-card p-6 text-card-foreground shadow-md shadow-black/10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-card-foreground/50" aria-hidden="true" />
              <h3 className="text-lg font-semibold">Recovery checklist</h3>
            </div>
            <span className="text-sm text-card-foreground/60">
              {completedCount}/{recoveryItems.length} done
            </span>
          </div>
          <ul className="mt-3 space-y-1">
            {recoveryItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggleRecoveryItem(item.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-card-foreground/5"
                >
                  {item.completed ? (
                    <CheckCircle2
                      className="h-5 w-5 shrink-0 text-severity-low"
                      aria-hidden="true"
                    />
                  ) : (
                    <Circle
                      className="h-5 w-5 shrink-0 text-card-foreground/30"
                      aria-hidden="true"
                    />
                  )}
                  <span className={item.completed ? "text-card-foreground/50 line-through" : ""}>
                    {item.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <NextBackNav currentPath={pathname} />
    </PageShell>
  );
}

import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LifecycleDashboard } from "../components/LifecycleDashboard";
import { SafetyLocationPanel } from "../components/compass/SafetyLocationPanel";
import { usePhase, type Phase } from "../components/PhaseContext";
import { useLocation } from "../components/LocationContext";

export const Route = createFileRoute("/compass")({
  head: () => ({
    meta: [
      { title: "DisasterCompass — One family. Three moments. One clear plan." },
      {
        name: "description",
        content:
          "Prepare, respond, and recover with one community safety system: Readiness Radar, Compass Action Plan, Recovery Launchpad.",
      },
    ],
  }),
  component: CompassLayout,
});

function CompassLayout() {
  const { activePhase, setActivePhase } = usePhase();
  const { locationConfirmed } = useLocation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Keep phase context in sync with the URL so shared components
  // (sidebar, dashboard) still reflect the active phase.
  useEffect(() => {
    const next: Phase | null = pathname.endsWith("/respond")
      ? "respond"
      : pathname.endsWith("/recover")
        ? "recover"
        : pathname.endsWith("/prepare") || pathname === "/compass"
          ? "prepare"
          : null;
    if (next && next !== activePhase) setActivePhase(next);
  }, [pathname, activePhase, setActivePhase]);

  const hasLocation = locationConfirmed;
  const isRespond = pathname.endsWith("/respond");

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-10">
        {/* Safety Location always sits at the very top */}
        <SafetyLocationPanel />

        {hasLocation ? (
          <>
            {!isRespond && <LifecycleDashboard />}

            <div className={isRespond ? "" : "border-t border-border/60 pt-8"}>
              <Outlet />
            </div>

            {!isRespond && (
              <footer className="rounded-2xl border border-border/60 bg-white p-5 text-center text-sm text-card-foreground/75 shadow-sm">
                <p className="font-semibold text-card-foreground">Data → Rules → Action</p>
                <p className="mt-1 text-xs">
                  <span className="font-medium">Data:</span> household needs, hazards, shelters, routes, volunteers
                  &nbsp;·&nbsp;
                  <span className="font-medium">Rules:</span> GO / STAY / WAIT, route scoring, volunteer matching, recovery priority
                  &nbsp;·&nbsp;
                  <span className="font-medium">Action:</span> safe route, volunteer help, recovery packet
                </p>
                <p className="mt-2 text-[11px] italic text-card-foreground/55">
                  AI explains. Rules decide. Humans approve.
                </p>
              </footer>
            )}
          </>
        ) : (
          <section className="rounded-2xl border border-dashed border-border bg-white p-8 text-center shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--severity-low)]">
              Location required
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Set your location to activate DisasterCompass
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-card-foreground/70">
              Prepare, Respond, and Recover all depend on where you are. Use the panel above to share
              your location or enter an address — the rest of the system will appear once it's set.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

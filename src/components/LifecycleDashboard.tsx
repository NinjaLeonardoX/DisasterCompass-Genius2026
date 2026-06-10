import { Radar, Compass as CompassIcon, LifeBuoy } from "lucide-react";
import { LifecycleCard } from "./LifecycleCard";
import { usePhase } from "./PhaseContext";

export function LifecycleDashboard() {
  const { activePhase, setActivePhase } = usePhase();

  return (
    <section aria-label="Lifecycle dashboard" className="space-y-5">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--severity-low)]">
          The DisasterCompass system
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
          One family. Three moments. One clear plan.
        </h1>
        <p className="mt-2 text-base text-[color:var(--muted-foreground)]">
          DisasterCompass uses the same household profile and neighbor network
          before, during, and after impact.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <LifecycleCard
          phase="prepare"
          when="BEFORE"
          title="Prepare"
          subtitle="Readiness Radar"
          statusLabel="Needs Support Before Impact"
          statusTone="amber"
          Icon={Radar}
          tooltip="Preparedness is not just a checklist. DisasterCompass finds who may struggle before the warning becomes urgent."
          tagline="Preparedness = rehearsal before the siren."
          actions={[
            "Pre-match transport support",
            "Confirm pet-friendly accessible shelter",
            "Pack medication and documents",
            "Print emergency contacts",
            "Confirm check-in contact",
          ]}
          active={activePhase === "prepare"}
          onSelect={() => setActivePhase("prepare")}
          visualClass="bg-[radial-gradient(circle_at_20%_30%,rgba(56,189,248,0.45),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(22,163,74,0.35),transparent_55%),linear-gradient(135deg,#0f1a2e_0%,#1d3a5f_60%,#0f1a2e_100%)]"
        />
        <LifecycleCard
          phase="respond"
          when="DURING"
          title="Respond"
          subtitle="Compass Action Plan"
          statusLabel="Action Ready: GO TO HIGHER GROUND"
          statusTone="green"
          Icon={CompassIcon}
          tooltip="The system turns the alert into a clear GO / STAY / WAIT decision using household needs, hazards, routes, and available help."
          tagline="Response = the safest next action, not more alerts."
          actions={[
            "Go to Hilltop Community Center",
            "Use Route B — Hilltop Avenue",
            "Avoid River Road bridge",
            "Request transport support",
            "Approve Ana as volunteer driver",
          ]}
          active={activePhase === "respond"}
          onSelect={() => setActivePhase("respond")}
          visualClass="bg-[radial-gradient(circle_at_75%_25%,rgba(220,38,38,0.40),transparent_55%),radial-gradient(circle_at_15%_80%,rgba(22,163,74,0.45),transparent_55%),linear-gradient(135deg,#0b1426_0%,#1e293b_50%,#0b1426_100%)]"
        />
        <LifecycleCard
          phase="recover"
          when="AFTER"
          title="Recover"
          subtitle="Recovery Launchpad"
          statusLabel="Recovery Packet Ready"
          statusTone="navy"
          Icon={LifeBuoy}
          tooltip="Recovery starts while details are still fresh. DisasterCompass turns recovery into one guided next-action queue."
          tagline="Recovery = guided next steps, not a forgotten checklist."
          actions={[
            "Confirm everyone is safe",
            "Photograph damage",
            "Save receipts",
            "Contact insurance",
            "Request cleanup support",
            "Complete wellbeing check",
          ]}
          active={activePhase === "recover"}
          onSelect={() => setActivePhase("recover")}
          visualClass="bg-[radial-gradient(circle_at_30%_25%,rgba(245,158,11,0.30),transparent_55%),radial-gradient(circle_at_80%_75%,rgba(94,230,161,0.30),transparent_55%),linear-gradient(135deg,#1a2842_0%,#243b5f_50%,#0f1a2e_100%)]"
        />
      </div>
    </section>
  );
}

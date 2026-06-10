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
          visualClass="bg-[radial-gradient(circle_at_25%_20%,rgba(125,211,252,0.85),transparent_60%),radial-gradient(circle_at_85%_85%,rgba(14,116,144,0.9),transparent_55%),linear-gradient(135deg,#0c4a6e_0%,#0369a1_55%,#082f49_100%)]"
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
          visualClass="bg-[radial-gradient(circle_at_80%_20%,rgba(248,113,113,0.85),transparent_55%),radial-gradient(circle_at_20%_85%,rgba(251,191,36,0.7),transparent_55%),linear-gradient(135deg,#7f1d1d_0%,#b91c1c_55%,#451a03_100%)]"
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
          visualClass="bg-[radial-gradient(circle_at_25%_30%,rgba(134,239,172,0.85),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(34,197,94,0.85),transparent_55%),linear-gradient(135deg,#14532d_0%,#166534_55%,#052e16_100%)]"
        />
      </div>
    </section>
  );
}

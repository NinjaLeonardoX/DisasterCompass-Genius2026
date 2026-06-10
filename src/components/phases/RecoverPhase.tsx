import { useState } from "react";
import { CheckCircle2, ArrowRight, PackageCheck, Users } from "lucide-react";
import { getRecoveryChecklist } from "@/lib/recovery";
import { WhyThisPopover } from "../WhyThisPopover";
import { usePhase } from "../PhaseContext";

const STEPS = [
  {
    label: "Photograph the water line before cleanup",
    why: "Damage photos may be needed for insurance or disaster assistance claims.",
    deadline: "Before cleanup begins",
  },
  ...getRecoveryChecklist("flood").map((r) => ({
    label: r.label,
    why: "Standard FEMA-aligned recovery step.",
    deadline: "Within 72 hours",
  })),
];

const RESOURCES = [
  { label: "Ready.gov", href: "https://www.ready.gov" },
  { label: "Red Cross Shelters", href: "https://www.redcross.org/get-help/disaster-relief-and-recovery-services/find-an-open-shelter.html" },
  { label: "FEMA Disaster Assistance", href: "https://www.disasterassistance.gov" },
  { label: "Crisis Cleanup", href: "https://crisiscleanup.org" },
  { label: "Local Emergency Management", href: "#" },
];

const NETWORK = [
  { name: "Ana", role: "Transport completed · available for check-in", tone: "low" as const },
  { name: "Ben", role: "Supply delivery", tone: "low" as const },
  { name: "Chris", role: "Cleanup support unavailable", tone: "moderate" as const },
];

export function RecoverPhase() {
  const [idx, setIdx] = useState(0);
  const { mode } = usePhase();
  const step = STEPS[Math.min(idx, STEPS.length - 1)];
  const done = idx >= STEPS.length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--severity-low)]">
          Phase 3 · After impact
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Recovery Launchpad</h2>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Start the recovery packet before details get lost.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Current action queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="dc-card dc-elev-hero overflow-hidden p-6">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-card-foreground/55">
                Current recovery action · Step {Math.min(idx + 1, STEPS.length)} of {STEPS.length}
              </p>
              <WhyThisPopover
                data="Recovery checklist, household status, possible damage type."
                rule="Surface one next step at a time, ordered by deadline sensitivity."
                fallback="If a step is skipped, it returns to the queue at the end."
              />
            </div>
            {!done ? (
              <>
                <h3 className="mt-3 text-2xl font-bold tracking-tight">{step.label}</h3>
                <div className="mt-3 rounded-xl bg-card-foreground/5 p-3 text-sm">
                  <p className="font-semibold">Why</p>
                  <p className="mt-1 text-card-foreground/80">{step.why}</p>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--severity-moderate)]/15 px-3 py-1 text-xs font-semibold text-[color:var(--severity-moderate)]">
                  Deadline: {step.deadline}
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <p className="text-xs text-card-foreground/60">
                    {STEPS.length - idx - 1} more steps after this
                  </p>
                  <button
                    onClick={() => setIdx((i) => i + 1)}
                    className="inline-flex items-center gap-2 rounded-full bg-[color:var(--severity-low)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_-12px_rgba(22,163,74,0.7)] hover:brightness-110"
                  >
                    Done · Next step
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-3 flex items-start gap-3 rounded-xl bg-[color:var(--severity-low)]/10 p-4 ring-1 ring-[color:var(--severity-low)]/30">
                <CheckCircle2 className="h-5 w-5 text-[color:var(--severity-low)]" />
                <div>
                  <p className="font-semibold text-[color:var(--severity-low)]">Recovery packet complete.</p>
                  <p className="text-sm text-card-foreground/75">
                    All recovery steps logged for the Rivera Family.
                  </p>
                </div>
              </div>
            )}

            <ol className="mt-6 space-y-1.5 text-xs">
              {STEPS.map((s, i) => (
                <li
                  key={s.label}
                  className={[
                    "flex items-center gap-2 rounded-md px-2 py-1",
                    i < idx
                      ? "text-card-foreground/55 line-through"
                      : i === idx
                        ? "bg-card-foreground/5 font-semibold text-card-foreground"
                        : "text-card-foreground/65",
                  ].join(" ")}
                >
                  {i < idx ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--severity-low)]" />
                  ) : (
                    <span className="h-3.5 w-3.5 rounded-full border border-card-foreground/30" />
                  )}
                  {s.label}
                </li>
              ))}
            </ol>
          </div>

          {/* Neighbor network repurposed */}
          <div className="dc-card p-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[color:var(--severity-low)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Your block's volunteers are now cleanup crews
              </h3>
            </div>
            <ul className="mt-3 divide-y divide-card-foreground/10">
              {NETWORK.map((n) => (
                <li key={n.name} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium">{n.name}</span>
                  <span
                    className={
                      n.tone === "low"
                        ? "text-xs text-[color:var(--severity-low)]"
                        : "text-xs text-[color:var(--severity-moderate)]"
                    }
                  >
                    {n.role}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] italic text-card-foreground/60">
              The same network that helped during response becomes the recovery network after impact.
            </p>
          </div>
        </div>

        {/* Recovery packet + resources */}
        <div className="space-y-6">
          <div className="dc-card p-5">
            <div className="flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-[color:var(--severity-low)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Recovery packet</h3>
            </div>
            <p className="mt-2 text-base font-bold tracking-tight">Rivera Family</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-card-foreground/65">Status</dt>
                <dd className="font-medium text-[color:var(--severity-low)]">Safe arrival confirmed</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-card-foreground/65">Recovery stage</dt>
                <dd className="font-medium">Packet started</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-card-foreground/65">Possible damage</dt>
                <dd className="font-medium">Water damage</dd>
              </div>
              <div>
                <dt className="text-card-foreground/65">Assistance path</dt>
                <dd className="mt-1 text-xs text-card-foreground/85">
                  Damage documentation + cleanup support + wellbeing check
                </dd>
              </div>
            </dl>
          </div>

          <div className="dc-card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider">Resource router</h3>
            <p className="mt-1 text-xs text-card-foreground/65">Trusted recovery resources, routed by need.</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {RESOURCES.map((r) => (
                <li key={r.label}>
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full bg-card-foreground/5 px-3 py-1 text-xs font-medium text-card-foreground/85 hover:bg-card-foreground/10"
                  >
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {mode === "community" && (
            <div className="dc-card p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider">Community recovery</h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                  { l: "Recovery packet started", v: 1 },
                  { l: "Cleanup need", v: 1 },
                  { l: "Wellbeing check needed", v: 1 },
                  { l: "Safe / sheltering", v: 3 },
                  { l: "Unaccounted", v: 1 },
                ].map((c) => (
                  <div key={c.l} className="rounded-xl bg-card-foreground/5 p-3">
                    <p className="text-xl font-bold">{c.v}</p>
                    <p className="mt-1 text-[11px] text-card-foreground/70">{c.l}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

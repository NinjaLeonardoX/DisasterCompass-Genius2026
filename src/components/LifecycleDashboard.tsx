import {
  Radar,
  Compass as CompassIcon,
  LifeBuoy,
  ArrowUpRight,
  Camera,
  Home,
  Users,
} from "lucide-react";
import { LifecycleCard } from "./LifecycleCard";
import { usePhase, type Mode } from "./PhaseContext";
import {
  HAZARD_RISKS,
  SEVERITY_META,
  SNAPSHOT_OPEN_GAPS,
  SNAPSHOT_READINESS,
  SNAPSHOT_TOP_GAP,
  COMMUNITY_MEMBERS,
  type Severity,
} from "@/data/prepare";

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
          DisasterCompass uses the same household profile and neighbor network before, during, and
          after impact.
        </p>
      </div>

      <ModeToggle />

      <div className={activePhase ? "grid gap-5" : "grid gap-5 lg:grid-cols-3"}>
        {(!activePhase || activePhase === "prepare") && (
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
            riskTexture
            snapshot={<PrepareSnapshot />}
          />
        )}
        {(!activePhase || activePhase === "respond") && (
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
            snapshot={<RespondSnapshot />}
          />
        )}
        {(!activePhase || activePhase === "recover") && (
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
            snapshot={<RecoverSnapshot />}
          />
        )}
      </div>
    </section>
  );
}

/** The single Resident/Community lens, in the page content (not the nav). */
function ModeToggle() {
  const { mode, setMode } = usePhase();
  const OPTIONS: { id: Mode; label: string; sub: string; Icon: typeof Home }[] = [
    { id: "resident", label: "Resident", sub: "Just my household", Icon: Home },
    { id: "community", label: "Community", sub: "My block + town", Icon: Users },
  ];
  return (
    <div
      role="tablist"
      aria-label="Resident or community view"
      className="inline-flex rounded-xl border border-border bg-white p-1 shadow-sm"
    >
      {OPTIONS.map((o) => {
        const active = mode === o.id;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={active}
            onClick={() => setMode(o.id)}
            className={[
              "flex items-center gap-2 rounded-lg px-3.5 py-2 transition-colors",
              active
                ? "bg-[color:var(--foreground)] text-white shadow-sm"
                : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]",
            ].join(" ")}
          >
            <o.Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-left leading-tight">
              <span className="block text-sm font-semibold">{o.label}</span>
              <span
                className={`block text-[10px] ${active ? "text-white/75" : "text-card-foreground/50"}`}
              >
                {o.sub}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Part A — Readiness Snapshot on the Prepare overview card (rolls up by mode). */
function PrepareSnapshot() {
  const { mode } = usePhase();
  const community = mode === "community";
  const readyCount = COMMUNITY_MEMBERS.filter((m) => m.readiness >= 80).length;
  const communityAvg = Math.round(
    COMMUNITY_MEMBERS.reduce((sum, m) => sum + m.readiness, 0) / COMMUNITY_MEMBERS.length,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <MiniRing value={community ? communityAvg : SNAPSHOT_READINESS} />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
            {community ? "North Creek · Community" : "My Family · Rivera"}
          </p>
          <p className="text-2xl font-bold leading-none text-white">
            {community ? `${readyCount} of 5 ready` : `${SNAPSHOT_READINESS}% ready`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {HAZARD_RISKS.map((h) => (
          <span
            key={h.id}
            className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-1.5 py-1 text-[10px] font-semibold text-white ring-1 ring-white/15"
          >
            {h.shortLabel}
            <SnapshotBars severity={h.severity} />
          </span>
        ))}
      </div>

      <p className="rounded-lg bg-[color:var(--severity-moderate)] px-2.5 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/20">
        {community
          ? `⚠ ${COMMUNITY_MEMBERS.length - readyCount} households need pre-disaster support — top: Rivera (no ride).`
          : `⚠ ${SNAPSHOT_OPEN_GAPS} gaps before you're ready — top: ${SNAPSHOT_TOP_GAP.toLowerCase()}.`}
      </p>
    </div>
  );
}

/** Part A — Respond overview card snapshot. */
function RespondSnapshot() {
  return (
    <div className="space-y-2">
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--severity-low)]/25 px-2.5 py-1.5 text-sm font-bold text-white ring-1 ring-[color:var(--severity-low)]/40">
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        Go to higher ground
      </span>
      <p className="text-xs font-semibold text-white/90">Route B · score 91</p>
    </div>
  );
}

/** Part A — Recover overview card snapshot. */
function RecoverSnapshot() {
  return (
    <div className="space-y-2">
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-sm font-bold text-white ring-1 ring-white/20">
        <Camera className="h-4 w-4" aria-hidden="true" />
        Next: photograph the water line
      </span>
      <p className="text-xs font-semibold text-white/90">Step 1 of 6 · packet ready</p>
    </div>
  );
}

function MiniRing({ value }: { value: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="h-full w-full -rotate-90">
        <circle cx="28" cy="28" r={r} stroke="rgba(255,255,255,0.22)" strokeWidth="5" fill="none" />
        <circle
          cx="28"
          cy="28"
          r={r}
          stroke="var(--severity-moderate)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">
        {value}%
      </div>
    </div>
  );
}

function SnapshotBars({ severity }: { severity: Severity }) {
  const { bars, color } = SEVERITY_META[severity];
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2.5 w-1 rounded-[1px]"
          style={{ background: i < bars ? color : "rgba(255,255,255,0.25)" }}
        />
      ))}
    </span>
  );
}

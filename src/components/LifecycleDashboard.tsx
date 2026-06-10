import { Radar, Compass as CompassIcon, LifeBuoy, ArrowUpRight, Camera } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { LifecycleCard } from "./LifecycleCard";
import { usePhase } from "./PhaseContext";
import { useLocation } from "./LocationContext";
import {
  HAZARD_RISKS,
  SEVERITY_META,
  SNAPSHOT_OPEN_GAPS,
  SNAPSHOT_READINESS,
  SNAPSHOT_TOP_GAP,
  COMMUNITY_MEMBERS,
  TOWN_READINESS,
  STATE_READINESS,
  NATIONAL_READINESS,
  SCOPE_META,
  getScopeMeta,
  readinessColor,
  type Severity,
  type ReadinessScope,
} from "@/data/prepare";

export function LifecycleDashboard() {
  const { activePhase, setActivePhase } = usePhase();
  const navigate = useNavigate();
  const goPhase = (p: "prepare" | "respond" | "recover") => {
    setActivePhase(p);
    navigate({ to: `/compass/${p}` });
  };

  return (
    <section aria-label="Lifecycle dashboard" className="space-y-5">
      {activePhase !== "respond" && (
        <div className="max-w-3xl">
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
            Plan your safest route before disaster strikes.
          </h1>
          <p className="mt-2 text-base text-[color:var(--muted-foreground)]">
            It is clear, easy, and directly explains the Prepare screen.
          </p>
        </div>
      )}

      <ScopeSelector />

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
            tooltip="Preparedness is not just a checklist. Disaster Compass finds who may struggle before the warning becomes urgent."
            tagline="Preparedness = rehearsal before the siren."
            actions={[
              "Pre-match transport support",
              "Confirm pet-friendly accessible shelter",
              "Pack medication and documents",
              "Print emergency contacts",
              "Confirm check-in contact",
            ]}
            active={activePhase === "prepare"}
            onSelect={() => goPhase("prepare")}
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
            onSelect={() => goPhase("respond")}
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
            tooltip="Recovery starts while details are still fresh. Disaster Compass turns recovery into one guided next-action queue."
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
            onSelect={() => goPhase("recover")}
            visualClass="bg-[radial-gradient(circle_at_25%_30%,rgba(134,239,172,0.85),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(34,197,94,0.85),transparent_55%),linear-gradient(135deg,#14532d_0%,#166534_55%,#052e16_100%)]"
            snapshot={<RecoverSnapshot />}
          />
        )}
      </div>
    </section>
  );
}

/** The rollup-scale lens (Household → National), in the page content (not the nav). */
function ScopeSelector() {
  const { scope, setScope } = usePhase();
  const { activeAddress, resolved } = useLocation();

  const placeFor = (id: ReadinessScope): string => {
    switch (id) {
      case "household":
        return activeAddress?.name ?? "Set address";
      case "community":
        return resolved?.city ? `near ${resolved.city}` : "Set address";
      case "town":
        return resolved?.city ?? resolved?.county ?? "Set address";
      case "state":
        return resolved?.state ?? resolved?.stateCode ?? "Set address";
      case "national":
        return resolved?.country ?? "Set address";
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Readiness rollup level"
      className="inline-flex flex-wrap gap-1 rounded-xl border border-border bg-white p-1 shadow-sm"
    >
      {SCOPE_META.map((s) => {
        const active = scope === s.id;
        return (
          <button
            key={s.id}
            role="tab"
            aria-selected={active}
            onClick={() => setScope(s.id)}
            className={[
              "rounded-lg px-3 py-1.5 text-left transition-colors",
              active
                ? "bg-[color:var(--foreground)] text-white shadow-sm"
                : "text-card-foreground hover:bg-card-foreground/5",
            ].join(" ")}
          >
            <span className="block text-sm font-semibold leading-tight">{s.label}</span>
            <span
              className={`block text-[10px] font-medium leading-tight ${active ? "text-white/85" : "text-card-foreground/75"}`}
            >
              {placeFor(s.id)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface SnapshotSummary {
  ring: number;
  headline: string;
  callout: string;
  warn: boolean;
}

/** Part A — Readiness Snapshot on the Prepare overview card (rolls up by scope). */
function PrepareSnapshot() {
  const { scope } = usePhase();
  const meta = getScopeMeta(scope);
  const readyCount = COMMUNITY_MEMBERS.filter((m) => m.readiness >= 80).length;
  const communityAvg = Math.round(
    COMMUNITY_MEMBERS.reduce((sum, m) => sum + m.readiness, 0) / COMMUNITY_MEMBERS.length,
  );

  const SUMMARY: Record<ReadinessScope, SnapshotSummary> = {
    household: {
      ring: SNAPSHOT_READINESS,
      headline: `${SNAPSHOT_READINESS}% ready`,
      callout: `⚠ ${SNAPSHOT_OPEN_GAPS} gaps before you're ready — top: ${SNAPSHOT_TOP_GAP.toLowerCase()}.`,
      warn: true,
    },
    community: {
      ring: communityAvg,
      headline: `${readyCount} of 5 ready`,
      callout: `⚠ ${COMMUNITY_MEMBERS.length - readyCount} households need support — top gap: no ride arranged.`,
      warn: true,
    },
    town: {
      ring: TOWN_READINESS.readiness,
      headline: `${TOWN_READINESS.readiness}% ready`,
      callout: "3 of 5 households rehearsed · 2 shelters confirmed.",
      warn: false,
    },
    state: {
      ring: STATE_READINESS.readiness,
      headline: `${STATE_READINESS.readiness}% ready`,
      callout: "41 of 64 counties prepared · situational awareness.",
      warn: false,
    },
    national: {
      ring: NATIONAL_READINESS.readiness,
      headline: `${NATIONAL_READINESS.readiness}% ready`,
      callout: "44 of 50 states reporting · situational awareness.",
      warn: false,
    },
  };
  const s = SUMMARY[scope];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <MiniRing value={s.ring} />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
            {meta.label} · {meta.place}
          </p>
          <p className="text-2xl font-bold leading-none text-white">{s.headline}</p>
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

      <p
        className={[
          "rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white ring-1",
          s.warn
            ? "bg-[color:var(--severity-moderate)] ring-white/20"
            : "bg-slate-900/50 ring-white/15",
        ].join(" ")}
      >
        {s.callout}
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
          stroke={readinessColor(value)}
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

import { useEffect, useState } from "react";
import { Loader2, ExternalLink, Radio, MapPin, Flag, Globe2 } from "lucide-react";
import { useLocation } from "./LocationContext";
import {
  fetchAlertsByPoint,
  fetchAlertsByState,
  fetchAlertsNational,
  type NwsResult,
  type NwsSeverity,
} from "@/lib/nwsAlerts";

type TierState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "unavailable"; reason: string }
  | { kind: "ok"; result: NwsResult };

const SEVERITY_ORDER: NwsSeverity[] = ["Extreme", "Severe", "Moderate", "Minor", "Unknown"];

const SEVERITY_CLASS: Record<NwsSeverity, string> = {
  Extreme: "bg-[color:var(--severity-critical)]/15 text-[color:var(--severity-critical)]",
  Severe: "bg-[color:var(--severity-high)]/15 text-[color:var(--severity-high)]",
  Moderate: "bg-[color:var(--severity-moderate)]/15 text-[color:var(--severity-moderate)]",
  Minor: "bg-[color:var(--severity-low)]/15 text-[color:var(--severity-low)]",
  Unknown: "bg-slate-500/15 text-slate-500",
};

function severityHistogram(result: NwsResult) {
  const counts = new Map<NwsSeverity, number>();
  for (const a of result.alerts) counts.set(a.severity, (counts.get(a.severity) ?? 0) + 1);
  return SEVERITY_ORDER.filter((s) => counts.has(s)).map((s) => ({ severity: s, count: counts.get(s)! }));
}

function fmtTimestamp(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function TierCard({
  title,
  icon: Icon,
  state,
  scope,
}: {
  title: string;
  icon: typeof Radio;
  state: TierState;
  scope: string;
}) {
  return (
    <section className="dc-card flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-card-foreground/55">
              {title}
            </p>
            <p className="text-sm font-semibold text-foreground">{scope}</p>
          </div>
        </div>
        {state.kind === "ok" && (
          <span className="text-[10px] text-card-foreground/55">
            as of {fmtTimestamp(state.result.fetchedAt)}
          </span>
        )}
      </div>

      {state.kind === "idle" && (
        <p className="text-xs text-card-foreground/55">Set an address to load alerts.</p>
      )}

      {state.kind === "loading" && (
        <p className="flex items-center gap-2 text-xs text-card-foreground/65">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching live signals…
        </p>
      )}

      {state.kind === "unavailable" && (
        <p className="text-xs text-card-foreground/65">
          No live data available — {state.reason}.
        </p>
      )}

      {state.kind === "ok" && state.result.alerts.length === 0 && (
        <p className="text-xs text-card-foreground/65">
          No active signals reported. Source:{" "}
          <a
            href={state.result.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-primary hover:underline"
          >
            NWS <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      )}

      {state.kind === "ok" && state.result.alerts.length > 0 && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {severityHistogram(state.result).map(({ severity, count }) => (
              <span
                key={severity}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${SEVERITY_CLASS[severity]}`}
              >
                {severity} · {count}
              </span>
            ))}
          </div>
          <ul className="space-y-1.5">
            {state.result.alerts.slice(0, 3).map((a) => (
              <li key={a.id} className="text-xs">
                <p className="font-semibold text-foreground">{a.event}</p>
                <p className="line-clamp-2 text-card-foreground/65">{a.headline || a.areaDesc}</p>
              </li>
            ))}
          </ul>
          <p className="mt-auto text-[10px] text-card-foreground/55">
            Source:{" "}
            <a
              href={state.result.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-primary hover:underline"
            >
              api.weather.gov <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </>
      )}
    </section>
  );
}

/**
 * Real-data rollup: community (point) → state → national.
 * Source: NWS api.weather.gov (US-only, free, no key). Shows explicit "no data"
 * when fetches return zero results or fail — never fabricates.
 */
export function RollupPanel() {
  const { household, resolved, source } = useLocation();
  const [community, setCommunity] = useState<TierState>({ kind: "idle" });
  const [state, setState] = useState<TierState>({ kind: "idle" });
  const [national, setNational] = useState<TierState>({ kind: "idle" });

  const isUS = resolved?.countryCode === "us" || (source === "device" && resolved == null);
  const stateCode = resolved?.stateCode ?? null;

  useEffect(() => {
    // No real anchor yet — keep idle.
    if (source === "seed") {
      setCommunity({ kind: "idle" });
      setState({ kind: "idle" });
      setNational({ kind: "idle" });
      return;
    }
    const ctrl = new AbortController();

    if (!isUS) {
      setCommunity({ kind: "unavailable", reason: "NWS covers US only" });
      setState({ kind: "unavailable", reason: "NWS covers US only" });
    } else {
      setCommunity({ kind: "loading" });
      fetchAlertsByPoint(household.lat, household.lng, ctrl.signal).then((r) => {
        if (ctrl.signal.aborted) return;
        setCommunity(r ? { kind: "ok", result: r } : { kind: "unavailable", reason: "request failed" });
      });
      if (stateCode) {
        setState({ kind: "loading" });
        fetchAlertsByState(stateCode, ctrl.signal).then((r) => {
          if (ctrl.signal.aborted) return;
          setState(r ? { kind: "ok", result: r } : { kind: "unavailable", reason: "request failed" });
        });
      } else {
        setState({ kind: "unavailable", reason: "state not detected from address" });
      }
    }

    setNational({ kind: "loading" });
    fetchAlertsNational(ctrl.signal).then((r) => {
      if (ctrl.signal.aborted) return;
      setNational(r ? { kind: "ok", result: r } : { kind: "unavailable", reason: "request failed" });
    });

    return () => ctrl.abort();
  }, [household.lat, household.lng, isUS, stateCode, source]);

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-sm font-bold tracking-tight">Live signals · rolled up from your address</h3>
        <p className="text-xs text-card-foreground/65">
          Real data from the U.S. National Weather Service. Empty cards mean "no active signals" — we
          never fabricate counts.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <TierCard
          title="Community"
          icon={Radio}
          scope={
            resolved?.county
              ? `${resolved.county}${resolved.state ? `, ${resolved.state}` : ""}`
              : resolved?.city ?? household.locationName
          }
          state={community}
        />
        <TierCard
          title="State"
          icon={Flag}
          scope={resolved?.state ?? (stateCode ?? "Unknown state")}
          state={state}
        />
        <TierCard title="National" icon={Globe2} scope="United States" state={national} />
      </div>
    </div>
  );
}

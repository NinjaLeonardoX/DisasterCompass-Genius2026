import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck, AlertCircle, LifeBuoy, Siren, MapPin, Loader2 } from "lucide-react";
import { MapPanel } from "../compass/MapPanel";
import { useLocation } from "../LocationContext";
import { fetchAlertsByPoint, fetchAlertsByState, type NwsAlert } from "@/lib/nwsAlerts";
import { useEvacuationRoutes } from "@/lib/queries/evacuation";
import type { DisasterType } from "@/types";

type Status = "none" | "safe" | "stuck" | "needs_help" | "sos";
type AlertState = "idle" | "loading" | "ready" | "error";

interface ActionDef {
  id: Exclude<Status, "none">;
  label: string;
  Icon: typeof ShieldCheck;
  className: string;
  message: string;
}

const ACTIONS: ActionDef[] = [
  {
    id: "safe",
    label: "I'm Safe",
    Icon: ShieldCheck,
    className:
      "bg-[color:var(--severity-low)] text-white hover:bg-[color:var(--severity-low)]/90 focus-visible:ring-[color:var(--severity-low)]",
    message: "Marked safe.",
  },
  {
    id: "stuck",
    label: "I'm Stuck",
    Icon: AlertCircle,
    className:
      "bg-[color:var(--severity-moderate)] text-white hover:bg-[color:var(--severity-moderate)]/90 focus-visible:ring-[color:var(--severity-moderate)]",
    message: "Marked stuck. Help request created.",
  },
  {
    id: "needs_help",
    label: "I Need Help",
    Icon: LifeBuoy,
    className:
      "bg-[color:var(--severity-critical)]/90 text-white hover:bg-[color:var(--severity-critical)] focus-visible:ring-[color:var(--severity-critical)]",
    message: "Help request sent to coordinator.",
  },
  {
    id: "sos",
    label: "Send SOS",
    Icon: Siren,
    className:
      "bg-[color:var(--severity-critical)] text-white hover:bg-[color:var(--severity-critical)]/90 focus-visible:ring-[color:var(--severity-critical)] ring-2 ring-[color:var(--severity-critical)]/40",
    message: "SOS sent to coordinator. Call 911 for life-threatening emergencies.",
  },
];

function disasterFromAlert(alert: NwsAlert | null): { type: DisasterType; label: "Flood" | "Earthquake" | "Wildfire" | "Hurricane" | "Extreme Heat" } {
  const event = alert?.event.toLowerCase() ?? "";
  if (event.includes("heat")) return { type: "heat", label: "Extreme Heat" };
  if (event.includes("fire") || event.includes("smoke")) return { type: "wildfire", label: "Wildfire" };
  if (event.includes("hurricane") || event.includes("tropical") || event.includes("tornado") || event.includes("wind")) {
    return { type: "hurricane", label: "Hurricane" };
  }
  if (event.includes("earthquake")) return { type: "earthquake", label: "Earthquake" };
  return { type: "flood", label: "Flood" };
}

export function RespondQuickAction() {
  const [status, setStatus] = useState<Status>("none");
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<AlertState>("idle");
  const [activeAlert, setActiveAlert] = useState<NwsAlert | null>(null);
  const [alertScope, setAlertScope] = useState<"local" | "state" | null>(null);

  const {
    household,
    source,
    status: geoStatus,
    error: geoError,
    accuracyMeters,
    resolved,
    requestLocation,
  } = useLocation();

  // Auto-request real-time device location on mount if we don't have it yet.
  useEffect(() => {
    if (source !== "device" && (geoStatus === "idle" || geoStatus === "denied" || geoStatus === "error")) {
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasRealLocation = source === "device";
  const home: [number, number] = [household.lat, household.lng];
  const currentDisaster = useMemo(() => disasterFromAlert(activeAlert), [activeAlert]);
  const evacuation = useEvacuationRoutes(home, currentDisaster.type, hasRealLocation);
  const routes = hasRealLocation ? evacuation.routes : [];

  useEffect(() => {
    if (!hasRealLocation) {
      setActiveAlert(null);
      setAlertScope(null);
      setAlertState("idle");
      return;
    }
    const ctrl = new AbortController();
    setAlertState("loading");
    fetchAlertsByPoint(household.lat, household.lng, ctrl.signal).then(async (result) => {
      if (ctrl.signal.aborted) return;
      if (!result) {
        setActiveAlert(null);
        setAlertScope(null);
        setAlertState("error");
        return;
      }
      if (result.alerts[0]) {
        setActiveAlert(result.alerts[0]);
        setAlertScope("local");
        setAlertState("ready");
        return;
      }
      const stateCode = resolved?.stateCode;
      const stateResult = stateCode ? await fetchAlertsByState(stateCode, ctrl.signal) : null;
      if (ctrl.signal.aborted) return;
      setActiveAlert(stateResult?.alerts[0] ?? null);
      setAlertScope(stateResult?.alerts[0] ? "state" : null);
      setAlertState("ready");
    });
    return () => ctrl.abort();
  }, [hasRealLocation, household.lat, household.lng, resolved?.stateCode]);

  useEffect(() => {
    const best = routes.find((route) => route.colorType === "safe") ?? routes[0];
    setSelectedRouteId(best?.id ?? null);
  }, [routes]);

  const onAction = (a: ActionDef) => {
    setStatus(a.id);
    setLastMessage(a.message);
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      {/* Alert banner */}
      <div
        role="alert"
        className="dc-glow-red flex items-start gap-3 rounded-2xl border border-[color:var(--severity-critical)]/40 bg-gradient-to-r from-[color:var(--severity-critical)]/15 via-white to-white p-4"
      >
        <span
          aria-hidden="true"
          className="dc-pulse mt-1 inline-flex h-3 w-3 shrink-0 rounded-full bg-[color:var(--severity-critical)]"
        />
        <AlertTriangle
          className="mt-0.5 h-6 w-6 shrink-0 text-[color:var(--severity-critical)]"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-base font-extrabold uppercase tracking-wide text-[color:var(--severity-critical)]">
            {activeAlert ? activeAlert.event : alertState === "loading" ? "Checking current disaster" : "Current disaster"}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground/85">
            {activeAlert?.headline ||
              (hasRealLocation
                ? alertState === "error"
                  ? "Live alert lookup is unavailable; route is still generated from your live location."
                  : `No ${alertScope === "state" ? "local" : "active"} alert found; route generated for ${currentDisaster.label.toLowerCase()} near your live location.`
                : "Share your location to load the current disaster and route.")}
            {activeAlert && alertScope === "state" ? " Statewide alert shown." : ""}
          </p>
        </div>
      </div>

      {/* Real-time location status */}
      <div
        className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm shadow-sm ${
          hasRealLocation
            ? "border-[color:var(--severity-low)]/40 bg-[color:var(--severity-low)]/10 text-foreground"
            : "border-border bg-white text-foreground/80"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          {geoStatus === "prompting" ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          ) : (
            <MapPin
              className={`h-4 w-4 shrink-0 ${hasRealLocation ? "text-[color:var(--severity-low)]" : "text-foreground/60"}`}
              aria-hidden="true"
            />
          )}
          <span className="truncate font-medium">
            {hasRealLocation
              ? `Live location · ±${Math.round(accuracyMeters ?? 0)} m`
              : geoStatus === "prompting"
                ? "Getting your location…"
                : geoStatus === "denied"
                  ? "Location permission denied"
                  : geoStatus === "unsupported"
                    ? "Geolocation not supported"
                    : geoError ?? "Location not shared"}
          </span>
        </div>
        {geoStatus !== "prompting" && (
          <button
            type="button"
            onClick={requestLocation}
            className="shrink-0 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
          >
            {hasRealLocation ? "Refresh" : "Use my location"}
          </button>
        )}
      </div>

      {/* Map */}
      <MapPanel
        disaster={currentDisaster.label}
        routes={routes}
        selectedRouteId={selectedRouteId}
        onSelectRoute={setSelectedRouteId}
        locationAware={hasRealLocation}
        destinations={hasRealLocation ? evacuation.destinations : undefined}
      />

      {hasRealLocation && (
        <div className="rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground shadow-sm">
          <p className="font-semibold">
            {evacuation.isLoading
              ? "Updating route…"
              : routes.find((route) => route.id === selectedRouteId)?.name ?? "Route ready"}
          </p>
          <p className="mt-1 text-xs text-foreground/65">
            {evacuation.source === "live"
              ? "Using live road routing from your current GPS position."
              : "Using estimated routing until live road routing responds."}
          </p>
        </div>
      )}

      {/* Status confirmation */}
      {lastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-border bg-white px-4 py-3 text-center text-sm font-semibold text-foreground shadow-sm"
        >
          {lastMessage}
        </div>
      )}

      {/* Four large buttons */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ACTIONS.map((a) => {
          const active = status === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onAction(a)}
              aria-pressed={active}
              className={`flex min-h-[88px] items-center justify-center gap-3 rounded-2xl px-5 py-5 text-lg font-bold shadow-sm outline-none transition focus-visible:ring-4 focus-visible:ring-offset-2 ${a.className} ${active ? "ring-4 ring-offset-2" : ""}`}
            >
              <a.Icon className="h-6 w-6" aria-hidden="true" />
              {a.label}
            </button>
          );
        })}
      </div>

      {/* 911 safety note */}
      <p className="rounded-xl bg-card-foreground/5 px-4 py-3 text-center text-sm font-medium text-foreground/75">
        If life is in danger, call <span className="font-bold text-foreground">911</span> and follow
        official instructions.
      </p>
    </div>
  );
}

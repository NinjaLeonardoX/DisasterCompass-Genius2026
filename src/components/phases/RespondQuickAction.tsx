import { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck, Siren, MapPin, Loader2, Check } from "lucide-react";
import { MapPanel } from "../compass/MapPanel";
import { WeatherCard } from "../WeatherCard";
import { useLocation } from "../LocationContext";
import { useEvacuationRoutes } from "@/lib/queries/evacuation";
import { fetchAlertsByPoint } from "@/lib/nwsAlerts";
import { readSOSRecipient, formatSOSMessage } from "@/routes/iq";





type Status = "none" | "safe" | "stuck" | "needs_help" | "sos";

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
    message: "Glad you are safe!",
  },
  {
    id: "sos",
    label: "Send SOS",
    Icon: Siren,
    className:
      "bg-[color:var(--severity-critical)] text-white hover:bg-[color:var(--severity-critical)]/90 focus-visible:ring-[color:var(--severity-critical)] ring-2 ring-[color:var(--severity-critical)]/40",
    message: "Sent",
  },
];

export function RespondQuickAction() {
  const [status, setStatus] = useState<Status>("none");
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const {
    household,
    source,
    status: geoStatus,
    error: geoError,
    accuracyMeters,
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

  // Location-aware evacuation: synthesize safe destinations near the real
  // origin and route via ORS (or honest straight-line fallback). Always yields
  // a line, regardless of how far the user is from the seed scenario.
  const { routes, destinations } = useEvacuationRoutes(home, "flood", true);

  // Active alert event from NWS for the user's location. Defaults to
  // "Heat Wave" when no alert is active or the fetch fails.
  const [alertEvent, setAlertEvent] = useState<string>("Heat Wave");
  useEffect(() => {
    const controller = new AbortController();
    fetchAlertsByPoint(home[0], home[1], controller.signal)
      .then((res) => {
        const top = res?.alerts?.[0]?.event;
        setAlertEvent(top && top !== "Unknown event" ? top : "Heat Wave");
      })
      .catch(() => setAlertEvent("Heat Wave"));
    return () => controller.abort();
  }, [home[0], home[1]]);




  const onAction = (a: ActionDef) => {
    setStatus(a.id);
    if (a.id === "sos") {
      setLastMessage(`Sent to ${formatSOSMessage(readSOSRecipient())}`);
    } else {
      setLastMessage(a.message);
    }
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
            Active Alert · {alertEvent}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground/85">
            Follow the safe route and avoid marked danger areas.
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
        {!hasRealLocation && geoStatus !== "prompting" && (
          <button
            type="button"
            onClick={requestLocation}
            className="shrink-0 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
          >
            Use my location
          </button>
        )}
      </div>

      {/* Live weather at the user's location */}
      <WeatherCard lat={home[0]} lng={home[1]} />

      {/* Map */}
      <MapPanel
        disaster="Flood"
        routes={routes}
        selectedRouteId={selectedRouteId}
        onSelectRoute={setSelectedRouteId}
        locationAware={hasRealLocation}
        destinations={
          destinations.length > 0
            ? destinations.map((d) => ({ id: d.id, name: d.name, lat: d.lat, lng: d.lng }))
            : undefined
        }
      />



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
              className={`relative flex min-h-[88px] items-center justify-center gap-3 rounded-2xl px-5 py-5 text-lg font-bold shadow-sm outline-none transition focus-visible:ring-4 focus-visible:ring-offset-2 ${a.className} ${active ? "ring-4 ring-offset-2 ring-white/60" : "opacity-90 hover:opacity-100"}`}
            >
              {active && (
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md">
                  <Check className="h-4 w-4 text-foreground" aria-hidden="true" />
                </span>
              )}
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

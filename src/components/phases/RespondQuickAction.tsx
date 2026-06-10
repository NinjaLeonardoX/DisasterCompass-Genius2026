import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck, Siren, MapPin, Loader2, Check, Navigation, WifiOff } from "lucide-react";
import { MapPanel } from "../compass/MapPanel";
import { WeatherCard } from "../WeatherCard";
import { useLocation } from "../LocationContext";
import { useEvacuationRoutes } from "@/lib/queries/evacuation";
import { fetchAlertsByPoint } from "@/lib/nwsAlerts";
import { readSOSRecipient, formatSOSMessage } from "@/routes/iq";
import type { RouteOption } from "@/types";

const ROUTE_CACHE_KEY = "dc.respond.lastRoute.v1";
const LOC_CACHE_KEY = "dc.respond.lastLocation.v1";

interface CachedRoute {
  route: RouteOption;
  destinationName?: string;
  savedAt: number;
}
interface CachedLoc {
  lat: number;
  lng: number;
  accuracyMeters: number | null;
  savedAt: number;
}

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "—";
  }
}





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
  const [refreshTick, setRefreshTick] = useState(0);

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
  // location and route via ORS (or honest straight-line fallback). Always yields
  // a line, regardless of how far the user is from the seed scenario.
  const { routes, destinations } = useEvacuationRoutes(home, "flood", true, refreshTick);

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
  }, [home[0], home[1], refreshTick]);

  // Re-check route + alert data every 10 seconds.
  useEffect(() => {
    const id = setInterval(() => setRefreshTick((t) => t + 1), 10000);
    return () => clearInterval(id);
  }, []);

  // Track when we last received a real device location.
  const [locationUpdatedAt, setLocationUpdatedAt] = useState<number | null>(null);
  useEffect(() => {
    if (hasRealLocation) {
      const now = Date.now();
      setLocationUpdatedAt(now);
      try {
        const payload: CachedLoc = { lat: home[0], lng: home[1], accuracyMeters: accuracyMeters ?? null, savedAt: now };
        localStorage.setItem(LOC_CACHE_KEY, JSON.stringify(payload));
      } catch {}
    }
  }, [hasRealLocation, home[0], home[1], accuracyMeters]);

  // Cached (offline) location + route restored from localStorage on mount.
  const [cachedLoc, setCachedLoc] = useState<CachedLoc | null>(null);
  const [cachedRoute, setCachedRoute] = useState<CachedRoute | null>(null);
  useEffect(() => {
    try {
      const l = localStorage.getItem(LOC_CACHE_KEY);
      if (l) setCachedLoc(JSON.parse(l));
      const r = localStorage.getItem(ROUTE_CACHE_KEY);
      if (r) setCachedRoute(JSON.parse(r));
    } catch {}
  }, []);

  // Online/offline awareness so the user knows when data is stale.
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  useEffect(() => {
    const on = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Pick the currently displayed route (selected or top-ranked safe route).
  const displayRoute = useMemo<RouteOption | null>(() => {
    if (!routes || routes.length === 0) return null;
    if (selectedRouteId) {
      const m = routes.find((r) => r.id === selectedRouteId);
      if (m) return m;
    }
    const safe = routes.find((r) => r.colorType === "safe");
    return safe ?? routes[0];
  }, [routes, selectedRouteId]);

  const displayDestName = useMemo(() => {
    if (!displayRoute) return undefined;
    return destinations.find((d) => d.id === displayRoute.destinationId)?.name;
  }, [displayRoute, destinations]);

  // Persist the current route so it survives reloads / offline.
  useEffect(() => {
    if (!displayRoute) return;
    try {
      const payload: CachedRoute = {
        route: displayRoute,
        destinationName: displayDestName,
        savedAt: Date.now(),
      };
      localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(payload));
      setCachedRoute(payload);
    } catch {}
  }, [displayRoute, displayDestName]);






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
          <p className="mt-1 text-xs text-foreground/50">
            Source: National Weather Service (NWS)
          </p>
        </div>

      </div>

      {/* Real-time location status (auto, no button) */}
      <div
        className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm shadow-sm ${
          hasRealLocation
            ? "border-[color:var(--severity-low)]/40 bg-[color:var(--severity-low)]/10 text-foreground"
            : "border-border bg-white text-foreground/80"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          {geoStatus === "prompting" || (!hasRealLocation && geoStatus === "idle") ? (
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
              : geoStatus === "denied"
                ? "Location permission denied — enable it in your browser"
                : geoStatus === "unsupported"
                  ? "Geolocation not supported on this device"
                  : geoStatus === "error"
                    ? (geoError ?? "Couldn't get location — retrying…")
                    : "Getting your location…"}
          </span>
        </div>
        {(hasRealLocation || cachedLoc) && (
          <span className="shrink-0 text-xs text-foreground/60">
            Updated {formatTime((hasRealLocation ? locationUpdatedAt : cachedLoc?.savedAt) ?? Date.now())}
          </span>
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

      {/* Safe Navigation — persistent route details (works offline) */}
      <section
        aria-label="Safe navigation"
        className="rounded-2xl border border-border bg-white p-4 shadow-sm"
      >
        <header className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-[color:var(--severity-low)]" aria-hidden="true" />
            <h3 className="text-sm font-bold tracking-wide text-foreground">Safe Navigation</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground/60">
            {isOffline && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">
                <WifiOff className="h-3 w-3" aria-hidden="true" /> Offline
              </span>
            )}
            {(displayRoute || cachedRoute) && (
              <span>Updated {formatTime((displayRoute ? Date.now() : cachedRoute!.savedAt))}</span>
            )}
          </div>
        </header>

        {displayRoute || cachedRoute ? (
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-base font-bold text-foreground">
                {(displayRoute ?? cachedRoute!.route).name}
              </span>
              <span className="text-foreground/70">
                → {displayDestName ?? cachedRoute?.destinationName ?? "Safe destination"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Distance" value={`${(displayRoute ?? cachedRoute!.route).distanceMiles.toFixed(1)} mi`} />
              <Stat label="ETA" value={`${Math.round((displayRoute ?? cachedRoute!.route).estimatedMinutes)} min`} />
              <Stat label="Elev. gain" value={`${Math.round((displayRoute ?? cachedRoute!.route).elevationGain)} ft`} />
            </div>
            {((displayRoute ?? cachedRoute!.route).streets?.length ?? 0) > 0 && (
              <details className="rounded-lg bg-foreground/[0.03] px-3 py-2">
                <summary className="cursor-pointer text-xs font-semibold text-foreground/80">
                  Turn-by-turn streets ({(displayRoute ?? cachedRoute!.route).streets!.length})
                </summary>
                <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-xs text-foreground/75">
                  {(displayRoute ?? cachedRoute!.route).streets!.slice(0, 12).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </details>
            )}
            {(displayRoute ?? cachedRoute!.route).notes && (
              <p className="text-xs text-foreground/60">{(displayRoute ?? cachedRoute!.route).notes}</p>
            )}
            {!displayRoute && cachedRoute && (
              <p className="text-xs text-amber-700">
                Showing last known route from {formatTime(cachedRoute.savedAt)}. Reconnect for live updates.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-foreground/60">
            {hasRealLocation ? "Calculating safe route…" : "Waiting for your location to compute a safe route."}
          </p>
        )}
      </section>






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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-foreground/[0.04] px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-foreground/55">{label}</div>
      <div className="text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}


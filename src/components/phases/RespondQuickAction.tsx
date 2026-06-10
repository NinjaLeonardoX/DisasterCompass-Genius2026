import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck, Siren, MapPin, Loader2, Check } from "lucide-react";
import { MapPanel } from "../compass/MapPanel";
import { WeatherCard } from "../WeatherCard";
import { useLocation } from "../LocationContext";
import { useRoutes, resolveDestinationShelter } from "@/lib/queries/routing";
import { SHELTERS } from "@/data/seed";
import type { Shelter } from "@/types";
import { readSOSRecipient, formatSOSRecipient } from "@/routes/iq";

// Haversine distance in km between two [lat, lng] points.
function distanceKm(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
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

  // Pick the nearest seed shelter as the destination. Falls back to the
  // scenario's default destination (Hilltop) when no shelters are nearby.
  const nearestShelter: Shelter | undefined = useMemo(() => {
    if (SHELTERS.length === 0) return resolveDestinationShelter();
    let best = SHELTERS[0];
    let bestD = distanceKm(home, [best.lat, best.lng]);
    for (const s of SHELTERS.slice(1)) {
      const d = distanceKm(home, [s.lat, s.lng]);
      if (d < bestD) {
        best = s;
        bestD = d;
      }
    }
    return best;
  }, [home[0], home[1]]);

  const destShelter = nearestShelter ?? resolveDestinationShelter();
  const dest: [number, number] = destShelter ? [destShelter.lat, destShelter.lng] : home;

  // Avoid attempting a live cross-country route (e.g. user in NY → seed
  // shelter in Boulder); routing only makes sense within ~150 km.
  const destReachable = destShelter
    ? distanceKm(home, [destShelter.lat, destShelter.lng]) < 150
    : false;
  const routingDest: [number, number] = destReachable ? dest : home;
  const { data: routes } = useRoutes(home, routingDest);
  const mapRoutes = hasRealLocation && !destReachable ? [] : routes;

  const onAction = (a: ActionDef) => {
    setStatus(a.id);
    if (a.id === "sos") {
      setLastMessage(`Sent to ${formatSOSRecipient(readSOSRecipient())}`);
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
            Active Alert
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
        routes={mapRoutes}
        selectedRouteId={selectedRouteId}
        onSelectRoute={setSelectedRouteId}
        locationAware={hasRealLocation}
        destinations={
          hasRealLocation && destReachable && destShelter
            ? [{ id: destShelter.id, name: destShelter.name, lat: destShelter.lat, lng: destShelter.lng }]
            : undefined
        }
      />

      {hasRealLocation && !destReachable && (
        <p className="rounded-xl border border-border bg-white px-4 py-2.5 text-center text-xs text-foreground/70 shadow-sm">
          No seed shelter is within range of your live location — showing your area only.
          Routes appear when you're within ~150 km of a configured shelter.
        </p>
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

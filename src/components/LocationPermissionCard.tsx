import { MapPin, LocateFixed, ShieldCheck, AlertCircle } from "lucide-react";
import { useLocation } from "./LocationContext";

/**
 * Compact card shown at the top of Prepare to let users opt into real
 * device geolocation. Hidden once a device fix is in use.
 */
export function LocationPermissionCard() {
  const { source, status, error, accuracyMeters, household, requestLocation, useSeed } =
    useLocation();

  if (source === "device") {
    return (
      <div className="dc-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--severity-low)]/15 text-[color:var(--severity-low)]">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Using your real location</p>
            <p className="text-xs text-card-foreground/65">
              {household.locationName}
              {accuracyMeters != null && Number.isFinite(accuracyMeters)
                ? ` · ±${Math.round(accuracyMeters)} m`
                : ""}
            </p>
          </div>
        </div>
        <button
          onClick={useSeed}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface/70"
        >
          Use demo location
        </button>
      </div>
    );
  }

  const isBusy = status === "prompting";
  const hasError = status === "denied" || status === "error" || status === "unsupported";

  return (
    <div className="dc-card flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--severity-low)]/15 text-[color:var(--severity-low)]">
          <MapPin className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Center the dashboard on you</p>
          <p className="text-xs text-card-foreground/65">
            {hasError
              ? error || "Couldn't read your location — using demo data."
              : "Allow location to score the routes and shelters nearest to you."}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {hasError && (
          <span className="inline-flex items-center gap-1 text-xs text-[color:var(--severity-high)]">
            <AlertCircle className="h-3.5 w-3.5" /> Demo location
          </span>
        )}
        <button
          onClick={requestLocation}
          disabled={isBusy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:brightness-110 disabled:opacity-60"
        >
          <LocateFixed className="h-3.5 w-3.5" />
          {isBusy ? "Locating…" : hasError ? "Try again" : "Use my location"}
        </button>
      </div>
    </div>
  );
}

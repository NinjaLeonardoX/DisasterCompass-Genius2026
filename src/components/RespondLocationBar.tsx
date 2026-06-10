import { useState, type FormEvent } from "react";
import { MapPin, LocateFixed, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "./LocationContext";
import { forwardGeocode } from "@/lib/geocoding";
import { makeId, upsertAddress, type SavedAddress } from "@/lib/savedAddresses";

/**
 * In-context location input for the Respond flow. Lets the user geocode an
 * address or use device GPS; the chosen point becomes the household origin
 * (via LocationContext), and the evacuation routes recompute around it.
 */
export function RespondLocationBar() {
  const { household, source, requestLocation, status, selectAddress, refreshAddresses } =
    useLocation();
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function findRoutes(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const q = address.trim();
    if (q.length < 4) {
      setError("Enter a fuller address (street, city).");
      return;
    }
    setBusy(true);
    try {
      const geo = await forwardGeocode(q);
      if (!geo) {
        setError("Couldn't find that address — try adding city + state.");
        return;
      }
      const saved: SavedAddress = {
        id: makeId(),
        name: "My location",
        address: q,
        lat: geo.lat,
        lng: geo.lng,
        displayName: geo.displayName,
        city: geo.city,
        county: geo.county,
        state: geo.state,
        stateCode: geo.stateCode,
        country: geo.country,
        countryCode: geo.countryCode,
        savedAt: new Date().toISOString(),
      };
      await upsertAddress(saved);
      selectAddress(saved.id);
      refreshAddresses();
      toast.success(`Routing from ${geo.city ?? geo.displayName ?? "your location"}`);
      setAddress("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setBusy(false);
    }
  }

  const scope =
    source === "seed"
      ? "Demo location — North Creek (enter your address for routes near you)"
      : `Routing from: ${household.locationName}`;

  return (
    <div className="dc-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-card-foreground/80">
          <MapPin className="h-4 w-4 text-[color:var(--severity-low)]" aria-hidden="true" />
          {scope}
        </span>
        <button
          type="button"
          onClick={requestLocation}
          disabled={status === "prompting"}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface disabled:opacity-60"
        >
          {status === "prompting" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Use my location
        </button>
      </div>

      <form onSubmit={findRoutes} className="mt-3 flex flex-wrap gap-2">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          maxLength={200}
          placeholder="Enter your address (e.g. 123 Main St, Austin, TX)"
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4" aria-hidden="true" />
          )}
          Find safe routes
        </button>
      </form>

      {error && <p className="mt-2 text-xs text-[color:var(--severity-high)]">{error}</p>}
      <p className="mt-2 text-[11px] text-card-foreground/55">
        Safe targets are computed near you — not a vetted shelter list. Real road routes need the
        routing API key; otherwise distances shown are straight-line estimates.
      </p>
    </div>
  );
}

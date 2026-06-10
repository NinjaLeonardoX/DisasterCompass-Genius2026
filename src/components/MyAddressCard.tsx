import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  LocateFixed,
  Save,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useLocation } from "./LocationContext";
import { forwardGeocode } from "@/lib/geocoding";
import {
  deleteAddress,
  listAddresses,
  makeId,
  upsertAddress,
  type SavedAddress,
} from "@/lib/savedAddresses";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Max 60 characters"),
  address: z.string().trim().min(5, "Enter a full street address").max(200, "Max 200 characters"),
});

/**
 * Address entry + saved-address picker. Rendered at the very top of the app
 * shell so the household location is set before any phase renders.
 * No backend — saves to localStorage only.
 */
export function MyAddressCard() {
  const {
    source,
    household,
    activeAddress,
    accuracyMeters,
    status,
    requestLocation,
    selectAddress,
    useSeed,
    refreshAddresses,
  } = useLocation();

  const [open, setOpen] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [name, setName] = useState("Home");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listAddresses().then((list) => {
      if (!cancelled) setAddresses(list);
    });
    return () => {
      cancelled = true;
    };
  }, [open, activeAddress?.id]);

  // Seed the form from the active saved address (so "Update" works).
  useEffect(() => {
    if (activeAddress) {
      setName(activeAddress.name);
      setAddress(activeAddress.address);
    }
  }, [activeAddress?.id]);

  const subtitle = useMemo(() => {
    if (source === "saved" && activeAddress) {
      return `Saved · ${activeAddress.name} — ${activeAddress.displayName ?? activeAddress.address}`;
    }
    if (source === "device") {
      const acc = accuracyMeters != null ? ` · ±${Math.round(accuracyMeters)} m` : "";
      return `Device · ${household.locationName}${acc}`;
    }
    return "Demo · North Creek (no real location set)";
  }, [source, activeAddress, accuracyMeters, household.locationName]);

  async function handleSave(updateExisting: boolean) {
    setFormError(null);
    const parsed = formSchema.safeParse({ name, address });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      const geo = await forwardGeocode(parsed.data.address);
      if (!geo) {
        setFormError("Could not find that address. Try adding city + state.");
        return;
      }
      const id = updateExisting && activeAddress ? activeAddress.id : makeId();
      const saved: SavedAddress = {
        id,
        name: parsed.data.name,
        address: parsed.data.address,
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
      const list = await listAddresses();
      setAddresses(list);
      toast.success(updateExisting ? `Updated "${saved.name}"` : `Saved "${saved.name}"`);
      setOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAddress(id);
      refreshAddresses();
      const list = await listAddresses();
      setAddresses(list);
      toast.success("Address removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  return (
    <div className="dc-card border-b border-border bg-card/95 p-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--severity-low)]/15 text-[color:var(--severity-low)]">
            <MapPin className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">My address</p>
            <p className="truncate text-xs text-card-foreground/65">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={requestLocation}
            disabled={status === "prompting"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface disabled:opacity-60"
          >
            {status === "prompting" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LocateFixed className="h-3.5 w-3.5" />
            )}
            Use my location
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:brightness-110"
          >
            Enter address
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 grid gap-4 rounded-xl border border-border bg-surface/40 p-4 md:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-card-foreground/55">
                  Save as
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  placeholder="Home"
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-card-foreground/55">
                  Street address
                </span>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={200}
                  placeholder="123 Main St, Austin, TX 78701"
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                />
              </label>
            </div>

            {formError && (
              <p className="flex items-center gap-1.5 text-xs text-[color:var(--severity-high)]">
                <AlertCircle className="h-3.5 w-3.5" /> {formError}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                disabled={busy}
                onClick={() => handleSave(false)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save as new
              </button>
              {activeAddress && (
                <button
                  disabled={busy}
                  onClick={() => handleSave(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface/70 disabled:opacity-60"
                >
                  <Check className="h-3.5 w-3.5" /> Update "{activeAddress.name}"
                </button>
              )}
              {source !== "seed" && (
                <button
                  onClick={useSeed}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface/70"
                >
                  Use demo location
                </button>
              )}
            </div>
            <p className="text-[11px] text-card-foreground/55">
              Stored in shared cloud — visible on every device. No login.
            </p>
          </div>

          <div className="min-w-[220px] space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-card-foreground/55">
              Saved addresses
            </p>
            {addresses.length === 0 && (
              <p className="text-xs text-card-foreground/55">None yet.</p>
            )}
            <ul className="space-y-1.5">
              {addresses.map((a) => {
                const active = a.id === activeAddress?.id;
                return (
                  <li
                    key={a.id}
                    className={`flex items-start justify-between gap-2 rounded-md border px-2 py-1.5 text-xs ${
                      active
                        ? "border-primary/60 bg-primary/5"
                        : "border-border bg-background"
                    }`}
                  >
                    <button
                      onClick={() => selectAddress(a.id)}
                      className="flex-1 text-left"
                    >
                      <p className="font-semibold text-foreground">
                        {a.name} {active && <span className="text-primary">· active</span>}
                      </p>
                      <p className="truncate text-card-foreground/65">
                        {a.displayName ?? a.address}
                      </p>
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-card-foreground/55 hover:text-[color:var(--severity-high)]"
                      aria-label={`Delete ${a.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

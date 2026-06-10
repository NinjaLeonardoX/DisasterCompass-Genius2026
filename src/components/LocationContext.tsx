import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { RIVERA_HOUSEHOLD } from "@/data/seed";
import type { Household } from "@/types";
import { useDeviceLocation, type GeoStatus } from "@/hooks/useDeviceLocation";

interface LocationContextValue {
  household: Household;
  source: "device" | "seed";
  status: GeoStatus;
  error: string | null;
  accuracyMeters: number | null;
  requestLocation: () => void;
  useSeed: () => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

const REVERSE_GEOCODE_CACHE: Record<string, string> = {};

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (REVERSE_GEOCODE_CACHE[key]) return REVERSE_GEOCODE_CACHE[key];
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as {
      address?: { city?: string; town?: string; village?: string; county?: string; state?: string };
    };
    const a = data.address ?? {};
    const place = a.city ?? a.town ?? a.village ?? a.county ?? "Your area";
    const region = a.state ?? "";
    const label = region ? `Near ${place}, ${region}` : `Near ${place}`;
    REVERSE_GEOCODE_CACHE[key] = label;
    return label;
  } catch {
    return "Your current location";
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const { status, coords, error, request, clear } = useDeviceLocation();
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  // Reverse-geocode whenever coords change.
  useEffect(() => {
    if (!coords) {
      setLocationLabel(null);
      return;
    }
    let cancelled = false;
    reverseGeocode(coords.lat, coords.lng).then((label) => {
      if (!cancelled) setLocationLabel(label);
    });
    return () => {
      cancelled = true;
    };
  }, [coords]);

  const value = useMemo<LocationContextValue>(() => {
    const source: "device" | "seed" = coords ? "device" : "seed";
    const household: Household = coords
      ? {
          ...RIVERA_HOUSEHOLD,
          lat: coords.lat,
          lng: coords.lng,
          locationName: locationLabel ?? "Your current location",
        }
      : RIVERA_HOUSEHOLD;
    return {
      household,
      source,
      status,
      error,
      accuracyMeters: coords?.accuracyMeters ?? null,
      requestLocation: request,
      useSeed: clear,
    };
  }, [coords, locationLabel, status, error, request, clear]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    // Safe fallback so components used outside the provider (e.g. tests) still work.
    return {
      household: RIVERA_HOUSEHOLD,
      source: "seed",
      status: "idle",
      error: null,
      accuracyMeters: null,
      requestLocation: () => {},
      useSeed: () => {},
    };
  }
  return ctx;
}

/** Convenience: just the household (device-overridden when available). */
export function useHousehold(): Household {
  return useLocation().household;
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { RIVERA_HOUSEHOLD } from "@/data/seed";
import type { Household } from "@/types";
import { useDeviceLocation, type GeoStatus } from "@/hooks/useDeviceLocation";
import {
  getActiveAddressId,
  listAddresses,
  setActiveAddressId,
  type SavedAddress,
} from "@/lib/savedAddresses";
import { reverseGeocode, type GeocodeResult } from "@/lib/geocoding";

export type LocationSource = "device" | "saved" | "seed";

interface LocationContextValue {
  household: Household;
  source: LocationSource;
  /** Device geolocation lifecycle (only meaningful when source === "device"). */
  status: GeoStatus;
  error: string | null;
  accuracyMeters: number | null;
  /** Active saved address (if any). */
  activeAddress: SavedAddress | null;
  /** Active geocode resolution — city/county/state — sourced from device OR saved address. */
  resolved: GeocodeResult | null;

  requestLocation: () => void;
  useSeed: () => void;
  selectAddress: (id: string | null) => void;
  /** Force a refresh of the saved-addresses list cache. */
  refreshAddresses: () => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

function householdFromSaved(addr: SavedAddress): Household {
  return {
    ...RIVERA_HOUSEHOLD,
    locationName: addr.name,
    lat: addr.lat,
    lng: addr.lng,
  };
}

function resolvedFromSaved(addr: SavedAddress): GeocodeResult {
  return {
    lat: addr.lat,
    lng: addr.lng,
    displayName: addr.displayName ?? addr.address,
    city: addr.city ?? null,
    county: addr.county ?? null,
    state: addr.state ?? null,
    stateCode: addr.stateCode ?? null,
    country: addr.country ?? null,
    countryCode: addr.countryCode ?? null,
  };
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const { status, coords, error, request, clear } = useDeviceLocation();
  const [activeAddress, setActiveAddress] = useState<SavedAddress | null>(null);
  const [deviceResolved, setDeviceResolved] = useState<GeocodeResult | null>(null);
  const [addrsTick, setAddrsTick] = useState(0);

  // Hydrate active saved address on mount and whenever the saved-list changes.
  useEffect(() => {
    const id = getActiveAddressId();
    if (!id) {
      setActiveAddress(null);
      return;
    }
    let cancelled = false;
    listAddresses().then((list) => {
      if (cancelled) return;
      setActiveAddress(list.find((a) => a.id === id) ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [addrsTick]);

  // Reverse-geocode whenever device coords change (only when no saved address is active).
  useEffect(() => {
    if (!coords || activeAddress) {
      setDeviceResolved(null);
      return;
    }
    let cancelled = false;
    reverseGeocode(coords.lat, coords.lng).then((r) => {
      if (!cancelled) setDeviceResolved(r);
    });
    return () => {
      cancelled = true;
    };
  }, [coords, activeAddress]);

  const selectAddress = useCallback((id: string | null) => {
    setActiveAddressId(id);
    if (!id) {
      setActiveAddress(null);
      return;
    }
    listAddresses().then((list) => {
      setActiveAddress(list.find((a) => a.id === id) ?? null);
    });
  }, []);

  const refreshAddresses = useCallback(() => {
    setAddrsTick((n) => n + 1);
  }, []);

  const value = useMemo<LocationContextValue>(() => {
    // Priority: saved address > device geolocation > seed fallback.
    if (activeAddress) {
      return {
        household: householdFromSaved(activeAddress),
        source: "saved",
        status,
        error: null,
        accuracyMeters: null,
        activeAddress,
        resolved: resolvedFromSaved(activeAddress),
        requestLocation: request,
        useSeed: () => {
          clear();
          selectAddress(null);
        },
        selectAddress,
        refreshAddresses,
      };
    }
    if (coords) {
      const household: Household = {
        ...RIVERA_HOUSEHOLD,
        lat: coords.lat,
        lng: coords.lng,
        locationName: deviceResolved
          ? `Near ${deviceResolved.city ?? deviceResolved.county ?? "you"}${
              deviceResolved.state ? `, ${deviceResolved.state}` : ""
            }`
          : "Your current location",
      };
      return {
        household,
        source: "device",
        status,
        error,
        accuracyMeters: coords.accuracyMeters,
        activeAddress: null,
        resolved: deviceResolved,
        requestLocation: request,
        useSeed: () => {
          clear();
          selectAddress(null);
        },
        selectAddress,
        refreshAddresses,
      };
    }
    return {
      household: RIVERA_HOUSEHOLD,
      source: "seed",
      status,
      error,
      accuracyMeters: null,
      activeAddress: null,
      resolved: null,
      requestLocation: request,
      useSeed: () => {
        clear();
        selectAddress(null);
      },
      selectAddress,
      refreshAddresses,
    };
  }, [activeAddress, coords, deviceResolved, status, error, request, clear, selectAddress, refreshAddresses]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    return {
      household: RIVERA_HOUSEHOLD,
      source: "seed",
      status: "idle",
      error: null,
      accuracyMeters: null,
      activeAddress: null,
      resolved: null,
      requestLocation: () => {},
      useSeed: () => {},
      selectAddress: () => {},
      refreshAddresses: () => {},
    };
  }
  return ctx;
}

export function useHousehold(): Household {
  return useLocation().household;
}

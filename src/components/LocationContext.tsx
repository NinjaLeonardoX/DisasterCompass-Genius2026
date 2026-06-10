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

/** A location pushed in directly by the Safety Location panel (preset or geocoded address). */
export interface ManualLocation {
  name: string;
  resolved: GeocodeResult;
}

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
  /** True once the user has explicitly chosen/confirmed a safety location. */
  locationConfirmed: boolean;
  confirmLocation: () => void;
  resetLocation: () => void;

  requestLocation: () => void;
  useSeed: () => void;
  selectAddress: (id: string | null) => void;
  /** Push a location chosen in the Safety Location panel so the whole app follows it. */
  setManualLocation: (loc: ManualLocation | null) => void;
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
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [manualLocation, setManualLocationState] = useState<ManualLocation | null>(null);

  const confirmLocation = useCallback(() => setLocationConfirmed(true), []);
  const resetLocation = useCallback(() => setLocationConfirmed(false), []);
  const setManualLocation = useCallback((loc: ManualLocation | null) => setManualLocationState(loc), []);

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

  const useSeed = useCallback(() => {
    clear();
    selectAddress(null);
    setManualLocationState(null);
  }, [clear, selectAddress]);

  const value = useMemo<LocationContextValue>(() => {
    const base = {
      locationConfirmed,
      confirmLocation,
      resetLocation,
      setManualLocation,
      requestLocation: request,
      useSeed,
      selectAddress,
      refreshAddresses,
      status,
    };
    // Priority: manual panel pick > saved address > device geolocation > seed.
    if (manualLocation) {
      const r = manualLocation.resolved;
      const synthetic: SavedAddress = {
        id: "manual",
        name: manualLocation.name,
        address: r.displayName ?? manualLocation.name,
        lat: r.lat,
        lng: r.lng,
        displayName: r.displayName ?? undefined,
        city: r.city,
        county: r.county,
        state: r.state,
        stateCode: r.stateCode,
        country: r.country,
        countryCode: r.countryCode,
        savedAt: "",
      };
      return {
        ...base,
        household: householdFromSaved(synthetic),
        source: "saved",
        error: null,
        accuracyMeters: null,
        activeAddress: synthetic,
        resolved: r,
      };
    }
    if (activeAddress) {
      return {
        ...base,
        household: householdFromSaved(activeAddress),
        source: "saved",
        error: null,
        accuracyMeters: null,
        activeAddress,
        resolved: resolvedFromSaved(activeAddress),
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
        ...base,
        household,
        source: "device",
        error,
        accuracyMeters: coords.accuracyMeters,
        activeAddress: null,
        resolved: deviceResolved,
      };
    }
    return {
      ...base,
      household: RIVERA_HOUSEHOLD,
      source: "seed",
      error,
      accuracyMeters: null,
      activeAddress: null,
      resolved: null,
    };
  }, [manualLocation, activeAddress, coords, deviceResolved, status, error, request, useSeed, selectAddress, refreshAddresses, locationConfirmed, confirmLocation, resetLocation, setManualLocation]);

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
      locationConfirmed: false,
      confirmLocation: () => {},
      resetLocation: () => {},
      requestLocation: () => {},
      useSeed: () => {},
      selectAddress: () => {},
      setManualLocation: () => {},
      refreshAddresses: () => {},
    };
  }
  return ctx;
}

export function useHousehold(): Household {
  return useLocation().household;
}

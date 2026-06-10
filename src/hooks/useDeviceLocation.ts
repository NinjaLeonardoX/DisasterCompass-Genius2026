import { useCallback, useEffect, useRef, useState } from "react";

export type GeoStatus =
  | "idle"
  | "unsupported"
  | "prompting"
  | "granted"
  | "denied"
  | "error";

export interface GeoCoords {
  lat: number;
  lng: number;
  accuracyMeters: number;
}

const CACHE_KEY = "dc:device-location:v1";

function readCache(): GeoCoords | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GeoCoords;
    if (
      typeof parsed?.lat === "number" &&
      typeof parsed?.lng === "number" &&
      Number.isFinite(parsed.lat) &&
      Number.isFinite(parsed.lng)
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Client-only wrapper around `navigator.geolocation.getCurrentPosition`.
 * SSR-safe: returns `idle` with no coords on the server.
 * Caches the last successful grant in sessionStorage so refresh doesn't re-prompt.
 */
export function useDeviceLocation() {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Hydrate from session cache on mount (client only).
  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setCoords(cached);
      setStatus("granted");
    }
  }, []);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      setError("Geolocation is not available in this browser.");
      return;
    }
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus("prompting");
    setError(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const next: GeoCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy ?? 0,
        };
        setCoords(next);
        setStatus("granted");
        try {
          window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(next));
        } catch {
          /* ignore quota */
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
          setError("Location permission denied.");
        } else {
          setStatus("error");
          setError(err.message || "Could not get location.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, []);

  const clear = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation && watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setCoords(null);
    setStatus("idle");
    setError(null);
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(CACHE_KEY);
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typeof navigator !== "undefined" && navigator.geolocation && watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { status, coords, error, request, clear };
}

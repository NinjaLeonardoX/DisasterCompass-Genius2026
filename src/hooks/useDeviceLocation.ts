import { useCallback, useEffect, useState } from "react";

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
    setStatus("prompting");
    setError(null);

    const onSuccess = (pos: GeolocationPosition) => {
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
    };

    // A cold GPS fix can be slow, so a single getCurrentPosition call times out
    // intermittently. First try a fast attempt that accepts a recent cached
    // fix; if that times out, retry once with high accuracy and a longer budget
    // before surfacing an error. Permission denials fail fast (no retry).
    const fail = (err: GeolocationPositionError) => {
      if (err.code === err.PERMISSION_DENIED) {
        setStatus("denied");
        setError("Location permission denied.");
      } else {
        setStatus("error");
        setError(err.message || "Could not get location.");
      }
    };

    navigator.geolocation.getCurrentPosition(onSuccess, (firstErr) => {
      if (firstErr.code === firstErr.PERMISSION_DENIED) {
        fail(firstErr);
        return;
      }
      navigator.geolocation.getCurrentPosition(onSuccess, fail, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      });
    }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 });
  }, []);

  const clear = useCallback(() => {
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

  return { status, coords, error, request, clear };
}

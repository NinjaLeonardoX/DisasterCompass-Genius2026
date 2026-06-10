// Persistence for the Saved Safety Location list (readiness onboarding).
// Pure client-side localStorage — matches the existing device-only model
// used elsewhere in Disaster Compass. Schema is versioned so older payloads
// are dropped cleanly when the structure changes.

const STORAGE_KEY = "dc:savedLocations:v3";

export function loadStoredLocations<T>(): T[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as T[];
  } catch {
    return null;
  }
}

export function saveStoredLocations<T>(locations: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  } catch {
    /* ignore quota / serialization issues */
  }
}

import type { Shelter } from "@/types";

// Adapters are PURE functions that map a raw live-API payload into the app's
// existing domain types. Keeping the mapping here (and out of the engines and
// the fetcher) means the engines never know or care whether data came from a
// live source or the seed — the types are identical.

/**
 * Raw shape returned by the (future) live shelters source. A minimal,
 * JSON-serializable placeholder (server functions require serializable
 * payloads); the real Overpass element shape is defined in Phase 6.
 */
export interface RawShelter {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tags?: Record<string, string>;
}

/**
 * Map raw live shelters into domain `Shelter[]`. Placeholder until Phase 6 —
 * never executed while the `infra` flag is off.
 */
export function adaptShelters(_raw: RawShelter[]): Shelter[] {
  return [];
}

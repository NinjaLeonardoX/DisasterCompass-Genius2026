import { createServerFn } from "@tanstack/react-start";
import type { RawShelter } from "@/lib/adapters/shelters";

// Server-side fetchers live here. They do raw network only (no mapping) and are
// the single place any API key would be read, via process.env inside the
// handler — keys never reach the client bundle.
//
// This is a Phase 0 PLACEHOLDER. The handler throws "not implemented" so that
// if someone flips the `infra` flag on prematurely, the fetch fails and
// useLiveOrSeed gracefully falls back to the seed instead of returning bad
// data. The real Overpass query is wired in Phase 6.

export const fetchSheltersRaw = createServerFn({ method: "GET" }).handler(
  async (): Promise<RawShelter[]> => {
    throw new Error("[live] shelters source not implemented until Phase 6 (Overpass)");
  },
);

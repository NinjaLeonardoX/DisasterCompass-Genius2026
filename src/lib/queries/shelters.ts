import { useLiveOrSeed, type LiveOrSeedResult } from "@/lib/live/fallback";
import { flags } from "@/lib/live/flags";
import { fetchSheltersRaw } from "@/lib/api/shelters.server";
import { adaptShelters } from "@/lib/adapters/shelters";
import { SHELTERS } from "@/data/seed";
import type { Shelter } from "@/types";

// Example query hook demonstrating the full layered pattern:
//   flag (flags.infra) + serverFn (fetchSheltersRaw) + adapter (adaptShelters)
//   + seed fallback (SHELTERS) -> a single typed result.
//
// Pages would call `const { data: shelters, source } = useShelters()` and read
// `data` exactly as they read the seed today. With `infra` off (the default),
// this returns the seed with no network request — the app is unchanged.

export function useShelters(): LiveOrSeedResult<Shelter[]> {
  return useLiveOrSeed<Shelter[]>({
    queryKey: ["live", "shelters"],
    enabled: flags.infra,
    seed: SHELTERS,
    fetcher: async () => adaptShelters(await fetchSheltersRaw()),
    staleTimeMs: 24 * 60 * 60 * 1000, // shelters change rarely
  });
}

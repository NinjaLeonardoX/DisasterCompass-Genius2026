import { useQuery, type QueryKey } from "@tanstack/react-query";

// useLiveOrSeed — the safety valve for every live integration.
//
// Contract:
//   • flag OFF  -> return the seed immediately, NO network request at all.
//   • flag ON   -> fetch via the provided (server) fetcher, with a sensible
//                  staleTime and a single retry. While loading, OR on any
//                  error, fall back to the seed. The app never crashes, never
//                  shows an infinite spinner, and never renders a blank state.
//
// The hook always returns the same shape, and `source` tells the UI whether it
// is showing live or seed data (drive a Live/Demo badge off it).
//
// `useQuery` is always called (hook order stays stable); the flag controls its
// `enabled` option rather than whether the hook runs.

const DEFAULT_STALE_MS = 5 * 60 * 1000; // 5 minutes

export interface LiveOrSeedResult<T> {
  data: T;
  source: "live" | "seed";
  isLoading: boolean;
  error: Error | null;
}

export interface UseLiveOrSeedOptions<T> {
  /** React Query cache key. */
  queryKey: QueryKey;
  /** The feature flag for this source. When false, no network happens. */
  enabled: boolean;
  /** Offline fallback data — always available, always typed. */
  seed: T;
  /** Live fetcher (typically a createServerFn call). Only invoked when enabled. */
  fetcher: () => Promise<T>;
  /** How long fetched data stays fresh. Defaults to 5 minutes. */
  staleTimeMs?: number;
}

export function useLiveOrSeed<T>({
  queryKey,
  enabled,
  seed,
  fetcher,
  staleTimeMs = DEFAULT_STALE_MS,
}: UseLiveOrSeedOptions<T>): LiveOrSeedResult<T> {
  const query = useQuery<T, Error>({
    queryKey,
    queryFn: fetcher,
    enabled,
    retry: 1,
    staleTime: staleTimeMs,
    refetchOnWindowFocus: false,
  });

  // Flag off: pure seed, no network, nothing pending.
  if (!enabled) {
    return { data: seed, source: "seed", isLoading: false, error: null };
  }

  // Flag on and we have successfully fetched data.
  if (query.data !== undefined && !query.isError) {
    return { data: query.data, source: "live", isLoading: query.isLoading, error: null };
  }

  // Flag on but still loading or errored: show seed, surface loading/error state.
  return {
    data: seed,
    source: "seed",
    isLoading: query.isLoading,
    error: query.error ?? null,
  };
}

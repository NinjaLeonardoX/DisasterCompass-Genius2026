import { useEffect, useState } from "react";

// useLiveOrSeed — the single composition point for every live-data source.
//
// Contract (matches the Respond playbook's operating principles):
//   - Flag OFF             ⇒ returns `seed`, source "demo", no network call.
//   - Flag ON + fetch ok   ⇒ returns adapter(raw), source "live".
//   - Flag ON + missing/error/malformed ⇒ returns `seed`, source "demo".
// It never throws and never returns undefined data, so the UI can render the
// seed unconditionally and upgrade to live when (and only when) it arrives.
//
// Implemented with useState/useEffect rather than react-query so it is fully
// self-contained and SSR-safe: the first (server + hydration) render always
// returns the seed, and the live fetch runs client-only inside the effect —
// no hydration mismatch, no provider coupling.

export type DataSource = "live" | "demo";

export interface LiveOrSeedResult<T> {
  data: T;
  source: DataSource;
  isLoading: boolean;
}

interface UseLiveOrSeedOptions<TRaw, TData> {
  /** Whether the live source is enabled (its feature flag is on). */
  enabled: boolean;
  /** Fetches the raw live payload (typically a createServerFn call). */
  fetcher: () => Promise<TRaw>;
  /** Pure function mapping the raw payload into the app's shape. */
  adapter: (raw: TRaw) => TData;
  /** Seed/demo value returned when off, loading, or on any failure. */
  seed: TData;
  /** Extra dependencies that should re-trigger the fetch when changed. */
  deps?: ReadonlyArray<unknown>;
}

export function useLiveOrSeed<TRaw, TData>({
  enabled,
  fetcher,
  adapter,
  seed,
  deps = [],
}: UseLiveOrSeedOptions<TRaw, TData>): LiveOrSeedResult<TData> {
  const [state, setState] = useState<LiveOrSeedResult<TData>>({
    data: seed,
    source: "demo",
    isLoading: false,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ data: seed, source: "demo", isLoading: false });
      return;
    }

    let cancelled = false;
    setState({ data: seed, source: "demo", isLoading: true });

    fetcher()
      .then((raw) => {
        if (cancelled) return;
        try {
          setState({ data: adapter(raw), source: "live", isLoading: false });
        } catch (err) {
          console.info("[live-data] adapter failed, using seed:", err);
          setState({ data: seed, source: "demo", isLoading: false });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.info("[live-data] fetch failed, using seed:", err);
        setState({ data: seed, source: "demo", isLoading: false });
      });

    return () => {
      cancelled = true;
    };
    // `seed`, `fetcher`, and `adapter` are intentionally excluded: the queries
    // pass fresh closures each render, and `deps` captures the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return state;
}

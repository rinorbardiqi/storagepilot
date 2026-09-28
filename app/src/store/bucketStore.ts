import { create } from 'zustand';
import type { Bucket } from '../api/types';
import { useConnectionStore } from './connectionStore';

interface FetchBucketsOptions {
  force?: boolean;
}

interface BucketState {
  buckets: Bucket[];
  loading: boolean;
  error: string | null;
  fetchBuckets: (options?: FetchBucketsOptions) => Promise<void>;
}

// Generation counter — incremented on every fetch start so stale responses
// from a previous profile/connection can be discarded.
let fetchGeneration = 0;
let fetchInFlight: Promise<void> | null = null;
let inFlightProfileId: string | null = null;
let lastFetchedProfileId: string | null = null;

/** Stable refresh helper — safe to use in effect dependency arrays. */
export function refreshBuckets(): Promise<void> {
  return useBucketStore.getState().fetchBuckets({ force: true });
}

export const useBucketStore = create<BucketState>()((set, get) => ({
  buckets: [],
  loading: false,
  error: null,

  fetchBuckets: async (options) => {
    const activeProfileId = useConnectionStore.getState().activeProfileId;
    const status = activeProfileId
      ? useConnectionStore.getState().connectionStatus[activeProfileId]
      : undefined;
    if (status !== 'connected') {
      lastFetchedProfileId = null;
      set({ buckets: [], loading: false, error: null });
      return;
    }

    // Reuse an in-flight request only when it is for the same profile and no
    // fresh list was asked for (a forced refresh must see recent mutations).
    if (!options?.force && fetchInFlight && inFlightProfileId === activeProfileId) {
      return fetchInFlight;
    }

    if (!options?.force && activeProfileId && lastFetchedProfileId === activeProfileId) {
      if (!get().loading) return;
    }

    const provider = useConnectionStore.getState().getActiveProvider();
    if (!provider) {
      set({ buckets: [], loading: false, error: null });
      return;
    }

    // Starting a new generation discards whatever older request is still running.
    const gen = ++fetchGeneration;
    const run = (async () => {
      set({ loading: true, error: null });
      try {
        const buckets = await provider.listBuckets();
        if (gen !== fetchGeneration) return;
        lastFetchedProfileId = activeProfileId;
        set({ buckets, loading: false });
      } catch (err) {
        if (gen !== fetchGeneration) return;
        set({
          error: err instanceof Error ? err.message : 'Failed to load buckets',
          buckets: [],
          loading: false,
        });
      }
    })().finally(() => {
      if (fetchInFlight === run) {
        fetchInFlight = null;
        inFlightProfileId = null;
      }
    });

    fetchInFlight = run;
    inFlightProfileId = activeProfileId;
    return run;
  },
}));

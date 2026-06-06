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

    if (
      !options?.force &&
      activeProfileId &&
      lastFetchedProfileId === activeProfileId &&
      fetchInFlight
    ) {
      return fetchInFlight;
    }

    if (!options?.force && activeProfileId && lastFetchedProfileId === activeProfileId) {
      if (!get().loading) return;
    }

    if (fetchInFlight) return fetchInFlight;

    fetchInFlight = (async () => {
      const provider = useConnectionStore.getState().getActiveProvider();
      if (!provider) {
        set({ buckets: [], loading: false, error: null });
        return;
      }
      const gen = ++fetchGeneration;
      set({ loading: true, error: null });
      try {
        const buckets = await provider.listBuckets();
        if (gen !== fetchGeneration) return;
        lastFetchedProfileId = useConnectionStore.getState().activeProfileId;
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
      fetchInFlight = null;
    });

    return fetchInFlight;
  },
}));

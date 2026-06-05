import { create } from 'zustand';
import type { Bucket } from '../api/types';
import { useConnectionStore } from './connectionStore';

interface BucketState {
  buckets: Bucket[];
  loading: boolean;
  error: string | null;
  fetchBuckets: () => Promise<void>;
}

// Generation counter — incremented on every fetch start so stale responses
// from a previous profile/connection can be discarded.
let fetchGeneration = 0;

export const useBucketStore = create<BucketState>()((set) => ({
  buckets: [],
  loading: false,
  error: null,

  fetchBuckets: async () => {
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
      set({ buckets, loading: false });
    } catch (err) {
      if (gen !== fetchGeneration) return;
      set({
        error: err instanceof Error ? err.message : 'Failed to load buckets',
        buckets: [],
        loading: false,
      });
    }
  },
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createProvider, type ConnectionProfile } from '../api/providerFactory';
import type { StorageProvider } from '../api/StorageProvider';
import { buildDefaultProfiles, isDefaultProfileId, reconcileProfiles } from '../lib/reconcileProfiles';
import { useActivityStore } from './activityStore';

export type ConnectionStatus = 'connected' | 'disconnected' | 'checking' | 'unconfigured';

interface ConnectionState {
  profiles: ConnectionProfile[];
  activeProfileId: string | null;
  deletedDefaultIds: string[];
  connectionStatus: Record<string, ConnectionStatus>;
  connectionErrors: Record<string, string>;

  getActiveProvider: () => StorageProvider | null;
  getProviderForProfile: (profileId: string) => StorageProvider | null;
  addProfile: (profile: ConnectionProfile) => void;
  updateProfile: (id: string, updates: Partial<ConnectionProfile>) => void;
  removeProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  setStatus: (id: string, status: ConnectionStatus) => void;
  testConnection: (id: string, options?: { force?: boolean }) => Promise<boolean>;
}

const DEFAULT_PROFILES: ConnectionProfile[] = buildDefaultProfiles();

/**
 * Provider instance cache keyed by profile ID.
 * Invalidated on updateProfile / removeProfile to avoid stale SDK clients.
 */
const providerCache = new Map<string, StorageProvider>();

function getCachedProvider(profile: ConnectionProfile): StorageProvider {
  const cached = providerCache.get(profile.id);
  if (cached) return cached;
  const logger = useActivityStore.getState();
  const provider = createProvider(profile, logger);
  providerCache.set(profile.id, provider);
  return provider;
}

function invalidateProvider(id: string): void {
  providerCache.delete(id);
}

const testInFlight = new Map<string, Promise<boolean>>();

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      profiles: DEFAULT_PROFILES,
      activeProfileId: 'default-gcs',
      deletedDefaultIds: [],
      connectionStatus: {},
      connectionErrors: {},

      getActiveProvider: () => {
        const { activeProfileId } = get();
        return activeProfileId ? get().getProviderForProfile(activeProfileId) : null;
      },

      getProviderForProfile: (profileId) => {
        const profile = get().profiles.find((p) => p.id === profileId);
        if (!profile) return null;
        return getCachedProvider(profile);
      },

      addProfile: (profile) => set((s) => ({ profiles: [...s.profiles, profile] })),

      updateProfile: (id, updates) => {
        invalidateProvider(id);
        set((s) => {
          const nextStatus = { ...s.connectionStatus };
          const nextErrors = { ...s.connectionErrors };
          delete nextStatus[id];
          delete nextErrors[id];
          return {
            profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
            connectionStatus: nextStatus,
            connectionErrors: nextErrors,
          };
        });
      },

      removeProfile: (id) => {
        invalidateProvider(id);
        set((s) => {
          const removed = s.profiles.find((p) => p.id === id);
          if (!removed) return s;

          const profiles = s.profiles.filter((p) => p.id !== id);
          const deletedDefaultIds = isDefaultProfileId(id)
            ? [...new Set([...s.deletedDefaultIds, id])]
            : s.deletedDefaultIds;

          const nextStatus = { ...s.connectionStatus };
          const nextErrors = { ...s.connectionErrors };
          delete nextStatus[id];
          delete nextErrors[id];

          const activeProfileId =
            s.activeProfileId === id ? (profiles[0]?.id ?? null) : s.activeProfileId;

          return {
            profiles,
            deletedDefaultIds,
            activeProfileId,
            connectionStatus: nextStatus,
            connectionErrors: nextErrors,
          };
        });
      },

      setActiveProfile: (id) =>
        set((s) => (s.activeProfileId === id ? s : { activeProfileId: id })),

      setStatus: (id, status) =>
        set((s) => {
          const nextErrors =
            status === 'connected'
              ? (() => {
                  const next = { ...s.connectionErrors };
                  delete next[id];
                  return next;
                })()
              : s.connectionErrors;
          return {
            connectionStatus: { ...s.connectionStatus, [id]: status },
            connectionErrors: nextErrors,
          };
        }),

      testConnection: async (id, options) => {
        const { profiles, setStatus, connectionStatus } = get();
        const profile = profiles.find((p) => p.id === id);
        if (!profile) return false;
        if (!options?.force && connectionStatus[id] === 'connected') return true;

        const inFlight = testInFlight.get(id);
        if (inFlight) return inFlight;

        if (connectionStatus[id] === 'checking') return false;

        const run = (async () => {
          // Invalidate cache so we test with a fresh client (picks up config changes).
          invalidateProvider(id);
          setStatus(id, 'checking');
          try {
            const provider = getCachedProvider(profile);
            const ok = await provider.testConnection();
            setStatus(id, ok ? 'connected' : 'disconnected');
            return ok;
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Connection failed';
            setStatus(id, 'disconnected');
            set((s) => ({
              connectionErrors: { ...s.connectionErrors, [id]: message },
            }));
            return false;
          }
        })();

        testInFlight.set(id, run);
        try {
          return await run;
        } finally {
          if (testInFlight.get(id) === run) testInFlight.delete(id);
        }
      },
    }),
    {
      name: 'storagepilot-connections',
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        deletedDefaultIds: state.deletedDefaultIds,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<typeof current> | undefined;
        if (!p?.profiles?.length) return current;
        const deletedDefaultIds = p.deletedDefaultIds ?? [];
        const profiles = reconcileProfiles(p.profiles, deletedDefaultIds);
        const activeProfileId =
          p.activeProfileId && profiles.some((pr) => pr.id === p.activeProfileId)
            ? p.activeProfileId
            : profiles[0]?.id ?? current.activeProfileId;
        return { ...current, ...p, profiles, activeProfileId, deletedDefaultIds };
      },
    },
  ),
);

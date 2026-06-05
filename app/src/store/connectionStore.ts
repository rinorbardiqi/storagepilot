import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createProvider, type ConnectionProfile } from '../api/providerFactory';
import type { StorageProvider } from '../api/StorageProvider';
import { buildDefaultProfiles, isDefaultProfileId, reconcileProfiles } from '../lib/reconcileProfiles';

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
  testConnection: (id: string) => Promise<boolean>;
}

const DEFAULT_PROFILES: ConnectionProfile[] = buildDefaultProfiles();

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
    return createProvider(profile);
  },

  addProfile: (profile) => set((s) => ({ profiles: [...s.profiles, profile] })),

  updateProfile: (id, updates) =>
    set((s) => ({
      profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  removeProfile: (id) =>
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
    }),

  setActiveProfile: (id) => set({ activeProfileId: id }),

  setStatus: (id, status) =>
    set((s) => ({ connectionStatus: { ...s.connectionStatus, [id]: status } })),

  testConnection: async (id) => {
    const { profiles, setStatus } = get();
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return false;
    setStatus(id, 'checking');
    try {
      const provider = createProvider(profile);
      const ok = await provider.testConnection();
      setStatus(id, ok ? 'connected' : 'disconnected');
      if (ok) {
        set((s) => {
          const next = { ...s.connectionErrors };
          delete next[id];
          return { connectionErrors: next };
        });
      }
      return ok;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setStatus(id, 'disconnected');
      set((s) => ({
        connectionErrors: { ...s.connectionErrors, [id]: message },
      }));
      return false;
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

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProviderType } from '../api/types';

export interface ActivityEntry {
  id: string;
  method: string;
  provider: ProviderType;
  args: unknown[];
  timestamp: Date;
  status: 'pending' | 'success' | 'error';
  duration: number;
  error?: string;
  httpStatus?: number;
}

const MAX_ENTRIES = 1000;

interface ActivityState {
  entries: ActivityEntry[];
  addEntry: (entry: ActivityEntry) => void;
  updateEntry: (id: string, updates: Partial<ActivityEntry>) => void;
  clearLog: () => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      entries: [],

      addEntry: (entry) =>
        set((s) => ({
          entries: [entry, ...s.entries].slice(0, MAX_ENTRIES),
        })),

      updateEntry: (id, updates) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      clearLog: () => set({ entries: [] }),
    }),
    {
      name: 'storagepilot-activity',
      partialize: (s) => ({
        entries: s.entries.map((e) => ({
          ...e,
          timestamp: e.timestamp instanceof Date ? e.timestamp.toISOString() : e.timestamp,
        })),
      }),
      merge: (persisted, current) => {
        const p = persisted as { entries?: Array<Omit<ActivityEntry, 'timestamp'> & { timestamp: string }> } | undefined;
        if (!p?.entries) return current;
        return {
          ...current,
          entries: p.entries.map((e) => ({
            ...e,
            timestamp: new Date(e.timestamp),
          })),
        };
      },
    },
  ),
);

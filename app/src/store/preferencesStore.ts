import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProviderType } from '../api/types';
import { ALL_PROVIDER_TYPES, normalizeEnabledProviders } from '../lib/providerSelection';
import { providersKey } from '../lib/setupManifest';

interface PreferencesState {
  theme: 'dark' | 'light';
  tableColumns: string[];
  pinnedBuckets: string[];
  onboardingComplete: boolean;
  onboardingStep: 1 | 2;
  bucketListLayout: 'grid' | 'list';
  /** Storage backends shown in the sidebar (one, two, or all). */
  enabledProviders: ProviderType[];
  uiDensity: 'relaxed' | 'standard' | 'compact';
  showShortcutHints: boolean;
  recentlyVisited: string[];
  recentSearches: Array<{ query: string; bucket: string; at: number }>;

  setTheme: (theme: 'dark' | 'light') => void;
  pinBucket: (provider: string, bucket: string) => void;
  unpinBucket: (provider: string, bucket: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setOnboardingStep: (step: 1 | 2) => void;
  setBucketListLayout: (layout: 'grid' | 'list') => void;
  setEnabledProviders: (providers: ProviderType[]) => void;
  setUiDensity: (density: PreferencesState['uiDensity']) => void;
  setShowShortcutHints: (show: boolean) => void;
  addRecentBucket: (bucket: string) => void;
  addRecentSearch: (query: string, bucket: string) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'dark',
      tableColumns: ['name', 'size', 'contentType', 'lastModified'],
      pinnedBuckets: [],
      onboardingComplete: false,
      onboardingStep: 1,
      bucketListLayout: 'list',
      enabledProviders: [...ALL_PROVIDER_TYPES],
      uiDensity: 'standard',
      showShortcutHints: true,
      recentlyVisited: [],
      recentSearches: [],

      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
      },

      pinBucket: (provider, bucket) =>
        set((s) => ({
          pinnedBuckets: [...new Set([...s.pinnedBuckets, `${provider}:${bucket}`])],
        })),

      unpinBucket: (provider, bucket) =>
        set((s) => ({
          pinnedBuckets: s.pinnedBuckets.filter((b) => b !== `${provider}:${bucket}`),
        })),

      completeOnboarding: () => set({ onboardingComplete: true, onboardingStep: 1 }),

      resetOnboarding: () => set({ onboardingComplete: false, onboardingStep: 1 }),

      setOnboardingStep: (onboardingStep) => set({ onboardingStep }),

      setBucketListLayout: (bucketListLayout) => set({ bucketListLayout }),

      setEnabledProviders: (enabledProviders) =>
        set((s) => {
          const next = normalizeEnabledProviders(enabledProviders);
          if (providersKey(s.enabledProviders) === providersKey(next)) return s;
          return { enabledProviders: next };
        }),

      setUiDensity: (uiDensity) => set({ uiDensity }),

      setShowShortcutHints: (showShortcutHints) => set({ showShortcutHints }),

      addRecentBucket: (bucket) =>
        set((s) => ({
          recentlyVisited: [bucket, ...s.recentlyVisited.filter((b) => b !== bucket)].slice(0, 8),
        })),

      addRecentSearch: (query, bucket) =>
        set((s) => {
          const trimmed = query.trim();
          if (!trimmed) return s;
          const entry = { query: trimmed, bucket, at: Date.now() };
          const rest = s.recentSearches.filter(
            (r) => !(r.query === trimmed && r.bucket === bucket),
          );
          return { recentSearches: [entry, ...rest].slice(0, 10) };
        }),
    }),
    {
      name: 'storagepilot-preferences',
      merge: (persisted, current) => {
        const p = persisted as (Partial<PreferencesState> & { providerFocus?: unknown }) | undefined;
        if (!p) return current;
        const { providerFocus: _legacy, ...rest } = p;
        return {
          ...current,
          ...rest,
          enabledProviders: normalizeEnabledProviders(p.enabledProviders, p.providerFocus),
        };
      },
    },
  ),
);

// Apply theme on load
if (typeof document !== 'undefined') {
  const stored = localStorage.getItem('storagepilot-preferences');
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { state?: { theme?: string } };
      const theme = parsed.state?.theme ?? 'dark';
      document.documentElement.setAttribute('data-theme', theme);
    } catch {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }
}

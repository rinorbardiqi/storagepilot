import type { ProviderType } from '../api/types';
import { useConnectionStore } from '../store/connectionStore';
import { usePreferencesStore } from '../store/preferencesStore';
import {
  DEFAULT_PROFILE_BY_TYPE,
  normalizeEnabledProviders,
} from './providerSelection';
import {
  availableProvidersFromManifest,
  filterToAvailable,
  type SetupManifest,
} from './setupManifest';

export {
  ALL_PROVIDER_TYPES,
  DEFAULT_PROFILE_BY_TYPE,
  normalizeEnabledProviders,
  toggleProviderSelection,
} from './providerSelection';

export function applyOnboardingSources(
  types: ProviderType[],
  manifest?: SetupManifest | null,
): void {
  const allowed = availableProvidersFromManifest(manifest ?? null);
  const filtered = filterToAvailable(types, manifest ?? null);
  const enabled = normalizeEnabledProviders(filtered.length ? filtered : allowed);
  const primary = enabled[0]!;

  usePreferencesStore.getState().setEnabledProviders(enabled);
  useConnectionStore.getState().setActiveProfile(DEFAULT_PROFILE_BY_TYPE[primary]);
  usePreferencesStore.getState().completeOnboarding();

  for (const type of enabled) {
    void useConnectionStore.getState().testConnection(DEFAULT_PROFILE_BY_TYPE[type]);
  }
}

/** @deprecated Use applyOnboardingSources */
export function applyOnboardingSource(type: ProviderType): void {
  applyOnboardingSources([type]);
}

import type { ProviderType } from '../api/types';
import { ALL_PROVIDER_TYPES } from './providerSelection';

export interface SetupManifest {
  deployment: 'bundled' | string;
  enabledProviders: ProviderType[];
  ports?: Record<string, number>;
}

let cachedManifest: SetupManifest | null | undefined;

function parseProviderList(value: unknown): ProviderType[] {
  if (!Array.isArray(value)) return [];
  return value.filter((t): t is ProviderType => t === 'gcs' || t === 's3' || t === 'azure');
}

/** Providers available in this deployment (manifest or all three in dev/:ui). */
export function providersKey(providers: ProviderType[]): string {
  return providers.join(',');
}

export function availableProvidersFromManifest(manifest: SetupManifest | null): ProviderType[] {
  if (!manifest?.enabledProviders?.length) return [...ALL_PROVIDER_TYPES];
  const parsed = parseProviderList(manifest.enabledProviders);
  return parsed.length ? parsed : [...ALL_PROVIDER_TYPES];
}

export function filterToAvailable(
  selected: ProviderType[],
  manifest: SetupManifest | null,
): ProviderType[] {
  const available = new Set(availableProvidersFromManifest(manifest));
  const filtered = selected.filter((t) => available.has(t));
  return filtered.length ? filtered : availableProvidersFromManifest(manifest);
}

export async function fetchSetupManifest(): Promise<SetupManifest | null> {
  if (cachedManifest !== undefined) return cachedManifest;

  try {
    const res = await fetch('/setup-manifest.json', { cache: 'no-store' });
    if (!res.ok) {
      cachedManifest = null;
      return null;
    }
    const data = (await res.json()) as SetupManifest;
    const providers = parseProviderList(data.enabledProviders);
    if (!providers.length) {
      cachedManifest = null;
      return null;
    }
    cachedManifest = { ...data, enabledProviders: providers };
    return cachedManifest;
  } catch {
    cachedManifest = null;
    return null;
  }
}

/** Reset cache (tests). */
export function resetSetupManifestCache(): void {
  cachedManifest = undefined;
}

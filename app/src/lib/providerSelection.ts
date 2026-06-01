import type { ProviderType } from '../api/types';

export const ALL_PROVIDER_TYPES: ProviderType[] = ['gcs', 's3', 'azure'];

export const DEFAULT_PROFILE_BY_TYPE: Record<ProviderType, string> = {
  gcs: 'default-gcs',
  s3: 'default-s3',
  azure: 'default-azure',
};

export function normalizeEnabledProviders(
  value: unknown,
  legacyFocus?: unknown,
): ProviderType[] {
  if (Array.isArray(value)) {
    const filtered = value.filter(
      (t): t is ProviderType => t === 'gcs' || t === 's3' || t === 'azure',
    );
    const unique = [...new Set(filtered)];
    if (unique.length) return unique;
  }

  if (legacyFocus === 'multi') return [...ALL_PROVIDER_TYPES];
  if (legacyFocus === 'gcs' || legacyFocus === 's3' || legacyFocus === 'azure') {
    return [legacyFocus];
  }

  return [...ALL_PROVIDER_TYPES];
}

export function toggleProviderSelection(
  selected: ProviderType[],
  type: ProviderType,
): ProviderType[] {
  if (selected.includes(type)) {
    if (selected.length === 1) return selected;
    return selected.filter((t) => t !== type);
  }
  return [...selected, type];
}

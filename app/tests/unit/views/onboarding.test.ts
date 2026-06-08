import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROFILE_BY_TYPE,
  normalizeEnabledProviders,
  toggleProviderSelection,
} from '@/lib/providerSelection';

describe('normalizeEnabledProviders', () => {
  it('keeps valid provider arrays', () => {
    expect(normalizeEnabledProviders(['gcs', 's3'])).toEqual(['gcs', 's3']);
    expect(normalizeEnabledProviders(['azure', 'azure', 'gcs'])).toEqual(['azure', 'gcs']);
  });

  it('maps legacy single focus to one provider', () => {
    expect(normalizeEnabledProviders(undefined, 'azure')).toEqual(['azure']);
  });

  it('maps legacy multi to all providers', () => {
    expect(normalizeEnabledProviders(undefined, 'multi')).toEqual(['gcs', 's3', 'azure']);
  });

  it('defaults to all providers', () => {
    expect(normalizeEnabledProviders(undefined)).toEqual(['gcs', 's3', 'azure']);
    expect(normalizeEnabledProviders([])).toEqual(['gcs', 's3', 'azure']);
  });
});

describe('toggleProviderSelection', () => {
  it('adds and removes providers', () => {
    expect(toggleProviderSelection(['gcs'], 's3')).toEqual(['gcs', 's3']);
    expect(toggleProviderSelection(['gcs', 's3'], 's3')).toEqual(['gcs']);
  });

  it('does not remove the last provider', () => {
    expect(toggleProviderSelection(['gcs'], 'gcs')).toEqual(['gcs']);
  });
});

describe('DEFAULT_PROFILE_BY_TYPE', () => {
  it('maps each provider to a default profile id', () => {
    expect(DEFAULT_PROFILE_BY_TYPE.gcs).toBe('default-gcs');
    expect(DEFAULT_PROFILE_BY_TYPE.s3).toBe('default-s3');
    expect(DEFAULT_PROFILE_BY_TYPE.azure).toBe('default-azure');
  });
});

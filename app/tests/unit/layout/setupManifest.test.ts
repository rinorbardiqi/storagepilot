import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  availableProvidersFromManifest,
  fetchSetupManifest,
  filterToAvailable,
  resetSetupManifestCache,
} from '@/lib/setupManifest';

afterEach(() => {
  resetSetupManifestCache();
  vi.restoreAllMocks();
});

describe('setupManifest', () => {
  it('returns all providers when manifest is null', () => {
    expect(availableProvidersFromManifest(null)).toEqual(['gcs', 's3', 'azure']);
  });

  it('parses bundled manifest providers', () => {
    expect(
      availableProvidersFromManifest({
        deployment: 'bundled',
        enabledProviders: ['s3'],
      }),
    ).toEqual(['s3']);
  });

  it('filters selection to available providers', () => {
    expect(
      filterToAvailable(['gcs', 's3'], {
        deployment: 'bundled',
        enabledProviders: ['s3'],
      }),
    ).toEqual(['s3']);
  });

  it('fetchSetupManifest caches successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ deployment: 'bundled', enabledProviders: ['gcs', 'azure'] }),
      }),
    );

    const first = await fetchSetupManifest();
    const second = await fetchSetupManifest();

    expect(first?.enabledProviders).toEqual(['gcs', 'azure']);
    expect(second).toBe(first);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('fetchSetupManifest returns null on 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await fetchSetupManifest()).toBeNull();
  });
});

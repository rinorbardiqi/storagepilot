import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AzureProvider } from '@/api/AzureProvider';
import { deleteBucketWithContents } from '@/api/providerHelpers';
import { AZURITE_ACCOUNT_KEY } from '@/lib/emulatorEndpoints';

const AZURITE_UP = process.env.AZURITE_INTEGRATION === '1' || process.env.STORAGEPILOT_INTEGRATION === '1';

function proxyProvider() {
  return new AzureProvider({
    type: 'azure',
    azureHost: 'http://localhost:3000/api/azure/devstoreaccount1',
    azureAccountName: 'devstoreaccount1',
    azureAccountKey: AZURITE_ACCOUNT_KEY,
  });
}

describe.skipIf(!AZURITE_UP)('AzureProvider integration', () => {
  // Own container so these tests don't depend on whatever Azurite already holds.
  const container = `sp-test-azver-${Date.now().toString(36)}`;
  beforeAll(async () => {
    const provider = proxyProvider();
    await provider.createBucket(container);
    await provider.uploadObject(container, 'export-1.csv', new File(['a,b\n1,2\n'], 'export-1.csv', { type: 'text/csv' }));
  });
  afterAll(async () => {
    await deleteBucketWithContents(proxyProvider(), container).catch(() => undefined);
  });

  it('connects via nginx proxy URL', async () => {
    await expect(proxyProvider().listBuckets()).resolves.toEqual(expect.any(Array));
  });

  it.skip('connects via direct Azurite URL (port 10000 not exposed from Docker)', async () => {
    const provider = new AzureProvider({
      type: 'azure',
      azureHost: 'http://localhost:10000/devstoreaccount1',
      azureAccountName: 'devstoreaccount1',
      azureAccountKey: AZURITE_ACCOUNT_KEY,
    });
    await expect(provider.listBuckets()).resolves.toEqual(expect.any(Array));
  });

  it('listVersions with include=versions authenticates via proxy', async () => {
    const provider = proxyProvider();
    const versions = await provider.listVersions(container, `missing-${Date.now()}.txt`);
    expect(versions).toEqual([]);
  });

  it.skip('listVersions with include=versions authenticates via direct Azurite', async () => {
    const provider = new AzureProvider({
      type: 'azure',
      azureHost: 'http://localhost:10000/devstoreaccount1',
      azureAccountName: 'devstoreaccount1',
      azureAccountKey: AZURITE_ACCOUNT_KEY,
    });
    const bucket = (await provider.listBuckets())[0]?.name;
    expect(bucket).toBeTruthy();

    const versions = await provider.listVersions(bucket!, `missing-${Date.now()}.txt`);
    expect(versions).toEqual([]);
  });

  it('listVersions returns current blob when object exists', async () => {
    const provider = proxyProvider();
    const versions = await provider.listVersions(container, 'export-1.csv');
    expect(versions.length).toBeGreaterThanOrEqual(1);
    expect(versions.some((v) => v.isLatest)).toBe(true);
  }, 15000);
});

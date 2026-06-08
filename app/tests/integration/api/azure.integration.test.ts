import { describe, expect, it } from 'vitest';
import { AzureProvider } from '@/api/AzureProvider';
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
    const bucket = (await provider.listBuckets())[0]?.name;
    expect(bucket).toBeTruthy();

    const versions = await provider.listVersions(bucket!, `missing-${Date.now()}.txt`);
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
    const bucket = (await provider.listBuckets())[0]?.name;
    expect(bucket).toBeTruthy();

    const objects = await provider.listObjects(bucket!);
    const obj = objects.objects.find((o) => !o.isFolder && o.key === 'export-1.csv') ??
      objects.objects.find((o) => !o.isFolder);
    if (!obj) return;

    const versions = await provider.listVersions(bucket!, obj.key);
    expect(versions.length).toBeGreaterThanOrEqual(1);
    expect(versions.some((v) => v.isLatest)).toBe(true);
  }, 15000);
});

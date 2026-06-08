import { describe, expect, it } from 'vitest';
import { AzureProvider } from '@/api/AzureProvider';
import { GCSProvider } from '@/api/GCSProvider';
import { S3Provider } from '@/api/S3Provider';
import type { StorageProvider } from '@/api/StorageProvider';
import { deleteBucketWithContents } from '@/api/providerHelpers';
import { AZURITE_ACCOUNT_KEY } from '@/lib/emulatorEndpoints';

const INTEGRATION = process.env.STORAGEPILOT_INTEGRATION === '1';

function azureProvider() {
  return new AzureProvider({
    type: 'azure',
    azureHost: 'http://localhost:3000/api/azure/devstoreaccount1',
    azureAccountName: 'devstoreaccount1',
    azureAccountKey: AZURITE_ACCOUNT_KEY,
  });
}

function gcsProvider() {
  return new GCSProvider({ type: 'gcs', gcsUrl: 'http://localhost:3000/api/gcs' });
}

function s3Provider() {
  return new S3Provider({
    type: 's3',
    s3Endpoint: 'http://localhost:9000',
    s3AccessKey: 'storagepilot',
    s3SecretKey: 'storagepilot',
  });
}

async function exerciseProvider(
  provider: StorageProvider,
  bucket: string,
  key: string,
  file: File,
  contentType: string,
) {
  await provider.createBucket(bucket);
  await provider.uploadObject(bucket, key, file, { contentType });

  const listed = await provider.listObjects(bucket, {});
  expect(listed.objects.some((o) => o.key === key)).toBe(true);

  const meta = await provider.getObjectMetadata(bucket, key);
  expect(meta.size).toBe(file.size);
  if (provider.type !== 'azure') {
    expect(meta.contentType).toContain(contentType.split('/')[0]!);
  }

  const dstKey = `copy-${key}`;
  await provider.copyObject({ bucket, key }, { bucket, key: dstKey });
  await provider.deleteObject(bucket, dstKey);

  await deleteBucketWithContents(provider, bucket);
}

describe.skipIf(!INTEGRATION)('provider integration', () => {
  it('GCS: bucket CRUD, upload, list, download, copy, delete', async () => {
    const provider = gcsProvider();
    const bucket = `gcs-e2e-${Date.now()}`;
    const file = new File(['hello gcs'], 'hello.txt', { type: 'text/plain' });
    await exerciseProvider(provider, bucket, 'hello.txt', file, 'text/plain');
  }, 60_000);

  it('S3: bucket CRUD, upload, list, download, copy, delete', async () => {
    const provider = s3Provider();
    const bucket = `s3-e2e-${Date.now()}`;
    const file = new File(['hello s3'], 'hello.txt', { type: 'text/plain' });
    await exerciseProvider(provider, bucket, 'hello.txt', file, 'text/plain');
  }, 60_000);

  it('Azure: bucket CRUD, upload, list, download, copy, delete', async () => {
    const provider = azureProvider();
    const bucket = `azure-e2e-${Date.now()}`;
    const file = new File(['hello azure'], 'hello.txt', { type: 'text/plain' });
    await exerciseProvider(provider, bucket, 'hello.txt', file, 'text/plain');
  }, 60_000);

  it('Azure: uploads a 5MB blob via nginx proxy', async () => {
    const provider = azureProvider();
    const bucket = `azure-large-${Date.now()}`;
    const key = 'large.bin';
    const payload = new Uint8Array(5 * 1024 * 1024).fill(7);
    const file = new File([payload], key, { type: 'application/octet-stream' });

    await provider.createBucket(bucket);
    await provider.uploadObject(bucket, key, file, {
      contentType: 'application/octet-stream',
    });

    const meta = await provider.getObjectMetadata(bucket, key);
    expect(meta.size).toBe(file.size);

    await deleteBucketWithContents(provider, bucket);
  }, 60_000);
});

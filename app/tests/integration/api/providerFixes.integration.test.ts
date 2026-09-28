import { afterAll, describe, expect, it } from 'vitest';
import { AzureProvider } from '@/api/AzureProvider';
import { GCSProvider } from '@/api/GCSProvider';
import { S3Provider } from '@/api/S3Provider';
import { StorageError } from '@/api/types';
import type { StorageProvider } from '@/api/StorageProvider';
import { nullLogger } from '@/api/ActivityLogger';
import { instrument } from '@/api/instrumented';
import { deleteBucketWithContents } from '@/api/providerHelpers';
import { AZURITE_ACCOUNT_KEY } from '@/lib/emulatorEndpoints';
import { transferObjects } from '@/lib/transferService';

const INTEGRATION = process.env.STORAGEPILOT_INTEGRATION === '1';
const BASE = process.env.STORAGEPILOT_URL ?? 'http://localhost:3000';

const gcs = () => new GCSProvider({ type: 'gcs', gcsUrl: `${BASE}/api/gcs` });
const azure = () =>
  new AzureProvider({
    type: 'azure',
    azureHost: `${BASE}/api/azure/devstoreaccount1`,
    azureAccountName: 'devstoreaccount1',
    azureAccountKey: AZURITE_ACCOUNT_KEY,
  });

const s3 = () =>
  new S3Provider({
    type: 's3',
    s3Endpoint: process.env.STORAGEPILOT_S3_URL ?? 'http://localhost:9000',
    s3AccessKey: 'storagepilot',
    s3SecretKey: 'storagepilot',
  });

const uniqueBucket = (tag: string) =>
  `sp-test-${tag}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

// Only meaningful against an image that includes the nginx public-read fix.
const EXPECT_PUBLIC_PATH = process.env.STORAGEPILOT_EXPECT_PUBLIC_PATH === '1';

const created: Array<{ provider: StorageProvider; bucket: string }> = [];
async function makeBucket(provider: StorageProvider, tag: string) {
  const bucket = uniqueBucket(tag);
  await provider.createBucket(bucket, { enableVersioning: true });
  created.push({ provider, bucket });
  return bucket;
}

/** fake-gcs's filesystem backend cannot version; returns false when unsupported. */
async function tryEnableVersioning(provider: StorageProvider, bucket: string) {
  try {
    await provider.setBucketVersioning(bucket, true);
    return true;
  } catch {
    return false;
  }
}

const text = (name: string, body: string, type = 'text/plain') => new File([body], name, { type });

afterAll(async () => {
  for (const { provider, bucket } of created) {
    await deleteBucketWithContents(provider, bucket).catch(() => undefined);
  }
});

describe.skipIf(!INTEGRATION)('GCS provider fixes', () => {
  it('parallel uploads and reads through the instrumented proxy all run', async () => {
    const provider = instrument(gcs(), nullLogger);
    const bucket = await makeBucket(provider, 'par');
    const keys = ['a.txt', 'b.txt', 'c.txt', 'dir/d.txt'];
    await Promise.all(keys.map((k) => provider.uploadObject(bucket, k, text(k, `body-${k}`))));
    const listed = await provider.listObjects(bucket, {});
    expect(listed.objects.map((o) => o.key).sort()).toEqual([...keys].sort());
    const blobs = await Promise.all(keys.map((k) => provider.getObject(bucket, k)));
    expect(await Promise.all(blobs.map((b) => b.text()))).toEqual(keys.map((k) => `body-${k}`));
  });

  it('creates the bucket even when versioning is requested but unsupported', async () => {
    const provider = gcs();
    const bucket = await makeBucket(provider, 'ver');
    expect((await provider.listBuckets()).map((b) => b.name)).toContain(bucket);
    if (await tryEnableVersioning(provider, bucket)) {
      const res = await fetch(`${BASE}/api/gcs/storage/v1/b/${bucket}`);
      const data = (await res.json()) as { versioning?: { enabled?: boolean } };
      expect(data.versioning?.enabled).toBe(true);
    }
  });

  it('updateMetadata adds, changes and removes keys', async () => {
    const provider = gcs();
    const bucket = await makeBucket(provider, 'meta');
    await provider.uploadObject(bucket, 'm.txt', text('m.txt', 'x'), {
      customMetadata: { keep: '1', drop: '2' },
    });
    await provider.updateMetadata(bucket, 'm.txt', { keep: 'changed', added: 'yes' });
    const meta = await provider.getObjectMetadata(bucket, 'm.txt');
    expect(meta.customMetadata).toEqual({ keep: 'changed', added: 'yes' });
    expect(meta.contentType).toContain('text/plain');
  });

  it('versions: list, restore and delete an old generation', async (ctx) => {
    const provider = gcs();
    const bucket = await makeBucket(provider, 'gen');
    if (!(await tryEnableVersioning(provider, bucket))) ctx.skip();
    await provider.uploadObject(bucket, 'v.txt', text('v.txt', 'one'));
    await provider.uploadObject(bucket, 'v.txt', text('v.txt', 'two'));
    const versions = await provider.listVersions(bucket, 'v.txt');
    expect(versions.length).toBeGreaterThanOrEqual(2);
    expect(versions.filter((v) => v.isLatest)).toHaveLength(1);
    const old = versions.find((v) => !v.isLatest)!;
    await provider.restoreVersion(bucket, 'v.txt', old.versionId);
    expect(await (await provider.getObject(bucket, 'v.txt')).text()).toBe('one');
    await provider.deleteVersion(bucket, 'v.txt', old.versionId);
    const after = await provider.listVersions(bucket, 'v.txt');
    expect(after.some((v) => v.versionId === old.versionId)).toBe(false);
    expect(await (await provider.getObject(bucket, 'v.txt')).text()).toBe('one');
  });

  it('move removes the source and keeps content', async () => {
    const provider = gcs();
    const bucket = await makeBucket(provider, 'mv');
    await provider.uploadObject(bucket, 'src/f.txt', text('f.txt', 'moved'));
    await provider.moveObject({ bucket, key: 'src/f.txt' }, { bucket, key: 'dst/f.txt' });
    const keys = (await provider.listObjects(bucket, {})).objects.map((o) => o.key);
    expect(keys).toEqual(['dst/f.txt']);
  });

  it('paginates listObjects without skipping or repeating keys', async () => {
    const provider = gcs();
    const bucket = await makeBucket(provider, 'page');
    const keys = Array.from({ length: 7 }, (_, i) => `k${i}.txt`);
    await Promise.all(keys.map((k) => provider.uploadObject(bucket, k, text(k, k))));
    const seen: string[] = [];
    let token: string | undefined;
    do {
      const page = await provider.listObjects(bucket, { maxResults: 3, pageToken: token });
      seen.push(...page.objects.map((o) => o.key));
      token = page.nextPageToken;
    } while (token);
    expect(seen.sort()).toEqual(keys.sort());
  });

  it('bucket stats count objects and sizes', async () => {
    const provider = gcs();
    const bucket = await makeBucket(provider, 'stats');
    await provider.uploadObject(bucket, 'a.json', text('a.json', '{"a":1}', 'application/json'));
    await provider.uploadObject(bucket, 'b.txt', text('b.txt', 'hello'));
    const stats = await provider.getBucketStats(bucket);
    expect(stats.objectCount).toBe(2);
    expect(stats.totalSize).toBe(7 + 5);
    expect(stats.largestObjects[0]?.key).toBe('a.json');
  });

  it('keys with spaces, unicode and special characters round-trip', async () => {
    const provider = gcs();
    const bucket = await makeBucket(provider, 'keys');
    const key = 'folder with space/ünïcødé #1 %20 & +.txt';
    await provider.uploadObject(bucket, key, text('x.txt', 'weird'));
    expect(await (await provider.getObject(bucket, key)).text()).toBe('weird');
    const listed = await provider.listObjects(bucket, { prefix: 'folder with space/', delimiter: '/' });
    expect(listed.objects.map((o) => o.key)).toEqual([key]);
    await provider.copyObject({ bucket, key }, { bucket, key: `${key}.copy` });
    expect(await (await provider.getObject(bucket, `${key}.copy`)).text()).toBe('weird');
  });

  it.skipIf(!EXPECT_PUBLIC_PATH)('path-style public read URL serves the object', async () => {
    const provider = gcs();
    const bucket = await makeBucket(provider, 'pub');
    await provider.uploadObject(bucket, 'p/img.txt', text('img.txt', 'public'));
    const res = await fetch(`${BASE}/api/gcs/${bucket}/p/img.txt`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('public');
  });
});

describe.skipIf(!INTEGRATION)('Azure provider fixes', () => {
  it('lists containers by name only', async () => {
    const provider = azure();
    const bucket = await makeBucket(provider, 'az');
    const names = (await provider.listBuckets()).map((b) => b.name);
    expect(names).toContain(bucket);
    expect(new Set(names).size).toBe(names.length);
  });

  it('stores the real content type on upload', async () => {
    const provider = azure();
    const bucket = await makeBucket(provider, 'azct');
    await provider.uploadObject(bucket, 'pic.png', new File([new Uint8Array([137, 80, 78, 71])], 'pic.png', { type: 'image/png' }), {
      contentType: 'image/png',
    });
    const meta = await provider.getObjectMetadata(bucket, 'pic.png');
    expect(meta.contentType).toBe('image/png');
    const listed = await provider.listObjects(bucket, {});
    expect(listed.objects[0]?.contentType).toBe('image/png');
  });

  it('updateMetadata replaces custom metadata', async () => {
    const provider = azure();
    const bucket = await makeBucket(provider, 'azmeta');
    await provider.uploadObject(bucket, 'm.txt', text('m.txt', 'x'), { customMetadata: { drop: '1' } });
    await provider.updateMetadata(bucket, 'm.txt', { keep: 'yes' });
    const meta = await provider.getObjectMetadata(bucket, 'm.txt');
    expect(meta.customMetadata).toEqual({ keep: 'yes' });
  });

  it('copy and move keep content and remove the move source', async () => {
    const provider = azure();
    const bucket = await makeBucket(provider, 'azmv');
    await provider.uploadObject(bucket, 'a/f.txt', text('f.txt', 'azure-body'));
    await provider.copyObject({ bucket, key: 'a/f.txt' }, { bucket, key: 'b/f.txt' });
    await provider.moveObject({ bucket, key: 'a/f.txt' }, { bucket, key: 'c/f.txt' });
    const keys = (await provider.listObjects(bucket, {})).objects.map((o) => o.key).sort();
    expect(keys).toEqual(['b/f.txt', 'c/f.txt']);
    expect(await (await provider.getObject(bucket, 'c/f.txt')).text()).toBe('azure-body');
  });

  it('cross-provider transfer keeps content, type and metadata', async () => {
    const src = gcs();
    const dst = azure();
    const srcBucket = await makeBucket(src, 'xs');
    const dstBucket = await makeBucket(dst, 'xd');
    await src.uploadObject(srcBucket, 'doc.json', text('doc.json', '{"x":1}', 'application/json'), {
      customMetadata: { owner: 'test' },
    });
    const result = await transferObjects(src, dst, [
      { src: { bucket: srcBucket, key: 'doc.json' }, dst: { bucket: dstBucket, key: 'doc.json' } },
    ]);
    expect(result.failed).toBe(0);
    const meta = await dst.getObjectMetadata(dstBucket, 'doc.json');
    expect(meta.contentType).toBe('application/json');
    expect(meta.customMetadata).toEqual({ owner: 'test' });
    expect(await (await dst.getObject(dstBucket, 'doc.json')).text()).toBe('{"x":1}');
  });

  it('paginates with markers', async () => {
    const provider = azure();
    const bucket = await makeBucket(provider, 'azpg');
    const keys = Array.from({ length: 5 }, (_, i) => `k${i}.txt`);
    await Promise.all(keys.map((k) => provider.uploadObject(bucket, k, text(k, k))));
    const seen: string[] = [];
    let token: string | undefined;
    do {
      const page = await provider.listObjects(bucket, { maxResults: 2, pageToken: token });
      seen.push(...page.objects.map((o) => o.key));
      token = page.nextPageToken;
    } while (token);
    expect(seen.sort()).toEqual(keys.sort());
  });
});

describe.skipIf(!INTEGRATION)('S3 provider fixes', () => {
  it('maps a missing object to NOT_FOUND', async () => {
    const provider = s3();
    const bucket = await makeBucket(provider, 's3nf');
    const err = await provider.getObjectMetadata(bucket, 'nope.txt').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(StorageError);
    expect((err as StorageError).code).toBe('NOT_FOUND');
  });

  it('updateMetadata replaces metadata and keeps the content type', async () => {
    const provider = s3();
    const bucket = await makeBucket(provider, 's3meta');
    await provider.uploadObject(bucket, 'm.json', text('m.json', '{}', 'application/json'), {
      contentType: 'application/json',
      customMetadata: { drop: '1' },
    });
    await provider.updateMetadata(bucket, 'm.json', { keep: 'yes' });
    const meta = await provider.getObjectMetadata(bucket, 'm.json');
    expect(meta.customMetadata).toEqual({ keep: 'yes' });
    expect(meta.contentType).toBe('application/json');
    expect(await (await provider.getObject(bucket, 'm.json')).text()).toBe('{}');
  });

  it('versioning: enable, list, restore and delete an old version', async () => {
    const provider = s3();
    const bucket = await makeBucket(provider, 's3ver');
    await provider.setBucketVersioning(bucket, true);
    await provider.uploadObject(bucket, 'v.txt', text('v.txt', 'one'));
    await provider.uploadObject(bucket, 'v.txt', text('v.txt', 'two'));
    const versions = await provider.listVersions(bucket, 'v.txt');
    expect(versions).toHaveLength(2);
    const old = versions.find((v) => !v.isLatest)!;
    await provider.restoreVersion(bucket, 'v.txt', old.versionId);
    expect(await (await provider.getObject(bucket, 'v.txt')).text()).toBe('one');
    await provider.deleteVersion(bucket, 'v.txt', old.versionId);
    const after = await provider.listVersions(bucket, 'v.txt');
    expect(after.some((v) => v.versionId === old.versionId)).toBe(false);

    // Deleting a versioned bucket must also clear old versions and delete markers.
    await deleteBucketWithContents(provider, bucket);
    expect((await provider.listBuckets()).map((b) => b.name)).not.toContain(bucket);
  });

  it('parallel uploads through the instrumented proxy all land', async () => {
    const provider = instrument(s3(), nullLogger);
    const bucket = await makeBucket(provider, 's3par');
    const keys = ['a.txt', 'b.txt', 'c.txt'];
    await Promise.all(keys.map((k) => provider.uploadObject(bucket, k, text(k, k))));
    const listed = await provider.listObjects(bucket, {});
    expect(listed.objects.map((o) => o.key).sort()).toEqual(keys);
  });
});

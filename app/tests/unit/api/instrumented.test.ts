import { describe, expect, it, vi } from 'vitest';
import { instrument } from '@/api/instrumented';
import { nullLogger } from '@/api/ActivityLogger';
import type { StorageProvider } from '@/api/StorageProvider';

function mockProvider(): StorageProvider {
  return {
    type: 's3',
    displayName: 'Test',
    baseUrl: 'http://localhost:9000',
    testConnection: vi.fn(async () => true),
    listBuckets: vi.fn(async () => []),
    createBucket: vi.fn(async () => ({ name: 'b', provider: 's3' as const })),
    deleteBucket: vi.fn(async () => undefined),
    getBucketStats: vi.fn(async () => ({
      objectCount: 0,
      totalSize: 0,
      contentTypeBreakdown: {},
      largestObjects: [],
    })),
    setCorsRules: vi.fn(async () => undefined),
    getCorsRules: vi.fn(async () => []),
    setBucketVersioning: vi.fn(async () => undefined),
    listObjects: vi.fn(async () => ({ objects: [], prefixes: [] })),
    getObject: vi.fn(async () => new Blob()),
    getObjectMetadata: vi.fn(async () => ({
      key: 'k',
      bucket: 'b',
      size: 0,
      contentType: 'text/plain',
      lastModified: new Date(),
      etag: '',
      customMetadata: {},
      provider: 's3' as const,
    })),
    uploadObject: vi.fn(async () => undefined),
    deleteObject: vi.fn(async () => undefined),
    copyObject: vi.fn(async () => undefined),
    moveObject: vi.fn(async () => undefined),
    updateMetadata: vi.fn(async () => undefined),
    listVersions: vi.fn(async () => []),
    restoreVersion: vi.fn(async () => undefined),
    deleteVersion: vi.fn(async () => undefined),
    getObjectUrl: vi.fn((bucket: string, key: string) => `http://localhost:9000/${bucket}/${key}`),
    getPathFormats: vi.fn((bucket: string, key: string) => ({
      native: `s3://${bucket}/${key}`,
      http: `http://localhost:9000/${bucket}/${key}`,
      sdkPath: `${bucket}/${key}`,
    })),
  };
}

describe('instrument', () => {
  it('returns sync values from getObjectUrl and getPathFormats without Promises', () => {
    const wrapped = instrument(mockProvider(), nullLogger);

    const url = wrapped.getObjectUrl('photos', 'img.png');
    expect(url).toBe('http://localhost:9000/photos/img.png');
    expect(url).not.toBeInstanceOf(Promise);

    const paths = wrapped.getPathFormats('photos', 'img.png');
    expect(paths.http).toBe('http://localhost:9000/photos/img.png');
    expect(paths).not.toBeInstanceOf(Promise);
  });

  it('still wraps async API methods', async () => {
    const wrapped = instrument(mockProvider(), nullLogger);
    const result = wrapped.listBuckets();
    expect(result).toBeInstanceOf(Promise);
    await result;
  });
});

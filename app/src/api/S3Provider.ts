import {
  CopyObjectCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetBucketCorsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  ListObjectVersionsCommand,
  ListObjectsV2Command,
  PutBucketCorsCommand,
  PutBucketVersioningCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { computeBucketStats } from '../lib/bucketStats';
import { prepareBucketName } from '../lib/bucketName';
import { buildPathFormats } from '../lib/pathFormatters';
import { assertUploadBlob, toUploadBytes } from '../lib/uploadBody';
import { s3CopySource } from '../lib/s3CopySource';
import { encodeObjectKey } from '../lib/objectKey';
import { DEFAULT_CORS_MAX_AGE, moveViaCopy, testConnectionViaBuckets } from './providerHelpers';
import { resolveApiUrl } from '../lib/resolveApiUrl';
import { normalizeS3Endpoint } from '../lib/emulatorEndpoints';
import type { StorageProvider } from './StorageProvider';
import type {
  Bucket,
  BucketStats,
  CorsRule,
  CreateBucketOpts,
  ListOpts,
  ListResult,
  ObjectMetadata,
  ObjectRef,
  ObjectVersion,
  PathFormats,
  UploadOpts,
} from './types';
import { StorageError } from './types';

export interface S3Config {
  type: 's3';
  s3Endpoint?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;
  s3Region?: string;
}


export class S3Provider implements StorageProvider {
  readonly type = 's3' as const;
  readonly displayName = 'Amazon S3';
  readonly baseUrl: string;
  private client: S3Client;

  constructor(config: S3Config) {
    this.baseUrl = resolveApiUrl(normalizeS3Endpoint(config.s3Endpoint));
    this.client = new S3Client({
      endpoint: this.baseUrl,
      region: config.s3Region ?? 'us-east-1',
      credentials: {
        accessKeyId: config.s3AccessKey ?? 'storagepilot',
        secretAccessKey: config.s3SecretKey ?? 'storagepilot',
      },
      forcePathStyle: true,
    });
  }

  private wrapError(err: unknown, method: string): never {
    if (err instanceof StorageError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { $metadata?: { httpStatusCode?: number } } | null)?.$metadata
      ?.httpStatusCode;
    if (status === 404) throw new StorageError('NOT_FOUND', `${method}: ${message}`, 's3', err);
    if (status === 401 || status === 403) {
      throw new StorageError('FORBIDDEN', `${method}: ${message}`, 's3', err);
    }
    if (status === 409 || status === 412) {
      throw new StorageError('CONFLICT', `${method}: ${message}`, 's3', err);
    }
    if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
      throw new StorageError('CONNECTION_FAILED', message, 's3', err);
    }
    if (message.includes('not valid') || message.includes('InvalidBucketName')) {
      throw new StorageError(
        'UNKNOWN',
        'Invalid bucket name for S3/MinIO: use 3–63 lowercase characters (letters, numbers, dashes, dots). No underscores.',
        's3',
        err,
      );
    }
    throw new StorageError('UNKNOWN', `${method}: ${message}`, 's3', err);
  }

  async testConnection(): Promise<boolean> {
    return testConnectionViaBuckets(this);
  }

  async listBuckets(): Promise<Bucket[]> {
    try {
      const res = await this.client.send(new ListBucketsCommand({}));
      return (res.Buckets ?? [])
        .filter((b): b is typeof b & { Name: string } => Boolean(b.Name))
        .map((b) => ({
          name: b.Name,
          createdAt: b.CreationDate,
          provider: 's3' as const,
        }));
    } catch (err) {
      this.wrapError(err, 'listBuckets');
    }
  }

  async createBucket(name: string, _opts?: CreateBucketOpts): Promise<Bucket> {
    const bucket = prepareBucketName(name, 's3');
    try {
      await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
    } catch (err) {
      this.wrapError(err, 'createBucket');
    }
    return { name: bucket, provider: 's3' };
  }

  async deleteBucket(name: string): Promise<void> {
    try {
      // A versioned bucket still holds old versions and delete markers after its
      // objects are deleted, and S3 refuses to delete it until those are gone too.
      await this.purgeVersions(name);
      await this.client.send(new DeleteBucketCommand({ Bucket: name }));
    } catch (err) {
      this.wrapError(err, 'deleteBucket');
    }
  }

  private async purgeVersions(bucket: string): Promise<void> {
    let keyMarker: string | undefined;
    let versionIdMarker: string | undefined;
    do {
      const page = await this.client.send(
        new ListObjectVersionsCommand({
          Bucket: bucket,
          KeyMarker: keyMarker,
          VersionIdMarker: versionIdMarker,
        }),
      );
      for (const entry of [...(page.Versions ?? []), ...(page.DeleteMarkers ?? [])]) {
        if (!entry.Key) continue;
        await this.client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: entry.Key, VersionId: entry.VersionId }),
        );
      }
      keyMarker = page.IsTruncated ? page.NextKeyMarker : undefined;
      versionIdMarker = page.IsTruncated ? page.NextVersionIdMarker : undefined;
    } while (keyMarker);
  }

  async getBucketStats(name: string): Promise<BucketStats> {
    return computeBucketStats(this, name);
  }

  async setCorsRules(bucket: string, rules: CorsRule[]): Promise<void> {
    try {
      await this.client.send(
        new PutBucketCorsCommand({
          Bucket: bucket,
          CORSConfiguration: {
            CORSRules: rules.map((r) => ({
              AllowedOrigins: r.origins,
              AllowedMethods: r.methods,
              AllowedHeaders: r.headers,
              MaxAgeSeconds: r.maxAgeSeconds,
            })),
          },
        }),
      );
    } catch (err) {
      this.wrapError(err, 'setCorsRules');
    }
  }

  async getCorsRules(bucket: string): Promise<CorsRule[]> {
    try {
      const res = await this.client.send(new GetBucketCorsCommand({ Bucket: bucket }));
      return (res.CORSRules ?? []).map((r) => ({
        origins: r.AllowedOrigins ?? [],
        methods: r.AllowedMethods ?? [],
        headers: r.AllowedHeaders ?? [],
        maxAgeSeconds: r.MaxAgeSeconds ?? DEFAULT_CORS_MAX_AGE,
      }));
    } catch (err) {
      // S3/MinIO returns NoSuchCORSConfiguration (404) when no rules are set —
      // that's a valid empty state.  Any other error should propagate.
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NoSuchCORSConfiguration') || msg.includes('The CORS configuration does not exist')) {
        return [];
      }
      this.wrapError(err, 'getCorsRules');
    }
  }

  async setBucketVersioning(bucket: string, enabled: boolean): Promise<void> {
    try {
      await this.client.send(
        new PutBucketVersioningCommand({
          Bucket: bucket,
          VersioningConfiguration: { Status: enabled ? 'Enabled' : 'Suspended' },
        }),
      );
    } catch (err) {
      this.wrapError(err, 'setBucketVersioning');
    }
  }

  async listObjects(bucket: string, opts: ListOpts = {}): Promise<ListResult> {
    try {
      const res = await this.client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: opts.prefix,
          Delimiter: opts.delimiter,
          MaxKeys: opts.maxResults,
          ContinuationToken: opts.pageToken,
        }),
      );

      const objects = (res.Contents ?? [])
        .filter((item): item is typeof item & { Key: string } => Boolean(item.Key))
        .map((item) => ({
          key: item.Key,
          size: item.Size ?? 0,
          contentType: 'application/octet-stream',
          lastModified: item.LastModified ?? new Date(),
          etag: item.ETag?.replace(/"/g, ''),
          isFolder: item.Key.endsWith('/'),
        }));

      const prefixes = (res.CommonPrefixes ?? [])
        .filter((p): p is typeof p & { Prefix: string } => Boolean(p.Prefix))
        .map((p) => p.Prefix);

      return {
        objects,
        prefixes,
        nextPageToken: res.NextContinuationToken,
      };
    } catch (err) {
      this.wrapError(err, 'listObjects');
    }
  }

  async getObject(bucket: string, key: string): Promise<Blob> {
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      if (!res.Body) throw new StorageError('NOT_FOUND', 'Empty response body', 's3');
      const bytes = await res.Body.transformToByteArray();
      return new Blob([bytes], { type: res.ContentType ?? 'application/octet-stream' });
    } catch (err) {
      this.wrapError(err, 'getObject');
    }
  }

  async getObjectMetadata(bucket: string, key: string): Promise<ObjectMetadata> {
    try {
      const res = await this.client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return {
        key,
        bucket,
        size: res.ContentLength ?? 0,
        contentType: res.ContentType ?? 'application/octet-stream',
        lastModified: res.LastModified ?? new Date(),
        etag: res.ETag?.replace(/"/g, '') ?? '',
        customMetadata: res.Metadata ?? {},
        provider: 's3',
      };
    } catch (err) {
      this.wrapError(err, 'getObjectMetadata');
    }
  }

  async uploadObject(
    bucket: string,
    key: string,
    file: File,
    opts?: UploadOpts,
  ): Promise<void> {
    assertUploadBlob(file);
    try {
      const body = await toUploadBytes(file);
      await this.client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentLength: body.byteLength,
          ContentType: opts?.contentType ?? (file.type || 'application/octet-stream'),
          Metadata: opts?.customMetadata,
        }),
      );
      opts?.onProgress?.(100, file.size);
    } catch (err) {
      this.wrapError(err, 'uploadObject');
    }
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch (err) {
      this.wrapError(err, 'deleteObject');
    }
  }

  async copyObject(src: ObjectRef, dst: ObjectRef): Promise<void> {
    try {
      await this.client.send(
        new CopyObjectCommand({
          Bucket: dst.bucket,
          Key: dst.key,
          CopySource: s3CopySource(src.bucket, src.key),
        }),
      );
    } catch (err) {
      this.wrapError(err, 'copyObject');
    }
  }

  async moveObject(src: ObjectRef, dst: ObjectRef): Promise<void> {
    return moveViaCopy(this, src, dst);
  }

  async updateMetadata(
    bucket: string,
    key: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    // Copy onto itself with REPLACE: rewrites metadata server-side and keeps the content type.
    const current = await this.getObjectMetadata(bucket, key);
    try {
      await this.client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          Key: key,
          CopySource: s3CopySource(bucket, key),
          MetadataDirective: 'REPLACE',
          ContentType: current.contentType,
          Metadata: metadata,
        }),
      );
    } catch (err) {
      this.wrapError(err, 'updateMetadata');
    }
  }

  async listVersions(bucket: string, key: string): Promise<ObjectVersion[]> {
    try {
      const res = await this.client.send(
        new ListObjectVersionsCommand({ Bucket: bucket, Prefix: key }),
      );
      return (res.Versions ?? [])
        .filter((v) => v.Key === key)
        .map((v) => ({
          versionId: v.VersionId ?? '',
          size: v.Size ?? 0,
          lastModified: v.LastModified ?? new Date(),
          isLatest: v.IsLatest ?? false,
          etag: v.ETag?.replace(/"/g, '') ?? '',
        }));
    } catch (err) {
      this.wrapError(err, 'listVersions');
    }
  }

  async restoreVersion(bucket: string, key: string, versionId: string): Promise<void> {
    try {
      await this.client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          Key: key,
          CopySource: s3CopySource(bucket, key, versionId),
        }),
      );
    } catch (err) {
      this.wrapError(err, 'restoreVersion');
    }
  }

  async deleteVersion(bucket: string, key: string, versionId: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: key, VersionId: versionId }),
      );
    } catch (err) {
      this.wrapError(err, 'deleteVersion');
    }
  }

  getObjectUrl(bucket: string, key: string): string {
    return `${this.baseUrl}/${bucket}/${encodeObjectKey(key)}`;
  }

  getPathFormats(bucket: string, key: string): PathFormats {
    return buildPathFormats('s3', bucket, key, this.baseUrl);
  }
}

import { computeBucketStats } from '../lib/bucketStats';
import { prepareBucketName } from '../lib/bucketName';
import { buildPathFormats } from '../lib/pathFormatters';
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
import { fetchWithError, notImplemented, StorageError } from './types';

export interface GCSConfig {
  type: 'gcs';
  gcsUrl?: string;
  gcsScheme?: 'http' | 'https';
}

interface GCSBucketItem {
  name: string;
  timeCreated?: string;
}

interface GCSObjectItem {
  name: string;
  size?: string;
  contentType?: string;
  updated?: string;
  etag?: string;
  generation?: string;
  timeDeleted?: string;
}

interface GCSListObjectsResponse {
  items?: GCSObjectItem[];
  prefixes?: string[];
  nextPageToken?: string;
}

const DEFAULT_BASE = import.meta.env.VITE_GCS_BASE ?? '/api/gcs';

export class GCSProvider implements StorageProvider {
  readonly type = 'gcs' as const;
  readonly displayName = 'Google Cloud Storage';
  readonly baseUrl: string;

  constructor(config: GCSConfig) {
    this.baseUrl = config.gcsUrl ?? DEFAULT_BASE;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.listBuckets();
      return true;
    } catch {
      return false;
    }
  }

  async listBuckets(): Promise<Bucket[]> {
    const res = await fetchWithError(`${this.baseUrl}/storage/v1/b`, this.type);
    const data = (await res.json()) as { items?: GCSBucketItem[] };
    return (data.items ?? []).map((b) => ({
      name: b.name,
      createdAt: b.timeCreated ? new Date(b.timeCreated) : undefined,
      provider: 'gcs' as const,
    }));
  }

  async createBucket(name: string, _opts?: CreateBucketOpts): Promise<Bucket> {
    const bucket = prepareBucketName(name, 'gcs');
    await fetchWithError(`${this.baseUrl}/storage/v1/b`, this.type, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: bucket }),
    });
    return { name: bucket, provider: 'gcs' };
  }

  async deleteBucket(name: string): Promise<void> {
    await fetchWithError(`${this.baseUrl}/storage/v1/b/${encodeURIComponent(name)}`, this.type, {
      method: 'DELETE',
    });
  }

  async getBucketStats(name: string): Promise<BucketStats> {
    return computeBucketStats(this, name);
  }

  async setCorsRules(bucket: string, rules: CorsRule[]): Promise<void> {
    await fetchWithError(
      `${this.baseUrl}/storage/v1/b/${encodeURIComponent(bucket)}`,
      this.type,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cors: rules.map((r) => ({
            origin: r.origins,
            method: r.methods,
            responseHeader: r.headers,
            maxAgeSeconds: r.maxAgeSeconds,
          })),
        }),
      },
    );
  }

  async getCorsRules(bucket: string): Promise<CorsRule[]> {
    const res = await fetchWithError(
      `${this.baseUrl}/storage/v1/b/${encodeURIComponent(bucket)}?projection=full`,
      this.type,
    );
    const data = (await res.json()) as {
      cors?: Array<{
        origin?: string[];
        method?: string[];
        responseHeader?: string[];
        maxAgeSeconds?: number;
      }>;
    };
    return (data.cors ?? []).map((r) => ({
      origins: r.origin ?? [],
      methods: r.method ?? [],
      headers: r.responseHeader ?? [],
      maxAgeSeconds: r.maxAgeSeconds ?? 3600,
    }));
  }

  async setBucketVersioning(_bucket: string, _enabled: boolean): Promise<void> {
    return notImplemented('gcs', 'setBucketVersioning');
  }

  async listObjects(bucket: string, opts: ListOpts = {}): Promise<ListResult> {
    const params = new URLSearchParams();
    if (opts.prefix) params.set('prefix', opts.prefix);
    if (opts.delimiter) params.set('delimiter', opts.delimiter);
    if (opts.maxResults) params.set('maxResults', String(opts.maxResults));
    if (opts.pageToken) params.set('pageToken', opts.pageToken);

    const qs = params.toString();
    const url = `${this.baseUrl}/storage/v1/b/${encodeURIComponent(bucket)}/o${qs ? `?${qs}` : ''}`;
    const res = await fetchWithError(url, this.type);
    const data = (await res.json()) as GCSListObjectsResponse;

    const objects = (data.items ?? []).map((item) => ({
      key: item.name,
      size: Number(item.size ?? 0),
      contentType: item.contentType ?? 'application/octet-stream',
      lastModified: item.updated ? new Date(item.updated) : new Date(),
      etag: item.etag,
      isFolder: item.name.endsWith('/'),
    }));

    return {
      objects,
      prefixes: data.prefixes ?? [],
      nextPageToken: data.nextPageToken,
    };
  }

  async getObject(bucket: string, key: string): Promise<Blob> {
    const url = `${this.baseUrl}/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(key)}?alt=media`;
    const res = await fetchWithError(url, this.type);
    return res.blob();
  }

  async getObjectMetadata(bucket: string, key: string): Promise<ObjectMetadata> {
    const url = `${this.baseUrl}/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(key)}`;
    const res = await fetchWithError(url, this.type);
    const data = (await res.json()) as GCSObjectItem & { metadata?: Record<string, string> };
    return {
      key,
      bucket,
      size: Number(data.size ?? 0),
      contentType: data.contentType ?? 'application/octet-stream',
      lastModified: data.updated ? new Date(data.updated) : new Date(),
      etag: data.etag ?? '',
      customMetadata: data.metadata ?? {},
      provider: 'gcs',
    };
  }

  async uploadObject(
    bucket: string,
    key: string,
    file: File,
    opts?: UploadOpts,
  ): Promise<void> {
    const hasMetadata = opts?.customMetadata && Object.keys(opts.customMetadata).length > 0;

    if (hasMetadata) {
      // Multipart upload to attach metadata alongside the object content.
      const metadata = JSON.stringify({
        name: key,
        contentType: opts?.contentType ?? (file.type || 'application/octet-stream'),
        metadata: opts!.customMetadata,
      });
      const boundary = `sp_boundary_${crypto.randomUUID().replace(/-/g, '')}`;
      const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`;
      const dataPart = `--${boundary}\r\nContent-Type: ${opts?.contentType ?? (file.type || 'application/octet-stream')}\r\n\r\n`;
      const close = `\r\n--${boundary}--`;
      const body = new Blob([metaPart, dataPart, file, close]);
      const params = new URLSearchParams({ uploadType: 'multipart', name: key });
      const url = `${this.baseUrl}/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?${params}`;
      await fetchWithError(url, this.type, {
        method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body,
      });
    } else {
      const params = new URLSearchParams({ uploadType: 'media', name: key });
      const url = `${this.baseUrl}/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?${params}`;
      await fetchWithError(url, this.type, {
        method: 'POST',
        headers: { 'Content-Type': opts?.contentType ?? (file.type || 'application/octet-stream') },
        body: file,
      });
    }
    opts?.onProgress?.(100, file.size);
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    const url = `${this.baseUrl}/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(key)}`;
    await fetchWithError(url, this.type, { method: 'DELETE' });
  }

  async copyObject(src: ObjectRef, dst: ObjectRef): Promise<void> {
    const url = `${this.baseUrl}/storage/v1/b/${encodeURIComponent(src.bucket)}/o/${encodeURIComponent(src.key)}/copyTo/b/${encodeURIComponent(dst.bucket)}/o/${encodeURIComponent(dst.key)}`;
    await fetchWithError(url, this.type, { method: 'POST' });
  }

  async moveObject(src: ObjectRef, dst: ObjectRef): Promise<void> {
    await this.copyObject(src, dst);
    await this.deleteObject(src.bucket, src.key);
  }

  async updateMetadata(
    bucket: string,
    key: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    await fetchWithError(
      `${this.baseUrl}/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(key)}`,
      this.type,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata }),
      },
    );
  }

  async listVersions(bucket: string, key: string): Promise<ObjectVersion[]> {
    const items = await this.fetchObjectGenerations(bucket, key);
    if (!items.length) {
      try {
        const current = await this.fetchObjectResource(bucket, key);
        return [this.toObjectVersion(current, true)];
      } catch (err) {
        // Return empty only for confirmed "not found"; rethrow auth/network errors.
        if (err instanceof StorageError && (err as StorageError).code === 'NOT_FOUND') return [];
        throw err;
      }
    }

    const live = items.filter((item) => !item.timeDeleted);
    const latestGeneration = live.reduce(
      (max, item) => Math.max(max, Number(item.generation ?? 0)),
      0,
    );

    return items
      .map((item) =>
        this.toObjectVersion(
          item,
          !item.timeDeleted && Number(item.generation ?? 0) === latestGeneration,
        ),
      )
      .sort((a, b) => Number(b.versionId) - Number(a.versionId));
  }

  async restoreVersion(bucket: string, key: string, versionId: string): Promise<void> {
    const url = `${this.baseUrl}/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(key)}/copyTo/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(key)}?sourceGeneration=${encodeURIComponent(versionId)}`;
    await fetchWithError(url, this.type, { method: 'POST' });
  }

  async deleteVersion(bucket: string, key: string, versionId: string): Promise<void> {
    const url = `${this.baseUrl}/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(key)}?generation=${encodeURIComponent(versionId)}`;
    await fetchWithError(url, this.type, { method: 'DELETE' });
  }

  private async fetchObjectResource(bucket: string, key: string): Promise<GCSObjectItem> {
    const url = `${this.baseUrl}/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(key)}`;
    const res = await fetchWithError(url, this.type);
    return (await res.json()) as GCSObjectItem;
  }

  private async fetchObjectGenerations(bucket: string, key: string): Promise<GCSObjectItem[]> {
    const items: GCSObjectItem[] = [];
    let pageToken: string | undefined;

    do {
      const params = new URLSearchParams({
        versions: 'true',
        prefix: key,
      });
      if (pageToken) params.set('pageToken', pageToken);

      const url = `${this.baseUrl}/storage/v1/b/${encodeURIComponent(bucket)}/o?${params}`;
      const res = await fetchWithError(url, this.type);
      const data = (await res.json()) as GCSListObjectsResponse;
      items.push(...(data.items ?? []).filter((item) => item.name === key));
      pageToken = data.nextPageToken;
    } while (pageToken);

    return items;
  }

  private toObjectVersion(item: GCSObjectItem, isLatest: boolean): ObjectVersion {
    return {
      versionId: String(item.generation ?? '1'),
      size: Number(item.size ?? 0),
      lastModified: item.updated ? new Date(item.updated) : new Date(),
      isLatest,
      etag: item.etag ?? '',
    };
  }

  getObjectUrl(bucket: string, key: string): string {
    return `${this.baseUrl}/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(key)}?alt=media`;
  }

  getPathFormats(bucket: string, key: string): PathFormats {
    return buildPathFormats('gcs', bucket, key, this.baseUrl);
  }
}

import { computeBucketStats } from '../lib/bucketStats';
import { prepareBucketName } from '../lib/bucketName';
import { buildPathFormats } from '../lib/pathFormatters';
import { azureFetch } from '../lib/azureSign';
import {
  AZURITE_ACCOUNT_KEY,
  normalizeAzureServiceUrl,
} from '../lib/emulatorEndpoints';
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
import { mapHttpStatusToError, notImplemented, StorageError } from './types';

export interface AzureConfig {
  type: 'azure';
  azureHost?: string;
  azureAccountName?: string;
  azureAccountKey?: string;
}

export class AzureProvider implements StorageProvider {
  readonly type = 'azure' as const;
  readonly displayName = 'Azure Blob Storage';
  readonly baseUrl: string;
  private accountName: string;
  private accountKey: string;

  constructor(config: AzureConfig) {
    this.accountName = config.azureAccountName ?? 'devstoreaccount1';
    this.accountKey = config.azureAccountKey ?? AZURITE_ACCOUNT_KEY;
    this.baseUrl = normalizeAzureServiceUrl(config.azureHost, this.accountName);
  }

  private containerUrl(container: string): string {
    return `${this.baseUrl}/${container}`;
  }

  private async request(url: string, init?: RequestInit): Promise<Response> {
    try {
      const res = await azureFetch(url, this.accountName, this.accountKey, init);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw mapHttpStatusToError(res.status, 'azure', text || res.statusText);
      }
      return res;
    } catch (err) {
      if (err instanceof StorageError) throw err;
      throw new StorageError('CONNECTION_FAILED', 'Connection failed', 'azure', err);
    }
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
    const url = `${this.baseUrl}/?comp=list`;
    const res = await this.request(url);
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'text/xml');
    return [...doc.getElementsByTagName('Name')].map((el) => ({
      name: el.textContent!,
      provider: 'azure' as const,
    }));
  }

  async createBucket(name: string, _opts?: CreateBucketOpts): Promise<Bucket> {
    const bucket = prepareBucketName(name, 'azure');
    const url = `${this.containerUrl(bucket)}?restype=container`;
    await this.request(url, { method: 'PUT' });
    return { name: bucket, provider: 'azure' };
  }

  async deleteBucket(name: string): Promise<void> {
    const url = `${this.containerUrl(name)}?restype=container`;
    await this.request(url, { method: 'DELETE' });
  }

  async getBucketStats(name: string): Promise<BucketStats> {
    return computeBucketStats(this, name);
  }

  async setCorsRules(_bucket: string, _rules: CorsRule[]): Promise<void> {
    return notImplemented('azure', 'setCorsRules');
  }

  async getCorsRules(_bucket: string): Promise<CorsRule[]> {
    return [];
  }

  async setBucketVersioning(_bucket: string, _enabled: boolean): Promise<void> {
    return notImplemented('azure', 'setBucketVersioning');
  }

  async listObjects(container: string, opts: ListOpts = {}): Promise<ListResult> {
    const params = new URLSearchParams({
      restype: 'container',
      comp: 'list',
    });
    if (opts.prefix) params.set('prefix', opts.prefix);
    if (opts.delimiter) params.set('delimiter', opts.delimiter);
    if (opts.maxResults) params.set('maxresults', String(opts.maxResults));
    if (opts.pageToken) params.set('marker', opts.pageToken);

    const url = `${this.containerUrl(container)}?${params}`;
    const res = await this.request(url);
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'text/xml');

    const objects = [...doc.getElementsByTagName('Blob')].map((blob) => {
      const name = blob.getElementsByTagName('Name')[0]?.textContent ?? '';
      const props = blob.getElementsByTagName('Properties')[0];
      const size = Number(props?.getElementsByTagName('Content-Length')[0]?.textContent ?? 0);
      const contentType =
        props?.getElementsByTagName('Content-Type')[0]?.textContent ?? 'application/octet-stream';
      const lastModified =
        props?.getElementsByTagName('Last-Modified')[0]?.textContent ?? new Date().toISOString();
      return {
        key: name,
        size,
        contentType,
        lastModified: new Date(lastModified),
        isFolder: name.endsWith('/'),
      };
    });

    const prefixes = [...doc.getElementsByTagName('BlobPrefix')].map(
      (p) => p.getElementsByTagName('Name')[0]?.textContent ?? '',
    );

    const nextMarker = doc.getElementsByTagName('NextMarker')[0]?.textContent?.trim();

    return { objects, prefixes, nextPageToken: nextMarker || undefined };
  }

  async getObject(container: string, key: string): Promise<Blob> {
    const url = `${this.containerUrl(container)}/${key}`;
    const res = await this.request(url);
    return res.blob();
  }

  async getObjectMetadata(container: string, key: string): Promise<ObjectMetadata> {
    const url = `${this.containerUrl(container)}/${key}`;
    const res = await this.request(url, { method: 'HEAD' });
    return {
      key,
      bucket: container,
      size: Number(res.headers.get('content-length') ?? 0),
      contentType: res.headers.get('content-type') ?? 'application/octet-stream',
      lastModified: new Date(res.headers.get('last-modified') ?? Date.now()),
      etag: res.headers.get('etag') ?? '',
      customMetadata: {},
      provider: 'azure',
    };
  }

  async uploadObject(
    container: string,
    key: string,
    file: File,
    opts?: UploadOpts,
  ): Promise<void> {
    const url = `${this.containerUrl(container)}/${key}`;
    await this.request(url, {
      method: 'PUT',
      headers: {
        'Content-Type': opts?.contentType ?? (file.type || 'application/octet-stream'),
        'x-ms-blob-type': 'BlockBlob',
      },
      body: file,
    });
    opts?.onProgress?.(100, file.size);
  }

  async deleteObject(container: string, key: string): Promise<void> {
    const url = `${this.containerUrl(container)}/${key}`;
    await this.request(url, { method: 'DELETE' });
  }

  async copyObject(src: ObjectRef, dst: ObjectRef): Promise<void> {
    const sourceUrl = `${this.containerUrl(src.bucket)}/${src.key}`;
    const url = `${this.containerUrl(dst.bucket)}/${dst.key}`;
    await this.request(url, {
      method: 'PUT',
      headers: { 'x-ms-copy-source': sourceUrl },
    });
  }

  async moveObject(src: ObjectRef, dst: ObjectRef): Promise<void> {
    await this.copyObject(src, dst);
    await this.deleteObject(src.bucket, src.key);
  }

  async updateMetadata(
    _container: string,
    _key: string,
    _metadata: Record<string, string>,
  ): Promise<void> {
    return notImplemented('azure', 'updateMetadata');
  }

  async listVersions(_bucket: string, _key: string): Promise<ObjectVersion[]> {
    return notImplemented('azure', 'listVersions');
  }

  async restoreVersion(_bucket: string, _key: string, _versionId: string): Promise<void> {
    return notImplemented('azure', 'restoreVersion');
  }

  async deleteVersion(_bucket: string, _key: string, _versionId: string): Promise<void> {
    return notImplemented('azure', 'deleteVersion');
  }

  getObjectUrl(container: string, key: string): string {
    return `${this.containerUrl(container)}/${key}`;
  }

  getPathFormats(container: string, key: string): PathFormats {
    return buildPathFormats('azure', container, key, this.baseUrl);
  }
}

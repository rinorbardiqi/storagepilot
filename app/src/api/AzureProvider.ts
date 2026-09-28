import { computeBucketStats } from '../lib/bucketStats';
import { prepareBucketName } from '../lib/bucketName';
import { assertUploadBlob } from '../lib/uploadBody';
import { appendAzureQuery } from './azureQuery';
import { buildPathFormats } from '../lib/pathFormatters';
import { encodeObjectKey } from '../lib/objectKey';
import { moveViaCopy, testConnectionViaBuckets } from './providerHelpers';
import { azureFetch } from './azureSign';
import {
  AZURITE_ACCOUNT_KEY,
  getAzureDirectServiceUrl,
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

  private objectUrl(container: string, key: string): string {
    return `${this.containerUrl(container)}/${encodeObjectKey(key)}`;
  }

  /** Direct blob URL for x-ms-copy-source (Azurite must fetch without nginx/proxy auth). */
  private copySourceUrl(container: string, key: string, versionId?: string): string {
    // Only proxied endpoints need rewriting; a real account URL is already direct.
    const service = this.baseUrl.includes('/api/azure')
      ? getAzureDirectServiceUrl(this.accountName)
      : this.baseUrl;
    const base = `${service}/${container}/${encodeObjectKey(key)}`;
    return versionId ? `${base}?versionid=${encodeURIComponent(versionId)}` : base;
  }

  /** Copy Blob may complete asynchronously — wait so callers (e.g. move) never delete the source early. */
  private async waitForCopy(container: string, key: string, res: Response): Promise<void> {
    let status = res.headers.get('x-ms-copy-status');
    for (let attempt = 0; status === 'pending' && attempt < 120; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const head = await this.request(this.objectUrl(container, key), { method: 'HEAD' });
      status = head.headers.get('x-ms-copy-status');
    }
    if (status === 'pending') {
      throw new StorageError('UNKNOWN', 'Copy did not finish in time', 'azure');
    }
    if (status && status !== 'success') {
      throw new StorageError('UNKNOWN', `Copy ${status}`, 'azure');
    }
  }

  private parseBlobVersions(doc: Document, key: string): ObjectVersion[] {
    return [...doc.getElementsByTagName('Blob')]
      .map((blob) => {
        const name = blob.getElementsByTagName('Name')[0]?.textContent ?? '';
        if (name !== key) return null;

        const props = blob.getElementsByTagName('Properties')[0];
        // Only use the real VersionId element — ETag is not a version identifier
        // and using it breaks restore/delete-version calls.
        const versionId = blob.getElementsByTagName('VersionId')[0]?.textContent?.trim() ?? '';
        if (!versionId) return null;

        const isLatest =
          blob.getElementsByTagName('IsCurrentVersion')[0]?.textContent === 'true' ||
          blob.getElementsByTagName('IsLatestVersion')[0]?.textContent === 'true';

        const size = Number(props?.getElementsByTagName('Content-Length')[0]?.textContent ?? 0);
        const lastModified =
          props?.getElementsByTagName('Last-Modified')[0]?.textContent ?? new Date().toISOString();
        const etag =
          props?.getElementsByTagName('Etag')[0]?.textContent?.replace(/"/g, '') ??
          props?.getElementsByTagName('ETag')[0]?.textContent?.replace(/"/g, '') ??
          '';

        return {
          versionId,
          size,
          lastModified: new Date(lastModified),
          isLatest,
          etag,
        };
      })
      .filter((v): v is ObjectVersion => v !== null);
  }

  private async request(url: string, init?: RequestInit): Promise<Response> {
    try {
      const res = await azureFetch(url, this.accountName, this.accountKey, init);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        // Extract Azure error code from XML body when present.
        const codeMatch = text.match(/<Code>([^<]+)<\/Code>/);
        const msgMatch = text.match(/<Message>([^<]+)<\/Message>/);
        const detail = codeMatch
          ? `${codeMatch[1]}: ${msgMatch?.[1] ?? res.statusText}`
          : text || res.statusText;
        throw mapHttpStatusToError(res.status, 'azure', detail);
      }
      return res;
    } catch (err) {
      if (err instanceof StorageError) throw err;
      const detail =
        err instanceof Error && err.message ? `: ${err.message}` : '';
      throw new StorageError('CONNECTION_FAILED', `Connection failed${detail}`, 'azure', err);
    }
  }

  async testConnection(): Promise<boolean> {
    return testConnectionViaBuckets(this);
  }

  async listBuckets(): Promise<Bucket[]> {
    const url = `${this.baseUrl}/?comp=list`;
    const res = await this.request(url);
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'text/xml');
    return [...doc.getElementsByTagName('Container')]
      .map((container) => {
        const name = container.getElementsByTagName('Name')[0]?.textContent ?? '';
        const lastModified = container
          .getElementsByTagName('Properties')[0]
          ?.getElementsByTagName('Last-Modified')[0]?.textContent;
        return {
          name,
          createdAt: lastModified ? new Date(lastModified) : undefined,
          provider: 'azure' as const,
        };
      })
      .filter((b) => b.name);
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
    const url = appendAzureQuery(this.containerUrl(container), {
      restype: 'container',
      comp: 'list',
      prefix: opts.prefix,
      delimiter: opts.delimiter,
      maxresults: opts.maxResults ? String(opts.maxResults) : undefined,
      marker: opts.pageToken,
    });
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
    const url = this.objectUrl(container, key);
    const res = await this.request(url);
    return res.blob();
  }

  async getObjectMetadata(container: string, key: string): Promise<ObjectMetadata> {
    const url = this.objectUrl(container, key);
    const res = await this.request(url, { method: 'HEAD' });
    const customMetadata: Record<string, string> = {};
    for (const [header, value] of res.headers.entries()) {
      if (header.startsWith('x-ms-meta-')) {
        customMetadata[header.slice('x-ms-meta-'.length)] = value;
      }
    }
    return {
      key,
      bucket: container,
      size: Number(res.headers.get('content-length') ?? 0),
      contentType: res.headers.get('content-type') ?? 'application/octet-stream',
      lastModified: new Date(res.headers.get('last-modified') ?? Date.now()),
      etag: res.headers.get('etag')?.replace(/"/g, '') ?? '',
      versionId: res.headers.get('x-ms-version-id') ?? undefined,
      customMetadata,
      provider: 'azure',
    };
  }

  async uploadObject(
    container: string,
    key: string,
    file: File,
    opts?: UploadOpts,
  ): Promise<void> {
    assertUploadBlob(file);
    const url = this.objectUrl(container, key);
    const metaHeaders: Record<string, string> = {
      // Azurite/nginx hang on large Put Blob when Content-Type is video/* — send octet-stream.
      'Content-Type': 'application/octet-stream',
      'x-ms-blob-type': 'BlockBlob',
      // Stored blob type — independent of the request Content-Type above.
      'x-ms-blob-content-type': opts?.contentType || file.type || 'application/octet-stream',
    };
    if (opts?.customMetadata) {
      for (const [k, v] of Object.entries(opts.customMetadata)) {
        metaHeaders[`x-ms-meta-${k}`] = v;
      }
    }
    await this.request(url, {
      method: 'PUT',
      headers: metaHeaders,
      body: file,
    });
    opts?.onProgress?.(100, file.size);
  }

  async deleteObject(container: string, key: string): Promise<void> {
    const url = this.objectUrl(container, key);
    await this.request(url, { method: 'DELETE' });
  }

  async copyObject(src: ObjectRef, dst: ObjectRef): Promise<void> {
    const sourceUrl = this.copySourceUrl(src.bucket, src.key);
    const url = this.objectUrl(dst.bucket, dst.key);
    const res = await this.request(url, {
      method: 'PUT',
      headers: { 'x-ms-copy-source': sourceUrl },
    });
    await this.waitForCopy(dst.bucket, dst.key, res);
  }

  async moveObject(src: ObjectRef, dst: ObjectRef): Promise<void> {
    return moveViaCopy(this, src, dst);
  }

  async updateMetadata(
    container: string,
    key: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    // Set Blob Metadata replaces the whole set, so removed keys are dropped too.
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(metadata)) {
      headers[`x-ms-meta-${k}`] = v;
    }
    await this.request(appendAzureQuery(this.objectUrl(container, key), { comp: 'metadata' }), {
      method: 'PUT',
      headers,
    });
  }

  async listVersions(container: string, key: string): Promise<ObjectVersion[]> {
    const versions: ObjectVersion[] = [];
    let marker: string | undefined;

    for (let page = 0; page < 50; page++) {
      const url = appendAzureQuery(this.containerUrl(container), {
        restype: 'container',
        comp: 'list',
        prefix: key,
        include: 'versions',
        marker,
      });
      const res = await this.request(url);
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, 'text/xml');
      versions.push(...this.parseBlobVersions(doc, key));

      const next = doc.getElementsByTagName('NextMarker')[0]?.textContent?.trim();
      if (!next || next === marker) break;
      marker = next;
    }

    if (versions.length) {
      const hasLatest = versions.some((v) => v.isLatest);
      if (!hasLatest && versions.length === 1) {
        versions[0]!.isLatest = true;
      }
      return versions.sort(
        (a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
      );
    }

    try {
      const meta = await this.getObjectMetadata(container, key);
      return [
        {
          versionId: meta.versionId ?? meta.etag ?? 'current',
          size: meta.size,
          lastModified: meta.lastModified,
          isLatest: true,
          etag: meta.etag,
        },
      ];
    } catch {
      return [];
    }
  }

  async restoreVersion(container: string, key: string, versionId: string): Promise<void> {
    const url = this.objectUrl(container, key);
    const res = await this.request(url, {
      method: 'PUT',
      headers: { 'x-ms-copy-source': this.copySourceUrl(container, key, versionId) },
    });
    await this.waitForCopy(container, key, res);
  }

  async deleteVersion(container: string, key: string, versionId: string): Promise<void> {
    // The version is selected by the `versionid` query parameter; without it Azure
    // deletes the current blob instead.
    const url = appendAzureQuery(this.objectUrl(container, key), { versionid: versionId });
    await this.request(url, { method: 'DELETE' });
  }

  getObjectUrl(container: string, key: string): string {
    return this.objectUrl(container, key);
  }

  getPathFormats(container: string, key: string): PathFormats {
    return buildPathFormats('azure', container, key, this.baseUrl);
  }
}

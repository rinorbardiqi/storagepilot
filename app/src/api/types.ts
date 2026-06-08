export type ProviderType = 'gcs' | 's3' | 'azure';

export interface Bucket {
  name: string;
  createdAt?: Date;
  provider: ProviderType;
}

export interface StorageObject {
  key: string;
  size: number;
  contentType: string;
  lastModified: Date;
  etag?: string;
  isFolder: boolean;
  versionId?: string;
}

export interface ListOpts {
  prefix?: string;
  delimiter?: string;
  maxResults?: number;
  pageToken?: string;
}

export interface ListResult {
  objects: StorageObject[];
  prefixes: string[];
  nextPageToken?: string;
}

export interface ObjectMetadata {
  key: string;
  bucket: string;
  size: number;
  contentType: string;
  lastModified: Date;
  etag: string;
  versionId?: string;
  customMetadata: Record<string, string>;
  provider: ProviderType;
}

export interface ObjectRef {
  bucket: string;
  key: string;
}

export interface UploadOpts {
  contentType?: string;
  customMetadata?: Record<string, string>;
  onProgress?: (percent: number, bytesUploaded: number) => void;
}

export interface PathFormats {
  native: string;
  http: string;
  sdkPath: string;
}

export interface BucketStats {
  objectCount: number;
  totalSize: number;
  contentTypeBreakdown: Record<string, { count: number; size: number }>;
  largestObjects: Array<{ key: string; size: number }>;
}

export interface CorsRule {
  origins: string[];
  methods: string[];
  headers: string[];
  maxAgeSeconds: number;
}

export interface ObjectVersion {
  versionId: string;
  size: number;
  lastModified: Date;
  isLatest: boolean;
  etag: string;
}

export interface CreateBucketOpts {
  enableVersioning?: boolean;
  location?: string;
}

export type StorageErrorCode =
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'CONNECTION_FAILED'
  | 'UNKNOWN';

export class StorageError extends Error {
  constructor(
    public code: StorageErrorCode,
    message: string,
    public provider: ProviderType,
    public originalError?: unknown,
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/** Extract a human-readable message from GCS/S3/Azure error bodies. */
export function parseStorageErrorBody(text: string): string | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;

  try {
    const json = JSON.parse(trimmed) as {
      error?: { message?: string };
      message?: string;
    };
    if (json.error?.message) return json.error.message;
    if (json.message) return json.message;
  } catch {
    const xmlMessage = trimmed.match(/<Message>([^<]+)<\/Message>/i)?.[1];
    if (xmlMessage) return xmlMessage;
  }

  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
}

export function mapHttpStatusToError(
  status: number,
  provider: ProviderType,
  message?: string,
): StorageError {
  if (status === 404) {
    return new StorageError('NOT_FOUND', message ?? 'Not found', provider);
  }
  if (status === 401 || status === 403) {
    return new StorageError('FORBIDDEN', message ?? 'Forbidden', provider);
  }
  if (status === 409 || status === 412) {
    return new StorageError('CONFLICT', message ?? 'Conflict', provider);
  }
  return new StorageError('UNKNOWN', message ?? `HTTP ${status}`, provider);
}

export async function fetchWithError(
  url: string,
  provider: ProviderType,
  init?: RequestInit,
): Promise<Response> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const message =
        parseStorageErrorBody(text) || res.statusText || `HTTP ${res.status}`;
      throw mapHttpStatusToError(res.status, provider, message);
    }
    return res;
  } catch (err) {
    if (err instanceof StorageError) throw err;
    throw new StorageError('CONNECTION_FAILED', 'Connection failed', provider, err);
  }
}

export function notImplemented(provider: ProviderType, method: string): never {
  throw new StorageError('UNKNOWN', `${method} not yet implemented`, provider);
}

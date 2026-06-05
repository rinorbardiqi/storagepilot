import type { ProviderType } from '../api/types';

export interface PathFormats {
  native: string;
  http: string;
  sdkPath: string;
}

/** Encode each path segment individually, preserving `/` separators. */
function encodedPath(bucket: string, key: string): string {
  const keyEncoded = key.split('/').map(encodeURIComponent).join('/');
  return `${encodeURIComponent(bucket)}/${keyEncoded}`;
}

export function buildPathFormats(
  provider: ProviderType,
  bucket: string,
  key: string,
  baseUrl: string,
): PathFormats {
  const httpUrl = `${baseUrl}/${encodedPath(bucket, key)}`;
  const sdkPath = `${bucket}/${key}`;
  switch (provider) {
    case 'gcs':
      return { native: `gs://${bucket}/${key}`, http: httpUrl, sdkPath };
    case 's3':
      return { native: `s3://${bucket}/${key}`, http: httpUrl, sdkPath };
    case 'azure':
      return { native: `az://${bucket}/${key}`, http: httpUrl, sdkPath };
  }
}

import type { ProviderType } from '../api/types';

export interface PathFormats {
  native: string;
  http: string;
  sdkPath: string;
}

export function buildPathFormats(
  provider: ProviderType,
  bucket: string,
  key: string,
  baseUrl: string,
): PathFormats {
  const httpUrl = `${baseUrl}/${bucket}/${key}`;
  switch (provider) {
    case 'gcs':
      return { native: `gs://${bucket}/${key}`, http: httpUrl, sdkPath: `${bucket}/${key}` };
    case 's3':
      return { native: `s3://${bucket}/${key}`, http: httpUrl, sdkPath: `${bucket}/${key}` };
    case 'azure':
      return { native: `az://${bucket}/${key}`, http: httpUrl, sdkPath: `${bucket}/${key}` };
  }
}

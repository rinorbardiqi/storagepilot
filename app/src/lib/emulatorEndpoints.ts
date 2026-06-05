import { resolveApiUrl } from './resolveApiUrl';

/** Azurite default account key (public, dev only). */
export const AZURITE_ACCOUNT_KEY =
  'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==';

function emulatorHost(): string {
  return typeof window !== 'undefined' ? window.location.hostname : 'localhost';
}

/**
 * GCS uses unsigned fetch — nginx path proxy works.
 */
export function getDefaultGcsBase(): string {
  const env = import.meta.env.VITE_GCS_BASE;
  return env ?? '/api/gcs';
}

/**
 * S3 SigV4 signs the request path. Nginx strips `/api/s3` before forwarding to MinIO,
 * which breaks the AWS SDK signature — talk to MinIO directly (port 9000).
 */
export function getDefaultS3Endpoint(): string {
  const env = import.meta.env.VITE_S3_BASE;
  if (env && /^https?:\/\//i.test(env) && !env.includes('/api/s3')) {
    return env.replace(/\/$/, '');
  }
  return `http://${emulatorHost()}:9000`;
}

/** Normalize legacy or broken S3 endpoint values. */
export function normalizeS3Endpoint(url?: string): string {
  if (!url || url.includes('/api/s3')) return getDefaultS3Endpoint();
  if (/^https?:\/\//i.test(url)) return url.replace(/\/$/, '');
  return getDefaultS3Endpoint();
}

/**
 * Azure SharedKey signs the blob path. Through nginx, requests use `/api/azure/...`
 * but Azurite validates against `/account/...` — azureSign strips the proxy prefix.
 */
export function getDefaultAzureBlobServiceUrl(accountName = 'devstoreaccount1'): string {
  const env = import.meta.env.VITE_AZURE_BASE;
  if (env && /^https?:\/\//i.test(env) && !env.includes('/api/azure')) {
    return `${env.replace(/\/$/, '')}/${accountName}`;
  }
  const proxyBase = env ?? '/api/azure';
  return `${resolveApiUrl(proxyBase)}/${accountName}`;
}

/** Ensure proxy URLs include the storage account segment Azurite expects. */
function ensureAzureAccountInProxyUrl(url: string, accountName: string): string {
  const trimmed = url.replace(/\/$/, '');
  const proxyMatch = trimmed.match(/^(.*\/api\/azure)(?:\/(.*))?$/);
  if (!proxyMatch) return trimmed;

  const [, proxyRoot, suffix] = proxyMatch;
  if (!suffix || suffix === accountName) {
    return `${proxyRoot}/${accountName}`;
  }
  if (suffix.startsWith(`${accountName}/`) || suffix === accountName) {
    return trimmed;
  }
  return `${proxyRoot}/${accountName}`;
}

/**
 * Direct Azurite / blob service URL for server-side copy sources.
 * Azurite fetches x-ms-copy-source over HTTP — proxy URLs often fail with AuthorizationFailure.
 */
export function getAzureDirectServiceUrl(accountName = 'devstoreaccount1'): string {
  const env = import.meta.env.VITE_AZURE_BASE;
  if (env && /^https?:\/\//i.test(env) && !env.includes('/api/azure')) {
    return `${env.replace(/\/$/, '')}/${accountName}`;
  }
  return `http://${emulatorHost()}:10000/${accountName}`;
}

/** Normalize legacy direct or broken Azure URLs to the nginx proxy base. */
export function normalizeAzureServiceUrl(url: string | undefined, accountName: string): string {
  if (!url) return getDefaultAzureBlobServiceUrl(accountName);

  // Legacy direct port — prefer same-origin proxy when UI is served via nginx
  if (/^https?:\/\//i.test(url) && url.includes(':10000')) {
    return getDefaultAzureBlobServiceUrl(accountName);
  }

  const resolved = url.startsWith('/') || !/^https?:\/\//i.test(url) ? resolveApiUrl(url) : url;
  const trimmed = resolved.replace(/\/$/, '');

  if (trimmed.includes('/api/azure')) {
    return ensureAzureAccountInProxyUrl(trimmed, accountName);
  }

  if (url.startsWith('/')) {
    return `${resolveApiUrl(url)}/${accountName}`.replace(/\/$/, '');
  }

  return trimmed;
}

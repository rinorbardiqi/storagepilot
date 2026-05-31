/** Azure Blob SharedKey signing for browser (Web Crypto). Azurite / dev only. */

const MS_VERSION = '2026-02-06';

/** Nginx proxy prefix — stripped from canonical resource (Azurite never sees this). */
const AZURE_PROXY_PREFIX = '/api/azure';

function decodeBase64Key(key: string): Uint8Array {
  const binary = atob(key);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacSha256Base64(key: Uint8Array, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function getHeader(headers: Record<string, string>, name: string): string {
  const key = Object.keys(headers).find((h) => h.toLowerCase() === name.toLowerCase());
  const value = key ? headers[key] : '';
  if (name.toLowerCase() === 'content-length' && value === '0') return '';
  return value;
}

function canonicalizedHeaders(headers: Record<string, string>): string {
  return Object.keys(headers)
    .filter((h) => h.toLowerCase().startsWith('x-ms-'))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((h) => `${h.toLowerCase()}:${getHeader(headers, h).trim()}\n`)
    .join('');
}

function blobPathname(pathname: string): string {
  let path = pathname;
  if (path.startsWith(AZURE_PROXY_PREFIX)) {
    path = path.slice(AZURE_PROXY_PREFIX.length) || '/';
  }
  return path;
}

/** Path-style Azurite URLs sign as /{account}{path} (see @azure/storage-common SharedKey policy). */
function canonicalizedResource(accountName: string, url: URL): string {
  let path = blobPathname(url.pathname);
  if (!path.startsWith('/')) path = `/${path}`;
  if (path === `/${accountName}`) path = `/${accountName}/`;

  let resource = `/${accountName}${path}`;
  const params = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [key, value] of params) {
    resource += `\n${key.toLowerCase()}:${value}`;
  }
  return resource;
}

async function signStringToSign(
  accountName: string,
  accountKey: string,
  method: string,
  url: URL,
  headers: Record<string, string>,
): Promise<string> {
  const stringToSign =
    [
      method.toUpperCase(),
      getHeader(headers, 'Content-Language'),
      getHeader(headers, 'Content-Encoding'),
      getHeader(headers, 'Content-Length'),
      getHeader(headers, 'Content-MD5'),
      getHeader(headers, 'Content-Type'),
      getHeader(headers, 'Date'),
      getHeader(headers, 'If-Modified-Since'),
      getHeader(headers, 'If-Match'),
      getHeader(headers, 'If-None-Match'),
      getHeader(headers, 'If-Unmodified-Since'),
      getHeader(headers, 'Range'),
    ].join('\n') +
    '\n' +
    canonicalizedHeaders(headers) +
    canonicalizedResource(accountName, url);

  return hmacSha256Base64(decodeBase64Key(accountKey), stringToSign);
}

export async function azureFetch(
  url: string,
  accountName: string,
  accountKey: string,
  init: RequestInit = {},
): Promise<Response> {
  const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : undefined);
  const method = (init.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'x-ms-date': new Date().toUTCString(),
    'x-ms-version': MS_VERSION,
  };

  if (init.headers) {
    const h =
      init.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : init.headers;
    Object.assign(headers, h as Record<string, string>);
  }

  if (init.body && !getHeader(headers, 'Content-Length')) {
    if (typeof init.body === 'string') {
      headers['Content-Length'] = String(new TextEncoder().encode(init.body).length);
    } else if (init.body instanceof Blob) {
      headers['Content-Length'] = String(init.body.size);
    }
  }

  const signature = await signStringToSign(accountName, accountKey, method, parsed, headers);
  headers.Authorization = `SharedKey ${accountName}:${signature}`;

  return fetch(parsed.toString(), { ...init, method, headers });
}

/** Exported for tests — canonical resource Azurite validates against. */
export function buildCanonicalizedResource(accountName: string, url: string): string {
  return canonicalizedResource(accountName, new URL(url, 'http://localhost'));
}

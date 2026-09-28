/**
 * Server-side fetch for Upload → From URL, shared by the Docker proxy
 * (url-fetch-proxy.mjs) and the Vite dev middleware.
 *
 * The proxy runs next to the storage emulators and is often reachable from the
 * LAN, so it must not become an open relay into private networks: every hop
 * (including redirects) must resolve to a public address, responses are size
 * capped, and requests time out. Set URL_FETCH_ALLOW_PRIVATE=1 to lift the
 * address check on a trusted machine.
 */
import { lookup } from 'node:dns/promises';
import net from 'node:net';

const MAX_BYTES = Number(process.env.URL_FETCH_MAX_BYTES ?? 512 * 1024 * 1024);
const TIMEOUT_MS = Number(process.env.URL_FETCH_TIMEOUT_MS ?? 60_000);
const MAX_REDIRECTS = 5;
const ALLOW_PRIVATE = process.env.URL_FETCH_ALLOW_PRIVATE === '1';

export class UrlFetchError extends Error {
  /** @param {number} status @param {string} message */
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** @param {string} ip */
function isPrivateIPv4(ip) {
  const [a = 0, b = 0] = ip.split('.').map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

/** @param {string} address */
export function isPrivateAddress(address) {
  const ip = address.toLowerCase();
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return (
    ip === '::' ||
    ip === '::1' ||
    ip.startsWith('fc') ||
    ip.startsWith('fd') ||
    /^fe[89ab]/.test(ip) ||
    ip.startsWith('ff')
  );
}

/** @param {URL} url */
async function assertAllowedUrl(url) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UrlFetchError(400, 'Only http(s) URLs are supported');
  }
  if (ALLOW_PRIVATE) return;
  const host = url.hostname.replace(/^\[|\]$/g, '');
  let addresses;
  try {
    addresses = net.isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address);
  } catch {
    throw new UrlFetchError(502, `Could not resolve ${host}`);
  }
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new UrlFetchError(
      403,
      'URL points to a private or local network address; fetch it in the browser or use the Files tab',
    );
  }
}

/**
 * Fetch a remote URL with SSRF, size and time limits.
 * @param {string} target
 * @returns {Promise<{ contentType: string; body: Buffer }>}
 */
export async function fetchRemoteUrl(target) {
  let url;
  try {
    url = new URL(target);
  } catch {
    throw new UrlFetchError(400, 'Invalid url parameter');
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertAllowedUrl(url);
    let res;
    try {
      res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (err) {
      const timedOut = err instanceof Error && err.name === 'TimeoutError';
      throw new UrlFetchError(timedOut ? 504 : 502, timedOut ? 'Upstream timed out' : 'Fetch failed');
    }

    // Follow redirects ourselves so every hop is checked against the address rules.
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url);
      continue;
    }
    if (!res.ok) throw new UrlFetchError(res.status, `Upstream HTTP ${res.status}`);

    const declared = Number(res.headers.get('content-length') ?? 0);
    if (declared > MAX_BYTES) throw new UrlFetchError(413, 'Remote file is too large');

    const chunks = [];
    let total = 0;
    if (res.body) {
      for await (const chunk of res.body) {
        total += chunk.byteLength;
        if (total > MAX_BYTES) throw new UrlFetchError(413, 'Remote file is too large');
        chunks.push(Buffer.from(chunk));
      }
    }
    return {
      contentType: res.headers.get('content-type') || 'application/octet-stream',
      body: Buffer.concat(chunks),
    };
  }
  throw new UrlFetchError(508, 'Too many redirects');
}

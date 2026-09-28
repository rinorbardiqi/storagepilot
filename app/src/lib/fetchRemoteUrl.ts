function isLikelyCorsOrNetworkError(err: unknown): boolean {
  if (!(err instanceof TypeError)) return false;
  const m = err.message.toLowerCase();
  return m.includes('fetch') || m.includes('network') || m.includes('cors');
}

/**
 * Fetch a remote URL for upload. Tries the browser first, then the same-origin
 * `/api/fetch` proxy (Vite dev server or bundled Docker image).
 */
export async function fetchRemoteUrl(url: string): Promise<Blob> {
  let directError: unknown;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.blob();
  } catch (err) {
    directError = err;
  }

  let proxyRes: Response;
  try {
    proxyRes = await fetch(`/api/fetch?url=${encodeURIComponent(url)}`);
  } catch (proxyErr) {
    if (isLikelyCorsOrNetworkError(directError)) {
      throw new Error(
        'Could not fetch URL — blocked by browser CORS or network. Use the Files tab, or a URL from this app.',
      );
    }
    if (directError instanceof Error) throw directError;
    if (proxyErr instanceof Error) throw proxyErr;
    throw new Error('Failed to fetch URL');
  }

  if (proxyRes.ok) return proxyRes.blob();

  // The proxy answered with a reason (blocked address, too large, upstream 404…) —
  // that is more useful than the browser's generic CORS failure. An HTML body means
  // no proxy is running (e.g. nginx's own 502 page in the UI-only image).
  const text = await proxyRes.text().catch(() => '');
  if (text && !/^\s*</.test(text)) throw new Error(text);
  if (isLikelyCorsOrNetworkError(directError)) {
    throw new Error(
      'Could not fetch URL — blocked by browser CORS or network. Use the Files tab, or a URL from this app.',
    );
  }
  if (directError instanceof Error) throw directError;
  throw new Error(`Proxy fetch failed (HTTP ${proxyRes.status})`);
}

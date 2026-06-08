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

  try {
    const proxyUrl = `/api/fetch?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Proxy fetch failed (HTTP ${res.status})`);
    }
    return await res.blob();
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
}

import { useEffect, useState } from 'react';
import { getPreviewKind, resolveContentType } from '../lib/contentTypeIcons';
import { useConnectionStore } from '../store/connectionStore';

export interface ObjectBlobState {
  blob: Blob | null;
  url: string | null;
  contentType: string;
  previewKind: ReturnType<typeof getPreviewKind>;
  loading: boolean;
  error: string | null;
}

interface UseObjectBlobOptions {
  enabled?: boolean;
}

export function useObjectBlob(
  bucket: string,
  key: string,
  contentType: string,
  options: UseObjectBlobOptions = {},
): ObjectBlobState {
  const enabled = options.enabled ?? true;
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const resolvedType = resolveContentType(key, contentType);
  const previewKind = getPreviewKind(key, contentType);

  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setBlob(null);
      setUrl(null);
      setError(null);
      setLoading(false);
      return;
    }

    const provider = getActiveProvider();
    if (!provider) {
      setLoading(false);
      setError('No active connection');
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    setBlob(null);
    setUrl(null);
    setError(null);
    setLoading(true);

    void provider
      .getObject(bucket, key)
      .then((b) => {
        if (cancelled) return;
        setBlob(b);
        const kind = getPreviewKind(key, contentType);
        if (kind === 'image' || kind === 'video' || kind === 'audio' || kind === 'pdf') {
          objectUrl = URL.createObjectURL(b);
          setUrl(objectUrl);
        }
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load object');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [bucket, key, contentType, enabled, getActiveProvider]);

  return { blob, url, contentType: resolvedType, previewKind, loading, error };
}

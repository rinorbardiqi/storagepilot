import { useCallback, useEffect, useRef, useState } from 'react';
import { StorageError } from '../api/types';
import type { ListResult } from '../api/types';
import { OBJECTS_PAGE_SIZE } from '../lib/listPagination';
import { useAppStore } from '../store/appStore';
import { useConnectionStore } from '../store/connectionStore';
import { useUiStore } from '../store/uiStore';

const EMPTY: ListResult = { objects: [], prefixes: [] };

export function useObjects() {
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const connectionStatus = useConnectionStore((s) =>
    activeProfileId ? s.connectionStatus[activeProfileId] : undefined,
  );
  const currentBucket = useAppStore((s) => s.currentBucket);
  const currentPrefix = useAppStore((s) => s.currentPrefix);
  const objectsRevision = useAppStore((s) => s.objectsRevision);
  const setNotFound = useUiStore((s) => s.setNotFound);
  const setSessionConnectionLost = useUiStore((s) => s.setSessionConnectionLost);
  const [data, setData] = useState<ListResult>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageTokens, setPageTokens] = useState<(string | undefined)[]>([undefined]);

  // Tracks the current request so stale responses are discarded.
  const requestIdRef = useRef(0);

  const pageToken = pageTokens[pageIndex];
  const page = pageIndex + 1;
  const hasNextPage = Boolean(data.nextPageToken);
  const hasPreviousPage = pageIndex > 0;
  const itemCount = data.objects.length + data.prefixes.length;

  useEffect(() => {
    setPageIndex(0);
    setPageTokens([undefined]);
  }, [currentBucket, currentPrefix, activeProfileId]);

  const refresh = useCallback(async () => {
    const provider = getActiveProvider();
    if (!provider || !currentBucket || connectionStatus !== 'connected') {
      setData(EMPTY);
      setLoading(false);
      return;
    }

    const thisId = ++requestIdRef.current;

    setLoading(true);
    setError(null);
    setNotFound(false);
    setSessionConnectionLost(false);
    try {
      const result = await provider.listObjects(currentBucket, {
        prefix: currentPrefix,
        delimiter: '/',
        maxResults: OBJECTS_PAGE_SIZE,
        pageToken,
      });
      // Discard if a newer request is already in flight.
      if (thisId !== requestIdRef.current) return;
      setData(result);
    } catch (err) {
      if (thisId !== requestIdRef.current) return;
      if (err instanceof StorageError) {
        if (err.code === 'NOT_FOUND') {
          setNotFound(true, err.message);
        } else if (err.code === 'CONNECTION_FAILED') {
          setSessionConnectionLost(true);
        }
      }
      setError(err instanceof Error ? err.message : 'Failed to load objects');
      setData(EMPTY);
    } finally {
      if (thisId === requestIdRef.current) setLoading(false);
    }
  }, [
    getActiveProvider,
    connectionStatus,
    currentBucket,
    currentPrefix,
    pageToken,
    setNotFound,
    setSessionConnectionLost,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh, objectsRevision]);

  const goToNextPage = useCallback(() => {
    if (!data.nextPageToken) return;
    setPageTokens((tokens) => {
      const nextIndex = pageIndex + 1;
      if (nextIndex < tokens.length) return tokens;
      return [...tokens, data.nextPageToken];
    });
    setPageIndex((index) => index + 1);
  }, [data.nextPageToken, pageIndex]);

  const goToPreviousPage = useCallback(() => {
    setPageIndex((index) => Math.max(0, index - 1));
  }, []);

  const isEmpty =
    !loading &&
    !error &&
    data.objects.length === 0 &&
    data.prefixes.length === 0;

  return {
    ...data,
    loading,
    error,
    refresh,
    isEmpty,
    page,
    pageSize: OBJECTS_PAGE_SIZE,
    pageIndex,
    itemCount,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
  };
}

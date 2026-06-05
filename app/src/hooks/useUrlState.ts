import { useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useConnectionStore } from '../store/connectionStore';

/**
 * Bidirectional URL ↔ store sync.
 *
 * - URL → store: applies route params/search to store on initial load and real
 *   browser navigation (back/forward).  We gate on `hydrated` so persisted store
 *   state wins over a bare "/" redirect on first load.
 *
 * - store → URL: `syncToUrl` pushes an explicit navigation.  Callers are
 *   responsible for calling it; we never apply stale URL params back to the
 *   store reactively after the initial sync.
 */
export function useUrlState(hydrated = true) {
  const { provider, bucket, '*': prefix = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Stable action references (Zustand actions never change identity)
  const setCurrentBucket = useAppStore((s) => s.setCurrentBucket);
  const setCurrentPrefix = useAppStore((s) => s.setCurrentPrefix);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const profiles = useConnectionStore((s) => s.profiles);
  const setActiveProfile = useConnectionStore((s) => s.setActiveProfile);

  // Track whether we've done the initial URL→store sync so we don't re-apply
  // stale URL params on every unrelated store update.
  const initialSyncDone = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    // Only apply URL→store once per route change (route params changing means
    // genuine browser navigation, so we reset the flag).
    initialSyncDone.current = false;
  }, [hydrated, provider, bucket, prefix, searchParams]);

  useEffect(() => {
    if (!hydrated || initialSyncDone.current) return;
    initialSyncDone.current = true;

    if (provider) {
      const profile = profiles.find((p) => p.type === provider);
      if (profile) setActiveProfile(profile.id);
    }

    // Always set or clear each field so navigation to a shorter URL clears state.
    setCurrentBucket(bucket ?? null);
    setCurrentPrefix(prefix);

    const view = searchParams.get('view');
    if (view === 'table' || view === 'grid') setViewMode(view);

    const query = searchParams.get('q');
    setSearchQuery(query ?? '');
  }, [
    hydrated,
    provider,
    bucket,
    prefix,
    searchParams,
    profiles,
    setActiveProfile,
    setCurrentBucket,
    setCurrentPrefix,
    setViewMode,
    setSearchQuery,
  ]);

  const syncToUrl = (opts: {
    provider?: string;
    bucket?: string;
    prefix?: string;
    view?: string;
    query?: string;
  }) => {
    const params = new URLSearchParams(searchParams);
    if (opts.view !== undefined) {
      if (opts.view) params.set('view', opts.view);
      else params.delete('view');
    }
    if (opts.query !== undefined) {
      if (opts.query) params.set('q', opts.query);
      else params.delete('q');
    }
    const p = opts.provider ?? provider ?? 'gcs';
    const b = opts.bucket ?? bucket;
    const pref = opts.prefix ?? prefix;
    const path = [p, b, pref].filter(Boolean).join('/');
    const qs = params.toString();
    navigate(`/${path}${qs ? `?${qs}` : ''}`);
  };

  return { syncToUrl, provider, bucket, prefix };
}

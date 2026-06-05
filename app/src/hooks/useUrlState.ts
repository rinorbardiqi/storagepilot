import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useConnectionStore } from '../store/connectionStore';

export function useUrlState(hydrated = true) {
  const { provider, bucket, '*': prefix = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setCurrentBucket, setCurrentPrefix, setViewMode, setSearchQuery } = useAppStore();
  const { profiles, setActiveProfile } = useConnectionStore();

  useEffect(() => {
    if (!hydrated) return;
    if (provider) {
      const profile = profiles.find((p) => p.type === provider);
      if (profile) setActiveProfile(profile.id);
    }
    if (bucket) setCurrentBucket(bucket);
    setCurrentPrefix(prefix);
    const view = searchParams.get('view');
    if (view === 'table' || view === 'grid') setViewMode(view);
    const query = searchParams.get('q');
    if (query) setSearchQuery(query);
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
    if (opts.view) params.set('view', opts.view);
    if (opts.query !== undefined) {
      if (opts.query) params.set('q', opts.query);
      else params.delete('q');
    }
    const p = opts.provider ?? provider ?? 'gcs';
    const b = opts.bucket ?? bucket;
    const pref = opts.prefix ?? prefix;
    const path = [p, b, pref].filter(Boolean).join('/');
    navigate(`/${path}?${params.toString()}`);
  };

  return { syncToUrl, provider, bucket, prefix };
}

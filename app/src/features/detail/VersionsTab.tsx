import { useEffect, useState } from 'react';
import type { ObjectVersion } from '../../api/types';
import { useConnectionStore } from '../../store/connectionStore';
import { useToast } from '../../hooks/useToast';
import { formatBytes } from '../../lib/formatBytes';
import { formatDate } from '../../lib/formatDate';
import { Button } from '../shared/Button';

export function VersionsTab({ bucket, objectKey }: { bucket: string; objectKey: string }) {
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const providerType = useConnectionStore((s) => s.profiles.find((p) => p.id === s.activeProfileId)?.type);
  const toast = useToast();
  const [versions, setVersions] = useState<ObjectVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const versionLabel = providerType === 'gcs' ? 'Generation' : 'Version ID';

  const refresh = async () => {
    const provider = getActiveProvider();
    if (!provider) return;
    setLoading(true);
    setError(null);
    try {
      const list = await provider.listVersions(bucket, objectKey);
      setVersions(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions');
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [bucket, objectKey, getActiveProvider]);

  const restore = async (versionId: string) => {
    const provider = getActiveProvider();
    if (!provider) return;
    try {
      await provider.restoreVersion(bucket, objectKey, versionId);
      toast.success('Version restored');
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Restore failed');
    }
  };

  const remove = async (versionId: string) => {
    const provider = getActiveProvider();
    if (!provider) return;
    try {
      await provider.deleteVersion(bucket, objectKey, versionId);
      toast.success('Version deleted');
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Loading versions…</p>;
  if (error) return <p className="text-sm text-[var(--error)]">{error}</p>;
  if (!versions.length) {
    return (
      <div className="py-8 text-center text-sm text-[var(--text-muted)]">
        <p>No versions found for this object.</p>
        <p className="mt-1 text-xs">Enable bucket versioning to keep history when objects are updated.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {versions.map((v) => (
        <li
          key={v.versionId}
          className="p-3 border border-[var(--border)] rounded-[var(--radius)] text-xs"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="min-w-0">
              <p className="text-[10px] uppercase text-[var(--text-muted)] mb-0.5">{versionLabel}</p>
              <span className="font-mono truncate block">{v.versionId}</span>
            </div>
            {v.isLatest && (
              <span className="text-[10px] uppercase text-[var(--success)]">Latest</span>
            )}
          </div>
          <p className="text-[var(--text-muted)]">
            {formatBytes(v.size)} · {formatDate(v.lastModified)}
          </p>
          <div className="flex gap-2 mt-2">
            {!v.isLatest && (
              <Button variant="outline" onClick={() => void restore(v.versionId)}>
                Restore
              </Button>
            )}
            {!v.isLatest && (
              <Button variant="danger" onClick={() => void remove(v.versionId)}>
                Delete
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

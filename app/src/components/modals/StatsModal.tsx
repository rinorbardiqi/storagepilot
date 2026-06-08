import { useEffect, useState } from 'react';
import type { BucketStats } from '../../api/types';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { formatBytes } from '../../lib/formatBytes';
import { Modal } from '../shared/Modal';

export function StatsModal() {
  const active = useModalStore((s) => s.active.stats);
  const closeModal = useModalStore((s) => s.closeModal);
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const payload = typeof active === 'object' ? active : undefined;
  const [stats, setStats] = useState<BucketStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!payload?.bucket) return;
    const provider = getActiveProvider();
    if (!provider) return;
    setLoading(true);
    setError(null);
    void provider
      .getBucketStats(payload.bucket)
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, [payload?.bucket, getActiveProvider]);

  const breakdown = stats
    ? Object.entries(stats.contentTypeBreakdown).sort((a, b) => b[1].size - a[1].size)
    : [];

  return (
    <Modal
      isOpen={Boolean(active)}
      onClose={() => closeModal('stats')}
      title={`Stats — ${payload?.bucket ?? 'bucket'}`}
      size="xl"
    >
      {loading && <p className="text-sm text-[var(--text-muted)]">Computing stats…</p>}
      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div className="p-4 border border-[var(--border)] rounded-[var(--radius)]">
              <p className="text-[var(--text-muted)] text-xs">Object count</p>
              <p className="text-2xl font-mono mt-1">{stats.objectCount.toLocaleString()}</p>
            </div>
            <div className="p-4 border border-[var(--border)] rounded-[var(--radius)]">
              <p className="text-[var(--text-muted)] text-xs">Storage used</p>
              <p className="text-2xl font-mono mt-1">{formatBytes(stats.totalSize)}</p>
            </div>
          </div>

          <h4 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Content types
          </h4>
          <div className="space-y-2 mb-6 max-h-40 overflow-y-auto">
            {breakdown.length === 0 && (
              <p className="text-xs text-[var(--text-muted)]">No objects</p>
            )}
            {breakdown.map(([type, { count, size }]) => (
              <div key={type} className="flex items-center gap-3 text-xs">
                <span className="font-mono flex-1 truncate">{type}</span>
                <span className="text-[var(--text-muted)]">{count} files</span>
                <span className="font-mono w-20 text-right">{formatBytes(size)}</span>
                <div className="w-24 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)]"
                    style={{ width: `${stats.totalSize ? (size / stats.totalSize) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <h4 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Largest objects
          </h4>
          <ul className="text-xs font-mono space-y-1 max-h-48 overflow-y-auto">
            {stats.largestObjects.map((o) => (
              <li key={o.key} className="flex justify-between gap-2 border-b border-[var(--border)] py-1">
                <span className="truncate">{o.key}</span>
                <span className="text-[var(--text-muted)] shrink-0">{formatBytes(o.size)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
}

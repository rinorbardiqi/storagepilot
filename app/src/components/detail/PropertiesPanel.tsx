import { useEffect, useState } from 'react';
import { Info, MousePointer2, Trash2, X } from 'lucide-react';
import type { BucketStats } from '../../api/types';
import { providerScheme } from '../../lib/providerDisplay';
import { formatBytes } from '../../lib/formatBytes';
import { useAppStore } from '../../store/appStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { useUiStore } from '../../store/uiStore';
import { useBuckets } from '../../hooks/useBuckets';
import { useToast } from '../../hooks/useToast';

export function PropertiesPanel() {
  const open = useUiStore((s) => s.propertiesPanelOpen);
  const closePropertiesPanel = useUiStore((s) => s.closePropertiesPanel);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const profiles = useConnectionStore((s) => s.profiles);
  const profile = profiles.find((p) => p.id === activeProfileId);
  const openModal = useModalStore((s) => s.openModal);
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const { refresh } = useBuckets();
  const toast = useToast();
  const closeBucketDetail = useUiStore((s) => s.closeBucketDetail);

  const [stats, setStats] = useState<BucketStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!open || !currentBucket) {
      setStats(null);
      return;
    }
    const provider = getActiveProvider();
    if (!provider) return;
    let cancelled = false;
    setLoadingStats(true);
    void provider
      .getBucketStats(currentBucket)
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingStats(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, currentBucket, getActiveProvider]);

  if (!open || !currentBucket) return null;

  const scheme = profile ? providerScheme(profile.type) : 's3';

  const deleteBucket = () => {
    if (!currentBucket) return;
    const provider = getActiveProvider();
    if (!provider) return;
    openModal('bulkConfirm', {
      count: 1,
      label: `Delete bucket "${currentBucket}" and all its objects? This cannot be undone.`,
      onConfirm: () => {
        void (async () => {
          try {
            await provider.deleteBucket(currentBucket);
            closeBucketDetail();
            useAppStore.getState().setCurrentBucket(null);
            toast.success(`Bucket "${currentBucket}" deleted`);
            await refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete bucket');
          }
        })();
      },
    });
  };

  return (
    <aside
      className="shrink-0 flex flex-col border-l border-[var(--border)] bg-[var(--bg-surface)]"
      style={{ width: 'var(--detail-panel-width)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Properties
        </span>
        <div className="flex items-center gap-2">
          <Info size={12} className="text-[var(--text-muted)]" />
          <button
            type="button"
            onClick={closePropertiesPanel}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Close properties panel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[200px]">
        <div className="size-12 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
          <MousePointer2 size={18} />
        </div>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-[220px]">
          Select an object to view its metadata, permissions, and preview.
        </p>
      </div>

      <div className="border-t border-[var(--border)] p-4 flex flex-col gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Bucket Stats
        </p>
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Total Objects</span>
            <span className="font-mono text-[var(--text-primary)]">
              {loadingStats ? '…' : stats ? stats.objectCount.toLocaleString() : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Storage Used</span>
            <span className="font-mono text-[var(--text-primary)]">
              {loadingStats ? '…' : stats ? formatBytes(stats.totalSize) : '—'}
            </span>
          </div>
        </div>
        <p className="font-mono text-[10px] text-[var(--text-muted)] truncate">
          {scheme}://{currentBucket}
        </p>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            className="flex-1 h-9 border border-[var(--border)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            onClick={() => openModal('stats', { bucket: currentBucket })}
          >
            Bucket Settings
          </button>
          <button
            type="button"
            className="h-9 w-9 border border-[var(--border)] text-[var(--error)] hover:bg-[var(--error)]/10 flex items-center justify-center"
            aria-label="Delete bucket"
            onClick={deleteBucket}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

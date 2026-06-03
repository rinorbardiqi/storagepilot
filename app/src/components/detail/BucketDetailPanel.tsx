import { useEffect, useState } from 'react';
import {
  ChevronRight,
  Globe,
  Info,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import type { BucketStats } from '../../api/types';
import { useBuckets } from '../../hooks/useBuckets';
import { useToast } from '../../hooks/useToast';
import { useAppStore } from '../../store/appStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { useUiStore } from '../../store/uiStore';
import { providerScheme } from '../../lib/providerDisplay';
import { formatBytes } from '../../lib/formatBytes';

function QuickActionRow({
  label,
  icon: Icon,
  onClick,
  danger,
}: {
  label: string;
  icon?: typeof ChevronRight;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between w-full p-[9px] border rounded-[var(--radius)] text-left transition-colors hover:bg-[var(--bg-elevated)] ${
        danger
          ? 'border-[rgba(248,81,73,0.3)] text-[var(--error)]'
          : 'border-[var(--border)] text-[var(--text-primary)]'
      }`}
    >
      <span className="text-xs leading-4">{label}</span>
      {Icon ? <Icon size={10} className="shrink-0 opacity-70" /> : <ChevronRight size={10} className="shrink-0 opacity-70" />}
    </button>
  );
}

export function BucketDetailPanel() {
  const selectedBucketInList = useUiStore((s) => s.selectedBucketInList);
  const bucketDetailPanelOpen = useUiStore((s) => s.bucketDetailPanelOpen);
  const closeBucketDetail = useUiStore((s) => s.closeBucketDetail);
  const setCurrentBucket = useAppStore((s) => s.setCurrentBucket);
  const openModal = useModalStore((s) => s.openModal);
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const profiles = useConnectionStore((s) => s.profiles);
  const profile = profiles.find((p) => p.id === activeProfileId);
  const { buckets, refresh: refreshBuckets } = useBuckets();
  const toast = useToast();
  const [stats, setStats] = useState<BucketStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const bucket = buckets.find((b) => b.name === selectedBucketInList);
  const showDetails = bucketDetailPanelOpen && selectedBucketInList && bucket;

  useEffect(() => {
    if (!selectedBucketInList || !bucketDetailPanelOpen) {
      setStats(null);
      return;
    }
    const provider = getActiveProvider();
    if (!provider) return;
    let cancelled = false;
    setLoadingStats(true);
    void provider
      .getBucketStats(selectedBucketInList)
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
  }, [selectedBucketInList, bucketDetailPanelOpen, getActiveProvider]);

  const scheme = profile ? providerScheme(profile.type) : 's3';

  const deleteBucket = () => {
    if (!bucket) return;
    const provider = getActiveProvider();
    if (!provider) return;
    openModal('bulkConfirm', {
      count: 1,
      label: `Delete bucket "${bucket.name}" and all its objects? This cannot be undone.`,
      onConfirm: () => {
        void (async () => {
          try {
            await provider.deleteBucket(bucket.name);
            closeBucketDetail();
            useUiStore.getState().setSelectedBucketInList(null);
            toast.success(`Bucket "${bucket.name}" deleted`);
            await refreshBuckets();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete bucket');
          }
        })();
      },
    });
  };

  return (
    <aside className="w-[var(--detail-panel-width)] shrink-0 flex flex-col border-l border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="flex items-center justify-between h-12 px-4 border-b border-[var(--border)] bg-[var(--bg-overlay)] shrink-0">
        <span
          className="text-[11px] font-semibold uppercase tracking-[1.1px] leading-[16.5px] text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          Bucket Details
        </span>
        <button
          type="button"
          onClick={closeBucketDetail}
          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          aria-label="Close bucket details"
        >
          <X size={12} />
        </button>
      </div>

      {!showDetails ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Info size={24} className="text-[var(--text-muted)] mb-3" />
          <p className="text-xs text-[var(--text-muted)]">Select a bucket to view details</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
            <div className="p-[17px] border border-[var(--border)] bg-[var(--bg-elevated)] rounded-[var(--radius)] flex flex-col gap-1">
              <p
                className="text-[10px] uppercase leading-[15px] text-[var(--text-muted)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Active Selection
              </p>
              <h3
                className="text-sm font-semibold leading-5 text-[var(--accent)] break-all"
                style={{ fontFamily: 'var(--font-ui)' }}
              >
                {bucket.name}
              </h3>
              <p className="text-[11px] leading-[16.5px] text-[var(--text-muted)] font-mono break-all">
                {scheme}://{bucket.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p
                  className="text-[10px] uppercase leading-[15px] text-[var(--text-muted)] mb-1"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Objects
                </p>
                <p className="text-xs font-semibold leading-4 text-[var(--text-primary)]">
                  {loadingStats ? '…' : stats ? stats.objectCount.toLocaleString() : '—'}
                </p>
              </div>
              <div>
                <p
                  className="text-[10px] uppercase leading-[15px] text-[var(--text-muted)] mb-1"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Total Size
                </p>
                <p className="text-xs font-semibold leading-4 text-[var(--text-primary)]">
                  {loadingStats ? '…' : stats ? formatBytes(stats.totalSize) : '—'}
                </p>
              </div>
            </div>

            <div className="h-px bg-[var(--border)]" />

            <div className="flex flex-col gap-2">
              <p
                className="text-[10px] uppercase leading-[15px] text-[var(--text-muted)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Quick Actions
              </p>
              <QuickActionRow
                label="Browse Objects"
                onClick={() => setCurrentBucket(bucket.name)}
              />
              <QuickActionRow
                label="Permissions (IAM)"
                icon={Shield}
                onClick={() => openModal('permissions', { bucket: bucket.name })}
              />
              <QuickActionRow
                label="CORS Settings"
                icon={Globe}
                onClick={() => openModal('cors', { bucket: bucket.name })}
              />
              <QuickActionRow label="Delete Bucket" icon={Trash2} onClick={deleteBucket} danger />
            </div>
          </div>

          <div className="border-t border-[var(--border)] bg-[var(--bg-overlay)] px-4 pt-[17px] pb-4 shrink-0">
            <div className="flex justify-between text-[10px] leading-[15px] text-[var(--text-muted)]">
              <span style={{ fontFamily: 'var(--font-mono)' }}>Storage used</span>
              <span className="text-[var(--accent)]" style={{ fontFamily: 'var(--font-mono)' }}>
                {loadingStats ? '…' : stats ? formatBytes(stats.totalSize) : '—'}
              </span>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

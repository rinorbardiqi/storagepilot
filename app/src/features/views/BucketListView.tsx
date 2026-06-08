import { useEffect, useRef } from 'react';
import { Database, MoreHorizontal, Plus, RefreshCw, Settings } from 'lucide-react';
import { useBuckets } from '../../hooks/useBuckets';
import { useModalStore } from '../../store/modalStore';
import { usePreferencesStore } from '../../store/preferencesStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useUiStore } from '../../store/uiStore';
import { useAppStore } from '../../store/appStore';
import { Button } from '../shared/Button';
import { Checkbox } from '../shared/Checkbox';

export function BucketListView() {
  const { buckets, loading, error, refresh } = useBuckets();
  const selectedBucketInList = useUiStore((s) => s.selectedBucketInList);
  const openBucketDetail = useUiStore((s) => s.openBucketDetail);
  const openModal = useModalStore((s) => s.openModal);
  const setCurrentBucket = useAppStore((s) => s.setCurrentBucket);
  const setNotFound = useUiStore((s) => s.setNotFound);
  const addRecentBucket = usePreferencesStore((s) => s.addRecentBucket);
  const selectedKeys = useSelectionStore((s) => s.selectedKeys);
  const toggle = useSelectionStore((s) => s.toggle);
  const selectAll = useSelectionStore((s) => s.selectAll);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const initialSelectDone = useRef(false);

  const bucketNames = buckets.map((b) => b.name);
  const selectedCount = bucketNames.filter((name) => selectedKeys.has(name)).length;
  const allSelected = bucketNames.length > 0 && selectedCount === bucketNames.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const browseBucket = (name: string) => {
    setNotFound(false);
    clearSelection();
    setCurrentBucket(name);
    addRecentBucket(name);
  };

  useEffect(() => {
    if (buckets.length && !initialSelectDone.current) {
      openBucketDetail(buckets[0]!.name);
      initialSelectDone.current = true;
    }
    if (!buckets.length) {
      initialSelectDone.current = false;
    }
  }, [buckets, openBucketDetail]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[var(--bg-base)]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-[var(--border)] bg-[var(--bg-base)]">
            <Database size={16} strokeWidth={1.75} className="text-[var(--accent-s3)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">
              Bucket List
            </h2>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
              {buckets.length} bucket{buckets.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={loading} className="size-9 p-0 justify-center">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
          <button
            type="button"
            onClick={() => openModal('newBucket')}
            className="inline-flex items-center gap-2 h-9 px-4 bg-[var(--accent-create)] text-black text-[10px] font-bold uppercase tracking-wider hover:opacity-90"
          >
            <Plus size={12} strokeWidth={3} />
            Create Bucket
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading && (
          <p className="px-6 py-8 text-sm text-[var(--text-muted)]">Loading buckets…</p>
        )}
        {error && <p className="px-6 py-4 text-sm text-[var(--error)]">{error}</p>}
        {!loading && !error && buckets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
            <p className="text-sm text-[var(--text-muted)]">No buckets yet.</p>
            <Button variant="accent" onClick={() => openModal('newBucket')}>
              <Plus size={14} />
              Create your first bucket
            </Button>
          </div>
        )}
        {buckets.length > 0 && (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--bg-surface)] border-b border-[var(--border)]">
              <tr
                className="text-[10px] uppercase text-[var(--text-muted)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <th className="w-12 px-3 py-3 text-left">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={() => (allSelected || someSelected ? clearSelection() : selectAll(bucketNames))}
                    aria-label="Select all buckets"
                  />
                </th>
                <th className="px-3 py-3 text-left font-medium">Bucket Name</th>
                <th className="px-3 py-3 text-left font-medium">Created At</th>
                <th className="w-24 px-3 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((bucket) => {
                const detailSelected = selectedBucketInList === bucket.name;
                const checked = selectedKeys.has(bucket.name);
                return (
                  <tr
                    key={bucket.name}
                    className={`border-b border-[var(--border)] cursor-pointer transition-colors ${
                      detailSelected ? 'bg-[var(--accent)]/10 ring-1 ring-inset ring-[var(--accent)]/30' : 'hover:bg-[var(--bg-surface)]'
                    }`}
                    onClick={() => browseBucket(bucket.name)}
                    title="Click to browse bucket"
                  >
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={checked}
                        onChange={() => toggle(bucket.name)}
                        aria-label={`Select ${bucket.name}`}
                      />
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">
                      <div className="flex items-center gap-2.5">
                        <Database
                          size={14}
                          strokeWidth={1.75}
                          className={`shrink-0 ${detailSelected ? 'text-[var(--accent-s3)]' : 'text-[var(--text-muted)]'}`}
                        />
                        <span className={detailSelected ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--accent-s3)]'}>
                          {bucket.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-[var(--text-muted)]">
                      {bucket.createdAt?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="p-1.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-elevated)]"
                          title="Bucket details"
                          onClick={() => openBucketDetail(bucket.name)}
                        >
                          <Settings size={16} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                          title="Bucket details"
                          onClick={() => openBucketDetail(bucket.name)}
                        >
                          <MoreHorizontal size={16} strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

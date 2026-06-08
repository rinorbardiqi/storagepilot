import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Database,
  FolderOpen,
  MoreHorizontal,
  Package,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
} from 'lucide-react';
import { BucketActionsMenu } from '../browser/BucketActionsMenu';
import { useBuckets } from '../../hooks/useBuckets';
import { useDeleteBucket } from '../../hooks/useDeleteBucket';
import { useModalStore } from '../../store/modalStore';
import { usePreferencesStore } from '../../store/preferencesStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useUiStore } from '../../store/uiStore';
import { useAppStore } from '../../store/appStore';
import { Button } from '../shared/Button';
import { Checkbox } from '../shared/Checkbox';
import { EmptyBucketsView } from './EmptyBucketsView';

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
  const closeBucketDetail = useUiStore((s) => s.closeBucketDetail);
  const setSelectedBucketInList = useUiStore((s) => s.setSelectedBucketInList);
  const { confirmDeleteBuckets, confirmDeleteBucket } = useDeleteBucket();
  const initialSelectDone = useRef(false);
  const [menuBucket, setMenuBucket] = useState<string | null>(null);

  const bucketNames = buckets.map((b) => b.name);
  const selectedNames = bucketNames.filter((name) => selectedKeys.has(name));
  const selectedCount = selectedNames.length;
  const allSelected = bucketNames.length > 0 && selectedCount === bucketNames.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const browseBucket = (name: string) => {
    setNotFound(false);
    clearSelection();
    setCurrentBucket(name);
    addRecentBucket(name);
  };

  const afterBucketDelete = async (deleted: string[]) => {
    const current = useAppStore.getState().currentBucket;
    const detail = useUiStore.getState().selectedBucketInList;
    if (current && deleted.includes(current)) {
      setCurrentBucket(null);
    }
    if (detail && deleted.includes(detail)) {
      closeBucketDetail();
      setSelectedBucketInList(null);
    }
    clearSelection();
    await refresh();
  };

  const deleteSelectedBuckets = () => {
    if (!selectedNames.length) return;
    confirmDeleteBuckets(selectedNames, () => afterBucketDelete(selectedNames));
  };

  const deleteOneBucket = (name: string) => {
    confirmDeleteBucket(name, () => afterBucketDelete([name]));
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

      <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)] min-h-[52px]">
        {selectedCount > 0 ? (
          <>
            <span className="text-xs text-[var(--text-muted)] mr-auto">
              {selectedCount} bucket{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <Button variant="outline" onClick={() => browseBucket(selectedNames[0]!)} disabled={selectedCount !== 1}>
              <FolderOpen size={14} />
              Browse
            </Button>
            <Button
              variant="outline"
              onClick={() => openModal('stats', { bucket: selectedNames[0]! })}
              disabled={selectedCount !== 1}
            >
              <BarChart3 size={14} />
              Stats
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                openModal('exportImport', { tab: 'export', buckets: selectedNames })
              }
            >
              <Package size={14} />
              Export
            </Button>
            <Button variant="danger" onClick={deleteSelectedBuckets}>
              <Trash2 size={14} />
              Delete
            </Button>
            <Button variant="outline" onClick={clearSelection}>
              Clear
            </Button>
          </>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">
            Select buckets to delete, export, or use row actions
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {loading && (
          <p className="px-6 py-8 text-sm text-[var(--text-muted)]">Loading buckets…</p>
        )}
        {error && <p className="px-6 py-4 text-sm text-[var(--error)]">{error}</p>}
        {!loading && !error && buckets.length === 0 && <EmptyBucketsView />}
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
                <th className="w-36 px-3 py-3 text-right font-medium">Actions</th>
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
                      detailSelected
                        ? 'bg-[var(--accent)]/10 ring-1 ring-inset ring-[var(--accent)]/30'
                        : 'hover:bg-[var(--bg-surface)]'
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
                        <span
                          className={
                            detailSelected
                              ? 'text-[var(--text-primary)] font-medium'
                              : 'text-[var(--accent-s3)]'
                          }
                        >
                          {bucket.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-[var(--text-muted)]">
                      {bucket.createdAt?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 relative">
                        <button
                          type="button"
                          className="p-1.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-elevated)]"
                          title="Browse objects"
                          aria-label={`Browse ${bucket.name}`}
                          onClick={() => browseBucket(bucket.name)}
                        >
                          <FolderOpen size={16} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-elevated)]"
                          title="Bucket details"
                          aria-label={`Details for ${bucket.name}`}
                          onClick={() => openBucketDetail(bucket.name)}
                        >
                          <Settings size={16} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--bg-elevated)]"
                          title="Delete bucket"
                          aria-label={`Delete ${bucket.name}`}
                          onClick={() => deleteOneBucket(bucket.name)}
                        >
                          <Trash2 size={16} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                          title="More actions"
                          aria-label={`More actions for ${bucket.name}`}
                          aria-expanded={menuBucket === bucket.name}
                          onClick={() =>
                            setMenuBucket((prev) => (prev === bucket.name ? null : bucket.name))
                          }
                        >
                          <MoreHorizontal size={16} strokeWidth={1.75} />
                        </button>
                        <BucketActionsMenu
                          bucketName={bucket.name}
                          open={menuBucket === bucket.name}
                          onClose={() => setMenuBucket(null)}
                          onBrowse={() => browseBucket(bucket.name)}
                          onDelete={() => deleteOneBucket(bucket.name)}
                        />
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

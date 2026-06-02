import { useCallback } from 'react';
import { DropZone } from '../browser/DropZone';
import { BrowserChrome } from '../browser/BrowserChrome';
import { ObjectGrid } from '../browser/ObjectGrid';
import { ObjectTable } from '../browser/ObjectTable';
import { FilterChips } from '../shared/FilterChips';
import { ListPagination } from '../shared/ListPagination';
import { useObjectActions } from '../../hooks/useObjectActions';
import { useObjects } from '../../hooks/useObjects';
import { useIsSearchActive } from '../../hooks/useMainView';
import { shouldShowListPagination } from '../../lib/listPagination';
import { useAppStore } from '../../store/appStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useUiStore } from '../../store/uiStore';
import { EmptyBucketView } from './EmptyBucketView';

export function ObjectBrowserView() {
  const navigateInto = useAppStore((s) => s.navigateInto);
  const viewMode = useAppStore((s) => s.viewMode);
  const searchActive = useIsSearchActive();
  const openDetail = useUiStore((s) => s.openDetail);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const {
    objects,
    prefixes,
    loading,
    error,
    refresh,
    isEmpty,
    page,
    pageSize,
    pageIndex,
    itemCount,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
  } = useObjects();
  const { downloadOne, deleteOne, deleteSelected, downloadSelected } = useObjectActions(refresh);

  const showPagination = shouldShowListPagination(pageIndex, hasNextPage, hasPreviousPage);

  const onNextPage = useCallback(() => {
    clearSelection();
    goToNextPage();
  }, [clearSelection, goToNextPage]);

  const onPreviousPage = useCallback(() => {
    clearSelection();
    goToPreviousPage();
  }, [clearSelection, goToPreviousPage]);

  if (!searchActive && isEmpty && pageIndex === 0) {
    return (
      <DropZone>
        <BrowserChrome
          onRefresh={refresh}
          loading={loading}
          onDeleteSelected={deleteSelected}
          onDownloadSelected={downloadSelected}
        />
        <EmptyBucketView />
      </DropZone>
    );
  }

  return (
    <DropZone>
      <BrowserChrome
        onRefresh={refresh}
        loading={loading}
        onDeleteSelected={deleteSelected}
        onDownloadSelected={downloadSelected}
      />
      {searchActive && <FilterChips />}
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-base)]">
        {error && (
          <div className="px-4 py-3 text-sm text-[var(--error)] border-b border-[var(--border)]">
            {error}
          </div>
        )}
        <div className="flex-1 overflow-auto">
          {loading && (
            <p className="px-4 py-8 text-sm text-[var(--text-muted)]">Loading objects…</p>
          )}
          {!loading && viewMode === 'table' ? (
            <ObjectTable
              objects={objects}
              prefixes={prefixes}
              onNavigatePrefix={navigateInto}
              onOpenObject={openDetail}
              onDownload={downloadOne}
              onDelete={deleteOne}
            />
          ) : (
            !loading && (
              <ObjectGrid
                objects={objects}
                prefixes={prefixes}
                onNavigatePrefix={navigateInto}
              />
            )
          )}
        </div>
        {showPagination && (
          <ListPagination
            page={page}
            itemCount={itemCount}
            pageSize={pageSize}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            loading={loading}
            onPrevious={onPreviousPage}
            onNext={onNextPage}
          />
        )}
      </div>
    </DropZone>
  );
}

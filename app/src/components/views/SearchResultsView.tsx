import { useCallback, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { BrowserChrome } from '../browser/BrowserChrome';
import { FilterChips } from '../shared/FilterChips';
import { ObjectTable } from '../browser/ObjectTable';
import { ListPagination } from '../shared/ListPagination';
import { SearchScopePanel } from '../detail/SearchScopePanel';
import { useObjectActions } from '../../hooks/useObjectActions';
import { useObjects } from '../../hooks/useObjects';
import { shouldShowListPagination } from '../../lib/listPagination';
import { useAppStore } from '../../store/appStore';
import { usePreferencesStore } from '../../store/preferencesStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useUiStore } from '../../store/uiStore';

export function SearchResultsView() {
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const filterContentType = useAppStore((s) => s.filterContentType);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const currentPrefix = useAppStore((s) => s.currentPrefix);
  const navigateInto = useAppStore((s) => s.navigateInto);
  const openDetail = useUiStore((s) => s.openDetail);
  const addRecentSearch = usePreferencesStore((s) => s.addRecentSearch);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const {
    objects,
    prefixes,
    loading,
    refresh,
    page,
    pageSize,
    pageIndex,
    itemCount,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
  } = useObjects();
  const { downloadOne, deleteOne, deleteSelected } = useObjectActions(refresh);

  useEffect(() => {
    if (searchQuery.trim() && currentBucket) {
      addRecentSearch(searchQuery, currentBucket);
    }
  }, [searchQuery, currentBucket, addRecentSearch]);

  const onNextPage = useCallback(() => {
    clearSelection();
    goToNextPage();
  }, [clearSelection, goToNextPage]);

  const onPreviousPage = useCallback(() => {
    clearSelection();
    goToPreviousPage();
  }, [clearSelection, goToPreviousPage]);

  const showPagination = shouldShowListPagination(pageIndex, hasNextPage, hasPreviousPage);

  const query = searchQuery.trim().toLowerCase();
  const filteredObjects = useMemo(() => {
    return objects.filter((o) => {
      if (query && !o.key.toLowerCase().includes(query)) return false;
      if (filterContentType && o.contentType !== filterContentType) return false;
      return true;
    });
  }, [objects, query, filterContentType]);

  const filteredPrefixes = useMemo(() => {
    return prefixes.filter((p) => !query || p.toLowerCase().includes(query));
  }, [prefixes, query]);

  const listed = objects.length + prefixes.length;
  const matches = filteredObjects.length + filteredPrefixes.length;

  return (
    <div className="flex flex-1 overflow-hidden min-h-0">
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <BrowserChrome onRefresh={refresh} loading={loading} onDeleteSelected={deleteSelected} />

        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)] flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 h-10 px-3 border border-[var(--border)] bg-[var(--bg-base)]">
              <Search size={14} className="text-[var(--text-muted)] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm font-mono text-[var(--text-primary)] outline-none"
                placeholder="Filter by object name…"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="text-[var(--text-muted)]">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <FilterChips />
          <p className="text-[10px] text-[var(--text-muted)] font-mono">
            {loading
              ? 'Loading…'
              : `${matches} match${matches !== 1 ? 'es' : ''} on page ${page} (${listed} listed)`}
            {currentPrefix ? ` · prefix: ${currentPrefix}` : ''}
          </p>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-base)]">
          <div className="flex-1 overflow-auto">
            <ObjectTable
              objects={filteredObjects}
              prefixes={filteredPrefixes}
              onNavigatePrefix={navigateInto}
              onOpenObject={openDetail}
              onDownload={downloadOne}
              onDelete={deleteOne}
            />
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
      </div>
      <SearchScopePanel listed={listed} matches={matches} loading={loading} />
    </div>
  );
}

import { create } from 'zustand';

type ViewMode = 'table' | 'grid';
type SortField = 'name' | 'size' | 'lastModified' | 'contentType';
type SortDir = 'asc' | 'desc';

interface AppState {
  currentBucket: string | null;
  currentPrefix: string;
  viewMode: ViewMode;
  sortField: SortField;
  sortDir: SortDir;
  searchQuery: string;
  browserSearchQuery: string;
  filterContentType: string | null;
  objectsRevision: number;

  setCurrentBucket: (bucket: string | null) => void;
  setCurrentPrefix: (prefix: string) => void;
  navigateInto: (prefix: string) => void;
  navigateUp: () => void;
  setViewMode: (mode: ViewMode) => void;
  setSort: (field: SortField, dir: SortDir) => void;
  toggleSort: (field: SortField) => void;
  setSearchQuery: (q: string) => void;
  setBrowserSearchQuery: (q: string) => void;
  setFilterContentType: (ct: string | null) => void;
  resetFilters: () => void;
  invalidateObjects: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  currentBucket: null,
  currentPrefix: '',
  viewMode: 'table',
  sortField: 'name',
  sortDir: 'asc',
  searchQuery: '',
  browserSearchQuery: '',
  filterContentType: null,
  objectsRevision: 0,

  setCurrentBucket: (bucket) =>
    set({ currentBucket: bucket, currentPrefix: '', browserSearchQuery: '' }),
  setCurrentPrefix: (prefix) => set({ currentPrefix: prefix, browserSearchQuery: '' }),

  navigateInto: (segment) =>
    set((s) => ({ currentPrefix: s.currentPrefix + segment, browserSearchQuery: '' })),

  navigateUp: () =>
    set((s) => {
      const parts = s.currentPrefix.replace(/\/$/, '').split('/');
      parts.pop();
      return {
        currentPrefix: parts.length ? `${parts.join('/')}/` : '',
        browserSearchQuery: '',
      };
    }),

  setViewMode: (viewMode) => set({ viewMode }),
  setSort: (sortField, sortDir) => set({ sortField, sortDir }),
  toggleSort: (field) =>
    set((s) =>
      s.sortField === field
        ? { sortDir: s.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortField: field, sortDir: 'asc' },
    ),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setBrowserSearchQuery: (browserSearchQuery) => set({ browserSearchQuery }),
  setFilterContentType: (filterContentType) => set({ filterContentType }),
  resetFilters: () => set({ searchQuery: '', filterContentType: null }),
  invalidateObjects: () => set((s) => ({ objectsRevision: s.objectsRevision + 1 })),
}));

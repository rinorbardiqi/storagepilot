import { create } from 'zustand';
import type { StorageObject } from '../api/types';

export type DetailTab = 'metadata' | 'preview' | 'versions';
export type AppSection = 'explorer' | 'developer-tools';

interface UiState {
  detailPanelOpen: boolean;
  detailTab: DetailTab;
  selectedObject: StorageObject | null;

  activityDrawerOpen: boolean;
  activityDrawerHeight: number;
  activityFilter: 'all' | 'success' | 'error';
  activitySearch: string;
  expandedActivityId: string | null;

  notFound: boolean;
  notFoundMessage: string | null;
  sessionConnectionLost: boolean;

  selectedBucketInList: string | null;
  bucketDetailPanelOpen: boolean;
  propertiesPanelOpen: boolean;

  appSection: AppSection;

  openDetail: (object: StorageObject, tab?: DetailTab) => void;
  closeDetail: () => void;
  setDetailTab: (tab: DetailTab) => void;

  setActivityDrawerOpen: (open: boolean) => void;
  toggleActivityDrawer: () => void;
  setActivityDrawerHeight: (height: number) => void;
  setActivityFilter: (filter: UiState['activityFilter']) => void;
  setActivitySearch: (q: string) => void;
  setExpandedActivityId: (id: string | null) => void;

  setNotFound: (found: boolean, message?: string | null) => void;
  setSessionConnectionLost: (lost: boolean) => void;
  setSelectedBucketInList: (name: string | null) => void;
  setBucketDetailPanelOpen: (open: boolean) => void;
  closeBucketDetail: () => void;
  openBucketDetail: (name: string) => void;
  closePropertiesPanel: () => void;
  openPropertiesPanel: () => void;
  setAppSection: (section: AppSection) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  detailPanelOpen: false,
  detailTab: 'metadata',
  selectedObject: null,

  activityDrawerOpen: false,
  activityDrawerHeight: 160,
  activityFilter: 'all',
  activitySearch: '',
  expandedActivityId: null,

  notFound: false,
  notFoundMessage: null,
  sessionConnectionLost: false,

  selectedBucketInList: null,
  bucketDetailPanelOpen: true,
  propertiesPanelOpen: true,

  appSection: 'explorer',

  openDetail: (object, tab = 'metadata') =>
    set({ selectedObject: object, detailPanelOpen: true, detailTab: tab, propertiesPanelOpen: false }),

  closeDetail: () =>
    set({ detailPanelOpen: false, selectedObject: null, propertiesPanelOpen: true }),

  setDetailTab: (detailTab) => set({ detailTab }),

  setActivityDrawerOpen: (activityDrawerOpen) => set({ activityDrawerOpen }),
  toggleActivityDrawer: () => set((s) => ({ activityDrawerOpen: !s.activityDrawerOpen })),
  setActivityDrawerHeight: (activityDrawerHeight) =>
    set({ activityDrawerHeight: Math.min(480, Math.max(96, activityDrawerHeight)) }),

  setActivityFilter: (activityFilter) => set({ activityFilter }),
  setActivitySearch: (activitySearch) => set({ activitySearch }),
  setExpandedActivityId: (expandedActivityId) => set({ expandedActivityId }),

  setNotFound: (notFound, message = null) => set({ notFound, notFoundMessage: message }),
  setSessionConnectionLost: (sessionConnectionLost) => set({ sessionConnectionLost }),
  setSelectedBucketInList: (selectedBucketInList) => set({ selectedBucketInList }),
  setBucketDetailPanelOpen: (bucketDetailPanelOpen) => set({ bucketDetailPanelOpen }),
  closeBucketDetail: () => set({ bucketDetailPanelOpen: false }),
  openBucketDetail: (name) => set({ selectedBucketInList: name, bucketDetailPanelOpen: true }),
  closePropertiesPanel: () => set({ propertiesPanelOpen: false }),
  openPropertiesPanel: () => set({ propertiesPanelOpen: true }),
  setAppSection: (appSection) => set({ appSection }),
}));

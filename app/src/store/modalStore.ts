import { create } from 'zustand';
import type { ProviderType } from '../api/types';

export type ModalId =
  | 'connection'
  | 'newBucket'
  | 'upload'
  | 'copyMove'
  | 'stats'
  | 'cors'
  | 'fakeData'
  | 'snippet'
  | 'exportImport'
  | 'shortcuts'
  | 'bulkConfirm'
  | 'newFolder'
  | 'commandPalette'
  | 'devTools'
  | 'permissions'
  | 'performanceMetrics'
  | 'about';

export interface ModalPayloads {
  connection: { profileId?: string; tab?: ProviderType; mode?: 'create' | 'edit' };
  newBucket: Record<string, never>;
  upload: Record<string, never>;
  copyMove: { operation: 'copy' | 'move'; keys: string[]; sizes?: number[] };
  stats: { bucket: string };
  cors: { bucket?: string };
  fakeData: { bucket?: string };
  snippet: { bucket: string; key: string; profileId?: string; operation?: 'download' | 'upload' | 'list' | 'delete' };
  exportImport: { tab?: 'export' | 'import'; buckets?: string[] };
  shortcuts: Record<string, never>;
  bulkConfirm: {
    count: number;
    label: string;
    onConfirm: () => void | Promise<void>;
    confirmLabel?: string;
    loadingLabel?: string;
  };
  newFolder: { bucket: string; prefix: string };
  commandPalette: Record<string, never>;
  devTools: Record<string, never>;
  permissions: { bucket: string };
  performanceMetrics: Record<string, never>;
  about: Record<string, never>;
}

type OpenModal = <K extends ModalId>(id: K, payload?: ModalPayloads[K]) => void;

interface ModalState {
  active: Partial<{ [K in ModalId]: ModalPayloads[K] | true }>;
  openModal: OpenModal;
  closeModal: (id: ModalId) => void;
  closeAll: () => void;
  isOpen: (id: ModalId) => boolean;
}

export const useModalStore = create<ModalState>()((set, get) => ({
  active: {},

  openModal: (id, payload) =>
    set((s) => ({
      active: { ...s.active, [id]: payload ?? true },
    })),

  closeModal: (id) =>
    set((s) => {
      const next = { ...s.active };
      delete next[id];
      return { active: next };
    }),

  closeAll: () => set({ active: {} }),

  isOpen: (id) => id in get().active,
}));

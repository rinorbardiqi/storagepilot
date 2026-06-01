import { create } from 'zustand';
import { assertUploadBlob } from '../lib/uploadBody';
import { useAppStore } from './appStore';
import { useConnectionStore } from './connectionStore';

export interface UploadItem {
  id: string;
  file: File;
  bucket: string;
  key: string;
  contentType: string;
  status: 'staged' | 'uploading' | 'done' | 'error';
  progress: number;
  bytesUploaded: number;
  error?: string;
}

interface UploadState {
  queue: UploadItem[];
  addToQueue: (items: UploadItem[]) => void;
  updateItem: (id: string, updates: Partial<UploadItem>) => void;
  removeItem: (id: string) => void;
  clearCompleted: () => void;
  processUploads: (options?: { bucket?: string }) => Promise<{ uploaded: number; failed: number }>;
}

export const useUploadStore = create<UploadState>()((set, get) => ({
  queue: [],

  addToQueue: (items) => set((s) => ({ queue: [...s.queue, ...items] })),

  updateItem: (id, updates) =>
    set((s) => ({
      queue: s.queue.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    })),

  removeItem: (id) => set((s) => ({ queue: s.queue.filter((i) => i.id !== id) })),

  clearCompleted: () => set((s) => ({ queue: s.queue.filter((i) => i.status !== 'done') })),

  processUploads: async (options) => {
    const provider = useConnectionStore.getState().getActiveProvider();
    if (!provider) return { uploaded: 0, failed: 0 };

    const items = get().queue.filter(
      (i) => i.status === 'staged' && (!options?.bucket || i.bucket === options.bucket),
    );

    let uploaded = 0;
    let failed = 0;

    for (const item of items) {
      if (!(item.file instanceof Blob)) {
        get().updateItem(item.id, {
          status: 'error',
          error: 'File object was lost — remove and re-add the file.',
        });
        failed++;
        continue;
      }

      get().updateItem(item.id, { status: 'uploading' });
      try {
        assertUploadBlob(item.file);
        await provider.uploadObject(item.bucket, item.key, item.file as File, {
          contentType: item.contentType,
          onProgress: (p, bytes) =>
            get().updateItem(item.id, { progress: p, bytesUploaded: bytes, status: 'uploading' }),
        });
        get().updateItem(item.id, { status: 'done', progress: 100 });
        uploaded++;
      } catch (err) {
        get().updateItem(item.id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed',
        });
        failed++;
      }
    }

    if (uploaded > 0) {
      useAppStore.getState().invalidateObjects();
    }

    return { uploaded, failed };
  },
}));

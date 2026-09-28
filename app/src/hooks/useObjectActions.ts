import { useCallback } from 'react';
import { downloadAsZip } from '../lib/zip';
import { downloadBlob, filenameFromKey } from '../lib/download';
import { useAppStore } from '../store/appStore';
import { useConnectionStore } from '../store/connectionStore';
import { useModalStore } from '../store/modalStore';
import { useSelectionStore } from '../store/selectionStore';
import { useUiStore } from '../store/uiStore';
import { useToast } from './useToast';

export function useObjectActions(onRefresh?: () => void) {
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const toast = useToast();
  const openModal = useModalStore((s) => s.openModal);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const invalidateObjects = useAppStore((s) => s.invalidateObjects);
  // Callers like the detail panel pass no refresh; still reload the listing after changes.
  const refreshList = onRefresh ?? invalidateObjects;

  const downloadOne = useCallback(
    async (key: string) => {
      const provider = getActiveProvider();
      if (!provider || !currentBucket) return;
      try {
        const blob = await provider.getObject(currentBucket, key);
        downloadBlob(blob, filenameFromKey(key));
        toast.success('Download started');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Download failed');
      }
    },
    [getActiveProvider, currentBucket, toast],
  );

  const downloadSelected = useCallback(
    async (keys: string[]) => {
      const provider = getActiveProvider();
      if (!provider || !currentBucket || !keys.length) return;
      try {
        const files = await Promise.all(
          keys.map(async (key) => ({
            key,
            blob: await provider.getObject(currentBucket, key),
          })),
        );
        await downloadAsZip(files, `${currentBucket}-objects.zip`);
        toast.success(`Downloaded ${keys.length} object(s)`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Bulk download failed');
      }
    },
    [getActiveProvider, currentBucket, toast],
  );

  const deleteOne = useCallback(
    (key: string) => {
      const provider = getActiveProvider();
      if (!provider || !currentBucket) return;
      openModal('bulkConfirm', {
        count: 1,
        label: `Delete "${key}"?`,
        onConfirm: () => {
          void (async () => {
            try {
              const [meta, blob] = await Promise.all([
                provider.getObjectMetadata(currentBucket, key).catch(() => null),
                provider.getObject(currentBucket, key),
              ]);
              const filename = key.split('/').pop() ?? key;
              const contentType =
                meta?.contentType ?? (blob.type || 'application/octet-stream');
              const file = new File([blob], filename, { type: contentType });

              await provider.deleteObject(currentBucket, key);
              toast.undo('Object deleted', async () => {
                await provider.uploadObject(currentBucket, key, file, {
                  contentType,
                  customMetadata: meta?.customMetadata,
                });
                refreshList();
              });
              const ui = useUiStore.getState();
              if (ui.selectedObject?.key === key) ui.closeDetail();
              refreshList();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Delete failed');
            }
          })();
        },
      });
    },
    [getActiveProvider, currentBucket, openModal, toast, refreshList],
  );

  const deleteSelected = useCallback(
    (keys: string[]) => {
      const provider = getActiveProvider();
      if (!provider || !currentBucket || !keys.length) return;
      openModal('bulkConfirm', {
        count: keys.length,
        label: `Delete ${keys.length} object${keys.length !== 1 ? 's' : ''}? This cannot be undone.`,
        onConfirm: () => {
          void (async () => {
            // Keep going past failures so one bad key doesn't strand the rest,
            // and always refresh — some objects may already be gone.
            let deleted = 0;
            let lastError: unknown;
            for (const key of keys) {
              try {
                await provider.deleteObject(currentBucket, key);
                deleted++;
              } catch (err) {
                lastError = err;
              }
            }
            clearSelection();
            refreshList();
            const failed = keys.length - deleted;
            if (failed === 0) {
              toast.success(`Deleted ${deleted} object(s)`);
            } else {
              const reason = lastError instanceof Error ? `: ${lastError.message}` : '';
              toast.error(`Deleted ${deleted} of ${keys.length}; ${failed} failed${reason}`);
            }
          })();
        },
      });
    },
    [getActiveProvider, currentBucket, openModal, toast, refreshList, clearSelection],
  );

  return { downloadOne, downloadSelected, deleteOne, deleteSelected };
}

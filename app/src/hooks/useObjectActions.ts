import { useCallback } from 'react';
import { downloadAsZip } from '../lib/zip';
import { downloadBlob, filenameFromKey } from '../lib/download';
import { useAppStore } from '../store/appStore';
import { useConnectionStore } from '../store/connectionStore';
import { useModalStore } from '../store/modalStore';
import { useSelectionStore } from '../store/selectionStore';
import { useToast } from './useToast';

export function useObjectActions(onRefresh?: () => void) {
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const toast = useToast();
  const openModal = useModalStore((s) => s.openModal);
  const clearSelection = useSelectionStore((s) => s.clearSelection);

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
                onRefresh?.();
              });
              onRefresh?.();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Delete failed');
            }
          })();
        },
      });
    },
    [getActiveProvider, currentBucket, openModal, toast, onRefresh],
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
            try {
              for (const key of keys) {
                await provider.deleteObject(currentBucket, key);
              }
              clearSelection();
              toast.success(`Deleted ${keys.length} object(s)`);
              onRefresh?.();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Bulk delete failed');
            }
          })();
        },
      });
    },
    [getActiveProvider, currentBucket, openModal, toast, onRefresh, clearSelection],
  );

  return { downloadOne, downloadSelected, deleteOne, deleteSelected };
}

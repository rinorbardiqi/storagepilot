import { useCallback } from 'react';
import { deleteBucketWithContents } from '../api/providerHelpers';
import { useConnectionStore } from '../store/connectionStore';
import { useModalStore } from '../store/modalStore';
import { useToast } from './useToast';

export function useDeleteBucket() {
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const openModal = useModalStore((s) => s.openModal);
  const toast = useToast();

  const confirmDeleteBucket = useCallback(
    (bucketName: string, onSuccess: () => void | Promise<void>) => {
      const provider = getActiveProvider();
      if (!provider) return;

      openModal('bulkConfirm', {
        count: 1,
        label: `Delete bucket "${bucketName}" and all its objects? This cannot be undone.`,
        onConfirm: () => {
          openModal('bulkConfirm', {
            count: 1,
            label: `Are you sure you want to delete all files in "${bucketName}"? This cannot be undone.`,
            confirmLabel: 'Delete all files',
            loadingLabel: `Deleting "${bucketName}" and all its files…`,
            onConfirm: async () => {
              try {
                await deleteBucketWithContents(provider, bucketName);
                toast.success(`Bucket "${bucketName}" deleted`);
                await onSuccess();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed to delete bucket');
                throw err;
              }
            },
          });
        },
      });
    },
    [getActiveProvider, openModal, toast],
  );

  return { confirmDeleteBucket };
}

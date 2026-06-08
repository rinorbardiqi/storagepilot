import { useCallback } from 'react';
import { deleteBucketWithContents } from '../api/providerHelpers';
import { useConnectionStore } from '../store/connectionStore';
import { useModalStore } from '../store/modalStore';
import { useToast } from './useToast';

function deleteConfirmCopy(bucketNames: string[]) {
  const count = bucketNames.length;
  if (count === 1) {
    const name = bucketNames[0]!;
    return {
      count: 1,
      label: `Delete bucket "${name}" and all its objects? This cannot be undone.`,
      confirmLabel: 'Delete bucket',
      loadingLabel: `Deleting "${name}" and all its objects…`,
    };
  }
  return {
    count,
    label: `Delete ${count} buckets and all their objects? This cannot be undone.`,
    confirmLabel: `Delete ${count} buckets`,
    loadingLabel: `Deleting ${count} buckets and all their objects…`,
  };
}

export function useDeleteBucket() {
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const openModal = useModalStore((s) => s.openModal);
  const toast = useToast();

  const confirmDeleteBuckets = useCallback(
    (bucketNames: string[], onSuccess: () => void | Promise<void>) => {
      const unique = [...new Set(bucketNames)];
      if (!unique.length) return;

      const provider = getActiveProvider();
      if (!provider) return;

      const copy = deleteConfirmCopy(unique);

      openModal('bulkConfirm', {
        ...copy,
        onConfirm: async () => {
          const failed: string[] = [];
          for (const name of unique) {
            try {
              await deleteBucketWithContents(provider, name);
            } catch {
              failed.push(name);
            }
          }

          const deleted = unique.length - failed.length;
          if (deleted === 0) {
            toast.error(
              failed.length === 1
                ? `Failed to delete bucket "${failed[0]}"`
                : 'Failed to delete selected buckets',
            );
            throw new Error('bucket delete failed');
          }

          if (failed.length > 0) {
            toast.error(
              `Deleted ${deleted} bucket${deleted !== 1 ? 's' : ''}; failed: ${failed.join(', ')}`,
            );
          } else if (deleted === 1) {
            toast.success(`Bucket "${unique[0]}" deleted`);
          } else {
            toast.success(`Deleted ${deleted} buckets`);
          }

          await onSuccess();
        },
      });
    },
    [getActiveProvider, openModal, toast],
  );

  const confirmDeleteBucket = useCallback(
    (bucketName: string, onSuccess: () => void | Promise<void>) => {
      confirmDeleteBuckets([bucketName], onSuccess);
    },
    [confirmDeleteBuckets],
  );

  return { confirmDeleteBucket, confirmDeleteBuckets };
}

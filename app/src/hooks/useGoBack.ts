import { useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { useSelectionStore } from '../store/selectionStore';
import { useUiStore } from '../store/uiStore';

export function useGoBack() {
  const currentPrefix = useAppStore((s) => s.currentPrefix);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const navigateUp = useAppStore((s) => s.navigateUp);
  const setCurrentBucket = useAppStore((s) => s.setCurrentBucket);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const closeDetail = useUiStore((s) => s.closeDetail);

  const canGoBack = Boolean(currentPrefix || currentBucket);

  const backLabel = currentPrefix
    ? 'Back to parent folder'
    : currentBucket
      ? 'Back to buckets'
      : 'Back';

  const goBack = useCallback(() => {
    if (currentPrefix) {
      navigateUp();
      clearSelection();
      return;
    }
    if (currentBucket) {
      setCurrentBucket(null);
      clearSelection();
      closeDetail();
    }
  }, [currentPrefix, currentBucket, navigateUp, setCurrentBucket, clearSelection, closeDetail]);

  return { goBack, canGoBack, backLabel };
}

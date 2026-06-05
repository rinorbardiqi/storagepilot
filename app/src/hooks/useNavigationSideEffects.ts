import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { useConnectionStore } from '../store/connectionStore';
import { useSelectionStore } from '../store/selectionStore';
import { useUiStore } from '../store/uiStore';

/**
 * Clears transient UI state whenever the user navigates to a different bucket,
 * prefix, or connection profile so stale selections and detail panels never
 * bleed across contexts.
 */
export function useNavigationSideEffects() {
  const currentBucket = useAppStore((s) => s.currentBucket);
  const currentPrefix = useAppStore((s) => s.currentPrefix);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);

  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const closeDetail = useUiStore((s) => s.closeDetail);

  const prev = useRef({ currentBucket, currentPrefix, activeProfileId });

  useEffect(() => {
    const p = prev.current;
    const bucketChanged = p.currentBucket !== currentBucket;
    const prefixChanged = p.currentPrefix !== currentPrefix;
    const profileChanged = p.activeProfileId !== activeProfileId;

    if (bucketChanged || profileChanged) {
      clearSelection();
      closeDetail();
    } else if (prefixChanged) {
      clearSelection();
      closeDetail();
    }

    prev.current = { currentBucket, currentPrefix, activeProfileId };
  }, [currentBucket, currentPrefix, activeProfileId, clearSelection, closeDetail]);
}

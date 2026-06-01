import { useEffect } from 'react';
import { useGoBack } from './useGoBack';
import { useAppStore } from '../store/appStore';
import { useModalStore } from '../store/modalStore';
import { useSelectionStore } from '../store/selectionStore';
import { useUiStore } from '../store/uiStore';

export function useKeyboard() {
  const { goBack, canGoBack } = useGoBack();
  const setViewMode = useAppStore((s) => s.setViewMode);
  const viewMode = useAppStore((s) => s.viewMode);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const openModal = useModalStore((s) => s.openModal);
  const closeAll = useModalStore((s) => s.closeAll);
  const closeDetail = useUiStore((s) => s.closeDetail);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA'].includes(tag) && e.key !== 'Escape') return;

      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        openModal('commandPalette');
      }
      if (e.key === 'u') openModal('upload');
      if (e.key === 'n') openModal('newBucket');
      if (e.key === '?') openModal('shortcuts');
      if (e.key === 'Escape') {
        closeAll();
        closeDetail();
        clearSelection();
      }
      if (e.key === 'Backspace' && tag !== 'INPUT' && canGoBack) {
        e.preventDefault();
        goBack();
      }
      if (e.key === 't') setViewMode(viewMode === 'table' ? 'grid' : 'table');
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    goBack,
    canGoBack,
    clearSelection,
    closeDetail,
    closeAll,
    setViewMode,
    viewMode,
    openModal,
  ]);
}

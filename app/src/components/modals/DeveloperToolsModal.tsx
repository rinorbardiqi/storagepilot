import { useEffect } from 'react';
import { useModalStore } from '../../store/modalStore';
import { useUiStore } from '../../store/uiStore';

/** Redirects legacy devTools modal opens to the Developer Tools Hub view. */
export function DeveloperToolsModal() {
  const isOpen = useModalStore((s) => Boolean(s.active.devTools));
  const closeModal = useModalStore((s) => s.closeModal);
  const setAppSection = useUiStore((s) => s.setAppSection);

  useEffect(() => {
    if (!isOpen) return;
    setAppSection('developer-tools');
    closeModal('devTools');
  }, [isOpen, setAppSection, closeModal]);

  return null;
}

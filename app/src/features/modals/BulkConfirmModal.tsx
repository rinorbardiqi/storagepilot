import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useModalStore } from '../../store/modalStore';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';

export function BulkConfirmModal() {
  const active = useModalStore((s) => s.active.bulkConfirm);
  const closeModal = useModalStore((s) => s.closeModal);
  const payload = typeof active === 'object' ? active : undefined;
  const isOpen = Boolean(active);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) setLoading(false);
  }, [isOpen]);

  const handleClose = () => {
    if (loading) return;
    closeModal('bulkConfirm');
  };

  const handleConfirm = () => {
    if (!payload || loading) return;

    const result = payload.onConfirm();
    if (result instanceof Promise) {
      setLoading(true);
      void result
        .then(() => closeModal('bulkConfirm'))
        .catch(() => {
          // Caller shows error toast; keep modal open so the user can retry or cancel.
        })
        .finally(() => setLoading(false));
      return;
    }

    closeModal('bulkConfirm');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Confirm action"
      size="sm"
      footer={
        payload ? (
          <>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirm} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Deleting…
                </>
              ) : (
                payload.confirmLabel ?? 'Confirm'
              )}
            </Button>
          </>
        ) : undefined
      }
    >
      {payload &&
        (loading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Loader2 size={16} className="animate-spin shrink-0" />
            <span>{payload.loadingLabel ?? 'Working…'}</span>
          </div>
        ) : (
          <p className="text-sm">
            {payload.label || `Delete ${payload.count} object${payload.count !== 1 ? 's' : ''}?`}
          </p>
        ))}
    </Modal>
  );
}

import { useModalStore } from '../../store/modalStore';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';

export function BulkConfirmModal() {
  const active = useModalStore((s) => s.active.bulkConfirm);
  const closeModal = useModalStore((s) => s.closeModal);
  const payload = typeof active === 'object' ? active : undefined;
  const isOpen = Boolean(active);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => closeModal('bulkConfirm')}
      title="Confirm action"
      size="sm"
      footer={
        payload ? (
          <>
            <Button onClick={() => closeModal('bulkConfirm')}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                payload.onConfirm();
                closeModal('bulkConfirm');
              }}
            >
              Confirm
            </Button>
          </>
        ) : undefined
      }
    >
      {payload && (
        <p className="text-sm">
          {payload.label || `Delete ${payload.count} object${payload.count !== 1 ? 's' : ''}?`}
        </p>
      )}
    </Modal>
  );
}

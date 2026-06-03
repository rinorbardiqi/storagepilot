import { useModalStore } from '../../store/modalStore';
import { Modal } from '../shared/Modal';

export function PermissionsModal() {
  const active = useModalStore((s) => s.active.permissions);
  const closeModal = useModalStore((s) => s.closeModal);
  const payload = typeof active === 'object' ? active : undefined;

  return (
    <Modal
      isOpen={Boolean(active)}
      onClose={() => closeModal('permissions')}
      title={`Permissions — ${payload?.bucket ?? ''}`}
      size="lg"
    >
      <p className="text-sm text-[var(--text-muted)]">
        IAM-style bucket permissions are not available on local emulators. Use the provider console
        or CLI for production buckets.
      </p>
    </Modal>
  );
}

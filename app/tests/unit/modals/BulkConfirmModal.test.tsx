import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BulkConfirmModal } from '@/features/modals/BulkConfirmModal';
import { useModalStore } from '@/store/modalStore';

describe('BulkConfirmModal', () => {
  beforeEach(() => {
    useModalStore.setState({ active: {} });
  });

  it('renders confirmation message and calls onConfirm', async () => {
    const onConfirm = vi.fn();
    useModalStore.getState().openModal('bulkConfirm', {
      count: 2,
      label: 'Delete 2 objects?',
      onConfirm,
      confirmLabel: 'Delete',
    });

    render(<BulkConfirmModal />);
    expect(screen.getByText('Delete 2 objects?')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('does not render when closed', () => {
    render(<BulkConfirmModal />);
    expect(screen.queryByText('Confirm action')).not.toBeInTheDocument();
  });
});

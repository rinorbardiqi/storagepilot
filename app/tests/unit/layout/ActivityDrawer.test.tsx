import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ActivityDrawer } from '@/features/layout/ActivityDrawer';
import { useTransferStore } from '@/store/transferStore';
import { useUiStore } from '@/store/uiStore';

describe('ActivityDrawer', () => {
  beforeEach(() => {
    useUiStore.setState({
      activityDrawerOpen: true,
      activityDrawerTab: 'api',
      activityDrawerHeight: 160,
    });
    useTransferStore.setState({ jobs: [] });
  });

  it('switches to Transfers tab', async () => {
    useTransferStore.getState().createJob({
      kind: 'copy',
      label: 'Copy test',
      items: [{ key: 'file.txt', status: 'done' }],
    });
    useTransferStore.getState().finishJob(
      useTransferStore.getState().jobs[0]!.id,
      'done',
    );

    render(<ActivityDrawer />);
    await userEvent.click(screen.getByRole('button', { name: 'Transfers' }));
    expect(screen.getByText('Copy test')).toBeInTheDocument();
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { useTransferStore } from '@/store/transferStore';

describe('transferStore', () => {
  beforeEach(() => {
    useTransferStore.setState({ jobs: [] });
  });

  it('creates a job and tracks item updates', () => {
    const id = useTransferStore.getState().createJob({
      kind: 'copy',
      label: 'Copy 2 objects',
      items: [
        { key: 'a.txt', status: 'pending' },
        { key: 'b.txt', status: 'pending' },
      ],
    });

    expect(useTransferStore.getState().jobs[0]?.id).toBe(id);
    expect(useTransferStore.getState().jobs[0]?.status).toBe('running');

    useTransferStore.getState().updateItem(id, 'a.txt', { status: 'done' });
    useTransferStore.getState().updateItem(id, 'b.txt', { status: 'error', error: 'fail' });

    const job = useTransferStore.getState().jobs.find((j) => j.id === id);
    expect(job?.status).toBe('partial');
    expect(job?.progress.completed).toBe(2);
  });

  it('finishes job with explicit status', () => {
    const id = useTransferStore.getState().createJob({
      kind: 'upload',
      label: 'Upload',
      items: [{ key: 'x', status: 'done' }],
    });
    useTransferStore.getState().finishJob(id, 'done');
    expect(useTransferStore.getState().jobs.find((j) => j.id === id)?.status).toBe('done');
  });

  it('clears completed jobs', () => {
    const id = useTransferStore.getState().createJob({
      kind: 'export',
      label: 'Export',
      items: [{ key: 'bucket', status: 'pending' }],
    });
    useTransferStore.getState().finishJob(id, 'done');
    useTransferStore.getState().clearCompleted();
    expect(useTransferStore.getState().jobs).toHaveLength(0);
  });
});

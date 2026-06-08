import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TransferKind = 'upload' | 'copy' | 'move' | 'export' | 'import';

export type TransferStatus = 'queued' | 'running' | 'done' | 'partial' | 'error' | 'cancelled';

export type TransferItemStatus = 'pending' | 'running' | 'done' | 'error';

export interface TransferItemResult {
  key: string;
  destKey?: string;
  status: TransferItemStatus;
  error?: string;
}

export interface TransferJob {
  id: string;
  kind: TransferKind;
  status: TransferStatus;
  label: string;
  sourceProfileId?: string;
  destProfileId?: string;
  items: TransferItemResult[];
  progress: { completed: number; total: number };
  error?: string;
  startedAt: Date;
  finishedAt?: Date;
}

const MAX_COMPLETED = 50;

function isActive(job: TransferJob): boolean {
  return job.status === 'queued' || job.status === 'running';
}

function deriveJobStatus(items: TransferItemResult[]): TransferStatus {
  const done = items.filter((i) => i.status === 'done').length;
  const failed = items.filter((i) => i.status === 'error').length;
  const running = items.some((i) => i.status === 'running');
  if (running) return 'running';
  if (failed === 0 && done === items.length) return 'done';
  if (failed > 0 && done > 0) return 'partial';
  if (failed > 0) return 'error';
  return 'queued';
}

interface TransferState {
  jobs: TransferJob[];
  createJob: (job: Omit<TransferJob, 'id' | 'startedAt' | 'status' | 'progress'> & {
    id?: string;
    status?: TransferStatus;
    progress?: TransferJob['progress'];
  }) => string;
  updateItem: (jobId: string, key: string, updates: Partial<TransferItemResult>) => void;
  updateProgress: (jobId: string, completed: number) => void;
  finishJob: (jobId: string, status?: TransferStatus, error?: string) => void;
  clearCompleted: () => void;
  getActiveJobs: () => TransferJob[];
}

export const useTransferStore = create<TransferState>()(
  persist(
    (set, get) => ({
      jobs: [],

      createJob: (job) => {
        const id = job.id ?? crypto.randomUUID();
        const total = job.items.length;
        const newJob: TransferJob = {
          ...job,
          id,
          status: job.status ?? 'running',
          progress: job.progress ?? { completed: 0, total },
          startedAt: new Date(),
        };
        set((s) => {
          const active = s.jobs.filter(isActive);
          const completed = s.jobs.filter((j) => !isActive(j)).slice(0, MAX_COMPLETED - 1);
          return { jobs: [newJob, ...active, ...completed] };
        });
        return id;
      },

      updateItem: (jobId, key, updates) =>
        set((s) => ({
          jobs: s.jobs.map((j) => {
            if (j.id !== jobId) return j;
            const items = j.items.map((item) =>
              item.key === key ? { ...item, ...updates } : item,
            );
            const completed = items.filter((i) => i.status === 'done' || i.status === 'error').length;
            return {
              ...j,
              items,
              status: deriveJobStatus(items),
              progress: { ...j.progress, completed },
            };
          }),
        })),

      updateProgress: (jobId, completed) =>
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === jobId ? { ...j, progress: { ...j.progress, completed } } : j,
          ),
        })),

      finishJob: (jobId, status, error) =>
        set((s) => ({
          jobs: s.jobs.map((j) => {
            if (j.id !== jobId) return j;
            const finalStatus = status ?? deriveJobStatus(j.items);
            return {
              ...j,
              status: finalStatus,
              error,
              finishedAt: new Date(),
            };
          }),
        })),

      clearCompleted: () =>
        set((s) => ({ jobs: s.jobs.filter(isActive) })),

      getActiveJobs: () => get().jobs.filter(isActive),
    }),
    {
      name: 'storagepilot-transfers',
      partialize: (s) => ({
        jobs: s.jobs
          .filter((j) => !isActive(j))
          .slice(0, MAX_COMPLETED)
          .map((j) => ({
            ...j,
            startedAt: j.startedAt instanceof Date ? j.startedAt.toISOString() : j.startedAt,
            finishedAt:
              j.finishedAt instanceof Date
                ? j.finishedAt.toISOString()
                : j.finishedAt,
          })),
      }),
      merge: (persisted, current) => {
        const p = persisted as {
          jobs?: Array<
            Omit<TransferJob, 'startedAt' | 'finishedAt'> & {
              startedAt: string;
              finishedAt?: string;
            }
          >;
        } | undefined;
        if (!p?.jobs) return current;
        const restored = p.jobs.map((j) => ({
          ...j,
          startedAt: new Date(j.startedAt),
          finishedAt: j.finishedAt ? new Date(j.finishedAt) : undefined,
        }));
        const active = current.jobs.filter(isActive);
        return { ...current, jobs: [...active, ...restored] };
      },
    },
  ),
);

import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { formatTime } from '../../lib/formatDate';
import { useModalStore } from '../../store/modalStore';
import { useTransferStore, type TransferJob } from '../../store/transferStore';
import { Button } from '../shared/Button';

function itemIcon(status: TransferJob['items'][0]['status']) {
  switch (status) {
    case 'done':
      return <CheckCircle2 size={12} className="text-[var(--success)] shrink-0" />;
    case 'error':
      return <XCircle size={12} className="text-[var(--error)] shrink-0" />;
    case 'running':
      return <Loader2 size={12} className="text-[var(--accent)] animate-spin shrink-0" />;
    default:
      return <Circle size={12} className="text-[var(--text-muted)] shrink-0" />;
  }
}

function jobStatusLabel(job: TransferJob): string {
  switch (job.status) {
    case 'running':
      return 'Running';
    case 'queued':
      return 'Queued';
    case 'done':
      return 'Done';
    case 'partial':
      return 'Partial';
    case 'error':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return job.status;
  }
}

function jobStatusClass(job: TransferJob): string {
  switch (job.status) {
    case 'done':
      return 'text-[var(--success)]';
    case 'partial':
      return 'text-[var(--warning)]';
    case 'error':
      return 'text-[var(--error)]';
    case 'running':
      return 'text-[var(--accent)]';
    default:
      return 'text-[var(--text-muted)]';
  }
}

export function TransferJobsList() {
  const jobs = useTransferStore((s) => s.jobs);
  const clearCompleted = useTransferStore((s) => s.clearCompleted);
  const openModal = useModalStore((s) => s.openModal);

  const active = jobs.filter((j) => j.status === 'queued' || j.status === 'running');
  const completed = jobs.filter((j) => j.status !== 'queued' && j.status !== 'running');

  if (jobs.length === 0) {
    return (
      <p className="px-2 py-3 text-[10px] text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
        No transfer jobs yet — uploads, copy/move, and import/export operations appear here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-2">
      {active.length > 0 && (
        <section>
          <p className="px-2 mb-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Active ({active.length})
          </p>
          {active.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </section>
      )}
      {completed.length > 0 && (
        <section>
          <div className="flex items-center justify-between px-2 mb-1">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Completed ({completed.length})
            </p>
            <Button
              onClick={() =>
                openModal('bulkConfirm', {
                  count: completed.length,
                  label: `Clear ${completed.length} completed transfer job(s)?`,
                  confirmLabel: 'Clear',
                  onConfirm: clearCompleted,
                })
              }
              className="!px-1.5 !py-0.5 !text-[9px]"
            >
              Clear
            </Button>
          </div>
          {completed.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </section>
      )}
    </div>
  );
}

function JobCard({ job }: { job: TransferJob }) {
  const pct =
    job.progress.total > 0
      ? Math.round((job.progress.completed / job.progress.total) * 100)
      : 0;

  return (
    <div className="mb-2 border border-[var(--border)] bg-[var(--bg-base)] rounded-[var(--radius)]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
        <span
          className={`text-[9px] font-semibold uppercase tracking-wider ${jobStatusClass(job)}`}
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {job.kind} · {jobStatusLabel(job)}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] ml-auto" style={{ fontFamily: 'var(--font-mono)' }}>
          {formatTime(job.startedAt)}
        </span>
      </div>
      <div className="px-3 py-2">
        <p className="text-[10px] text-[var(--text-primary)] truncate mb-2" title={job.label}>
          {job.label}
        </p>
        {(job.status === 'running' || job.status === 'queued') && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-1 bg-[var(--bg-elevated)] overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-[var(--text-muted)]">
              {job.progress.completed}/{job.progress.total}
            </span>
          </div>
        )}
        {job.error && (
          <p className="text-[9px] text-[var(--error)] mb-2 break-all">{job.error}</p>
        )}
        <ul className="max-h-32 overflow-y-auto space-y-0.5">
          {job.items.slice(0, 20).map((item) => (
            <li key={item.key} className="flex items-center gap-2 text-[9px] font-mono">
              {itemIcon(item.status)}
              <span className="truncate text-[var(--text-code)]" title={item.destKey ?? item.key}>
                {item.destKey ?? item.key}
              </span>
              {item.error && (
                <span className="text-[var(--error)] truncate ml-auto" title={item.error}>
                  {item.error}
                </span>
              )}
            </li>
          ))}
          {job.items.length > 20 && (
            <li className="text-[9px] text-[var(--text-muted)] pl-5">
              …and {job.items.length - 20} more
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

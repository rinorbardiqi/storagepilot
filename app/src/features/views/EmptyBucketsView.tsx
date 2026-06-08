import { Code2, Database, Plus, Terminal } from 'lucide-react';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import {
  SNIPPET_PLACEHOLDER_BUCKET,
  SNIPPET_PLACEHOLDER_KEY,
} from '../../lib/snippetTemplates';
import { Button } from '../shared/Button';

export function EmptyBucketsView() {
  const openModal = useModalStore((s) => s.openModal);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 py-16 gap-6">
      <div className="relative">
        <div className="size-32 rounded-lg border-2 border-dashed border-[var(--border)] flex items-center justify-center bg-[var(--bg-surface)]">
          <Database size={40} className="text-[var(--text-muted)]" strokeWidth={1.25} />
        </div>
        <span className="absolute -bottom-1 -right-1 size-6 rounded-full bg-[var(--accent-create)] text-black flex items-center justify-center">
          <Plus size={14} strokeWidth={3} />
        </span>
      </div>

      <div className="text-center max-w-md">
        <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">No buckets yet</h3>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Buckets are top-level containers for your objects. Create one to start uploading files,
          organizing prefixes, and exploring storage APIs.
        </p>
      </div>

      <Button variant="accent" className="gap-2 h-10 px-6" onClick={() => openModal('newBucket')}>
        <Plus size={14} strokeWidth={3} />
        Create your first bucket
      </Button>

      <div className="flex items-center gap-4 w-full max-w-xs">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-[10px] uppercase text-[var(--text-muted)] tracking-widest">Or</span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="outline"
          className="gap-2 h-10 px-6"
          onClick={() =>
            openModal('snippet', {
              profileId: activeProfileId ?? undefined,
              bucket: SNIPPET_PLACEHOLDER_BUCKET,
              key: SNIPPET_PLACEHOLDER_KEY,
              operation: 'list',
            })
          }
        >
          <Code2 size={14} />
          SDK snippets
        </Button>
        <Button
          variant="outline"
          className="gap-2 h-10 px-6"
          onClick={() => openModal('fakeData')}
        >
          <Terminal size={14} />
          Generate mock data
        </Button>
      </div>

      <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
        Or use the Create Bucket button above
      </p>
    </div>
  );
}

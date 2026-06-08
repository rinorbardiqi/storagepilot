import {
  CloudUpload,
  Code2,
  Globe,
  Shield,
  Terminal,
  Upload,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useModalStore } from '../../store/modalStore';
import { Button } from '../shared/Button';

export function EmptyBucketView() {
  const openModal = useModalStore((s) => s.openModal);
  const currentBucket = useAppStore((s) => s.currentBucket);

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 py-16 gap-6 bg-[var(--bg-base)]">
      <div className="relative">
        <div className="size-32 rounded-lg border-2 border-dashed border-[var(--border)] flex items-center justify-center">
          <CloudUpload size={40} className="text-[var(--text-muted)]" strokeWidth={1.25} />
        </div>
        <span className="absolute -bottom-1 -right-1 size-6 rounded-full bg-[var(--accent)] text-[var(--bg-base)] flex items-center justify-center text-sm font-bold">
          +
        </span>
      </div>

      <div className="text-center max-w-md">
        <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">Bucket is Empty</h3>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Start by uploading files or creating a folder structure. You can also drag and drop files
          directly into this window.
        </p>
      </div>

      <Button variant="accent" className="gap-2 h-10 px-6" onClick={() => openModal('upload')}>
        <Upload size={14} />
        Upload First File
      </Button>

      <div className="flex items-center gap-4 w-full max-w-xs">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-[10px] uppercase text-[var(--text-muted)] tracking-widest">Or</span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      <Button
        variant="outline"
        className="gap-2 h-10 px-6"
        onClick={() => openModal('fakeData')}
      >
        <Terminal size={14} />
        Generate Mock Data
      </Button>

      <div className="grid grid-cols-3 gap-3 w-full max-w-lg mt-4">
        {[
          { icon: Code2, label: 'SDK Snippet', modal: 'snippet' as const },
          { icon: Shield, label: 'Set ACLs', modal: 'permissions' as const },
          { icon: Globe, label: 'CORS Config', modal: 'cors' as const },
        ].map(({ icon: Icon, label, modal }) => (
          <button
            key={label}
            type="button"
            className="flex flex-col items-center gap-2 p-4 border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors"
            onClick={() => {
              if (!currentBucket) return;
              if (modal === 'snippet') {
                openModal('snippet', { bucket: currentBucket, key: 'path/to/object' });
                return;
              }
              if (modal === 'cors') {
                openModal('cors', { bucket: currentBucket });
                return;
              }
              if (modal === 'permissions') {
                openModal('permissions', { bucket: currentBucket });
                return;
              }
              openModal(modal);
            }}
          >
            <Icon size={16} className="text-[var(--accent)]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

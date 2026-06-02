import { useEffect, useState } from 'react';
import { ArrowRightLeft, File, Folder, FolderOpen } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { useBuckets } from '../../hooks/useBuckets';
import { useToast } from '../../hooks/useToast';
import { Modal } from '../shared/Modal';

export function CopyMoveModal() {
  const active = useModalStore((s) => s.active.copyMove);
  const closeModal = useModalStore((s) => s.closeModal);
  const payload = typeof active === 'object' ? active : undefined;
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const profiles = useConnectionStore((s) => s.profiles);
  const profile = profiles.find((p) => p.id === activeProfileId);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const { buckets } = useBuckets();
  const toast = useToast();
  const [destBucket, setDestBucket] = useState('');
  const [destPrefix, setDestPrefix] = useState('/archive/2024/q2/');
  const [operation, setOperation] = useState<'copy' | 'move'>(payload?.operation ?? 'copy');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (payload) {
      setOperation(payload.operation);
      setDestBucket(currentBucket ?? '');
    }
  }, [payload, currentBucket]);

  const run = async () => {
    const provider = getActiveProvider();
    if (!provider || !currentBucket || !destBucket || !payload?.keys.length) return;
    setBusy(true);
    try {
      const prefix = destPrefix.replace(/^\//, '').replace(/\/$/, '') + '/';
      for (const key of payload.keys) {
        const filename = key.split('/').pop() ?? key;
        const dstKey = prefix + filename;
        const src = { bucket: currentBucket, key };
        const dst = { bucket: destBucket, key: dstKey };
        if (operation === 'copy') await provider.copyObject(src, dst);
        else await provider.moveObject(src, dst);
      }
      toast.success(`${operation === 'copy' ? 'Copied' : 'Moved'} ${payload.keys.length} object(s)`);
      closeModal('copyMove');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${operation} failed`);
    } finally {
      setBusy(false);
    }
  };

  const firstKey = payload?.keys[0];
  const firstName = firstKey?.split('/').pop() ?? '';
  const providerLabel = profile?.type === 'gcs' ? 'GCS' : profile?.type === 's3' ? 'S3' : 'Azure';
  const pathParts = destPrefix.replace(/^\//, '').split('/').filter(Boolean);

  return (
    <Modal
      isOpen={Boolean(active)}
      onClose={() => closeModal('copyMove')}
      title="Copy / Move Objects"
      size="xl"
      headerIcon={<ArrowRightLeft size={18} className="text-[var(--accent-copy)]" />}
      footer={
        <>
          <button
            type="button"
            className="text-xs uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            onClick={() => closeModal('copyMove')}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!destBucket || busy}
            onClick={() => void run()}
            className="h-10 px-8 bg-[var(--accent-copy)] text-black text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Working…' : operation === 'copy' ? 'Confirm Copy' : 'Confirm Move'}
          </button>
        </>
      }
    >
      <div className="flex justify-end mb-4">
        <div className="inline-flex border border-[var(--border)] p-0.5 bg-[var(--bg-base)]">
          {(['copy', 'move'] as const).map((op) => (
            <button
              key={op}
              type="button"
              className={`px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                operation === op
                  ? 'bg-[var(--accent-copy)] text-black'
                  : 'text-[var(--accent-copy)] hover:bg-[var(--accent-copy)]/10'
              }`}
              onClick={() => setOperation(op)}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Selected Objects
          </p>
          {firstKey && (
            <div className="flex items-center justify-between p-3 bg-[var(--bg-base)] border border-[var(--border)]">
              <div className="flex items-center gap-2 min-w-0">
                <File size={14} className="text-[var(--accent)] shrink-0" />
                <span className="font-mono text-xs truncate">{firstName}</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] px-2 py-0.5 border border-[var(--border)]">
                {payload?.keys.length === 1 ? '1.24 MB' : `${payload?.keys.length} files`}
              </span>
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
            Destination
          </p>
          <label className="text-xs text-[var(--text-muted)] mb-1 block">Provider & Bucket</label>
          <select
            className="w-full h-10 px-3 mb-3 font-mono text-sm bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)]"
            value={destBucket}
            onChange={(e) => setDestBucket(e.target.value)}
          >
            <option value="">Select bucket</option>
            {buckets.map((b) => (
              <option key={b.name} value={b.name}>
                {providerLabel}: {b.name}
              </option>
            ))}
          </select>
          <label className="text-xs text-[var(--text-muted)] mb-1 block">Path</label>
          <div className="flex items-center h-10 px-3 border border-[var(--border)] bg-[var(--bg-base)]">
            <FolderOpen size={14} className="text-[var(--text-muted)] mr-2 shrink-0" />
            <input
              type="text"
              value={destPrefix}
              onChange={(e) => setDestPrefix(e.target.value)}
              className="flex-1 bg-transparent font-mono text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Destination Preview
          </p>
          <div className="p-4 bg-[var(--bg-base)] border border-[var(--border)] font-mono text-xs flex flex-col gap-1">
            {pathParts.map((part, i) => (
              <div key={i} className="flex items-center gap-2 pl-2" style={{ paddingLeft: i * 12 + 8 }}>
                <Folder size={12} className={i === pathParts.length - 1 ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
                <span className={i === pathParts.length - 1 ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}>
                  {part}
                </span>
              </div>
            ))}
            {firstName && (
              <div className="flex items-center gap-2 pl-2" style={{ paddingLeft: pathParts.length * 12 + 8 }}>
                <File size={12} className="text-[var(--success)]" />
                <span className="text-[var(--success)]">{firstName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

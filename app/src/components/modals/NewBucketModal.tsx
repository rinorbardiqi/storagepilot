import { useEffect, useMemo, useState } from 'react';
import { FolderPlus, History, Lock } from 'lucide-react';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { useToast } from '../../hooks/useToast';
import { useBuckets } from '../../hooks/useBuckets';
import { getBucketNameRules, sanitizeBucketName, validateBucketName } from '../../lib/bucketName';
import {
  BUCKET_ENCRYPTION_LABELS,
  BUCKET_LOCATIONS,
  BUCKET_STORAGE_CLASSES,
  bucketResourceLabel,
  providerScheme,
} from '../../lib/providerDisplay';
import type { ProviderType } from '../../api/types';
import { Modal } from '../shared/Modal';
import { Toggle } from '../shared/Toggle';

function defaultsForProvider(type: ProviderType) {
  return {
    storageClass: BUCKET_STORAGE_CLASSES[type][0]?.value ?? 'STANDARD',
    location: BUCKET_LOCATIONS[type][0]?.value ?? '',
  };
}

export function NewBucketModal() {
  const isOpen = useModalStore((s) => Boolean(s.active.newBucket));
  const closeModal = useModalStore((s) => s.closeModal);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const profiles = useConnectionStore((s) => s.profiles);
  const profile = profiles.find((p) => p.id === activeProfileId);
  const { refresh } = useBuckets();
  const toast = useToast();
  const providerType = profile?.type ?? 's3';
  const scheme = providerScheme(providerType);
  const rules = getBucketNameRules(providerType);
  const storageClasses = BUCKET_STORAGE_CLASSES[providerType];
  const locations = BUCKET_LOCATIONS[providerType];
  const encryptionLabel = BUCKET_ENCRYPTION_LABELS[providerType];
  const resourceLabel = bucketResourceLabel(providerType);

  const [name, setName] = useState('');
  const [storageClass, setStorageClass] = useState(defaultsForProvider(providerType).storageClass);
  const [location, setLocation] = useState(defaultsForProvider(providerType).location);
  const [versioning, setVersioning] = useState(true);
  const [encryption, setEncryption] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const defaults = defaultsForProvider(providerType);
    setName('');
    setStorageClass(defaults.storageClass);
    setLocation(defaults.location);
    setVersioning(true);
    setEncryption(false);
    setLoading(false);
  }, [isOpen, providerType]);

  const sanitized = useMemo(() => sanitizeBucketName(name), [name]);
  const validationError = useMemo(
    () => (sanitized ? validateBucketName(sanitized, providerType) : null),
    [sanitized, providerType],
  );

  const create = async () => {
    const provider = useConnectionStore.getState().getActiveProvider();
    if (!provider || !sanitized) return;
    const err = validateBucketName(sanitized, providerType);
    if (err) {
      toast.error(err);
      return;
    }
    setLoading(true);
    try {
      await provider.createBucket(sanitized, { enableVersioning: versioning, location });
      toast.success(`${resourceLabel.replace(' Name', '')} "${sanitized}" created`);
      await refresh();
      closeModal('newBucket');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create bucket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => closeModal('newBucket')}
      title="Create New Bucket"
      size="lg"
      headerIcon={
        <span className="p-1.5 bg-[var(--success)]/15 border border-[var(--success)]/30">
          <FolderPlus size={16} className="text-[var(--success)]" />
        </span>
      }
      footer={
        <>
          <button
            type="button"
            className="text-xs uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            onClick={() => closeModal('newBucket')}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !sanitized || Boolean(validationError)}
            onClick={() => void create()}
            className="h-10 px-8 bg-[var(--accent-create)] text-black text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
          >
            Create Bucket
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2 block">
            {resourceLabel}
          </label>
          <div className="flex h-10 border border-[var(--border)] bg-[var(--bg-base)] overflow-hidden">
            <span
              className="inline-flex items-center px-3 border-r border-[var(--border)] bg-[var(--bg-elevated)] font-mono text-sm text-[var(--text-muted)] shrink-0 select-none"
              aria-hidden
            >
              {scheme}://
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="unique-bucket-name"
              className="flex-1 min-w-0 px-3 bg-transparent font-mono text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
          </div>
          {sanitized && sanitized !== name.trim().toLowerCase() && (
            <p className="text-[10px] text-[var(--accent)] mt-1 font-mono">
              Will create as: {scheme}://{sanitized}
            </p>
          )}
          <p className={`text-[10px] mt-2 ${validationError ? 'text-[var(--error)]' : 'text-[var(--text-muted)]'}`}>
            {validationError ?? rules.hint}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2 block">
              Storage Class
            </label>
            <select
              value={storageClass}
              onChange={(e) => setStorageClass(e.target.value)}
              className="w-full h-10 px-3 font-mono text-sm bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)]"
            >
              {storageClasses.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2 block">
              Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-10 px-3 font-mono text-sm bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)]"
            >
              {locations.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <History size={18} className="text-[var(--accent)]" />
              <div>
                <p className="text-sm font-medium">Object Versioning</p>
                <p className="text-xs text-[var(--text-muted)]">Keep history of object changes</p>
              </div>
            </div>
            <Toggle checked={versioning} onChange={setVersioning} label="Versioning" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-[var(--success)]" />
              <div>
                <p className="text-sm font-medium">Encryption</p>
                <p className="text-xs text-[var(--text-muted)]">{encryptionLabel}</p>
              </div>
            </div>
            <Toggle checked={encryption} onChange={setEncryption} label="Encryption" />
          </div>
        </div>
      </div>
    </Modal>
  );
}

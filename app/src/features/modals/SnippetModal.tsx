import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { useToast } from '../../hooks/useToast';
import {
  generateSnippetForProfile,
  type SnippetLanguage,
  type SnippetOperation,
} from '../../lib/snippetTemplates';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';

const LANGS: SnippetLanguage[] = ['go', 'python', 'node', 'java', 'cli'];
const OPS: SnippetOperation[] = ['download', 'upload', 'list', 'delete'];

export function SnippetModal() {
  const active = useModalStore((s) => s.active.snippet);
  const closeModal = useModalStore((s) => s.closeModal);
  const payload = typeof active === 'object' ? active : undefined;
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const profiles = useConnectionStore((s) => s.profiles);
  const [lang, setLang] = useState<SnippetLanguage>('node');
  const [operation, setOperation] = useState<SnippetOperation>('download');
  const [profileId, setProfileId] = useState(activeProfileId ?? '');
  const toast = useToast();

  useEffect(() => {
    if (payload) {
      setProfileId(payload.profileId ?? activeProfileId ?? profiles[0]?.id ?? '');
      setOperation(payload.operation ?? 'download');
    }
  }, [payload, activeProfileId, profiles]);

  const profile = profiles.find((p) => p.id === profileId);
  const code =
    profile && payload
      ? generateSnippetForProfile(lang, profile, payload.bucket, payload.key, operation)
      : '';

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  return (
    <Modal
      isOpen={Boolean(active)}
      onClose={() => closeModal('snippet')}
      title="SDK snippet"
      size="xl"
      footer={
        <Button variant="outline" onClick={() => void copyCode()} disabled={!code}>
          <Copy size={14} />
          Copy
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1 block">
            Connection
          </label>
          <select
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
            className="w-full h-9 px-2 font-mono text-xs bg-[var(--bg-base)] border border-[var(--border)]"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.type})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1 block">
            Operation
          </label>
          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value as SnippetOperation)}
            className="w-full h-9 px-2 font-mono text-xs bg-[var(--bg-base)] border border-[var(--border)]"
          >
            {OPS.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-1 mb-3 border-b border-[var(--border)]">
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            className={`px-2 py-1 text-xs capitalize ${lang === l ? 'text-[var(--accent-gcs)]' : 'text-[var(--text-muted)]'}`}
            onClick={() => setLang(l)}
          >
            {l}
          </button>
        ))}
      </div>
      {payload && (
        <p className="text-[10px] font-mono text-[var(--text-muted)] mb-2 truncate">
          {profile?.type}://{payload.bucket}/{payload.key}
        </p>
      )}
      {code ? (
        <pre className="p-3 text-xs font-mono bg-[var(--bg-base)] border border-[var(--border)] rounded-[var(--radius)] overflow-auto whitespace-pre-wrap max-h-[60vh]">
          {code}
        </pre>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">
          Select or configure a connection to generate SDK snippets.
        </p>
      )}
      {operation !== 'download' && !['node', 'cli'].includes(lang) && (
        <p className="text-[10px] text-[var(--text-muted)] mt-2">
          Upload, list, and delete snippets are fully templated for Node and CLI. Other languages show
          download examples — switch to Node or CLI for this operation.
        </p>
      )}
    </Modal>
  );
}

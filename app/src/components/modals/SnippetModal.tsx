import { useState } from 'react';
import { Copy } from 'lucide-react';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { useToast } from '../../hooks/useToast';
import {
  generateSnippetForProfile,
  type SnippetLanguage,
} from '../../lib/snippetTemplates';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';

const LANGS: SnippetLanguage[] = ['go', 'python', 'node', 'java', 'cli'];

export function SnippetModal() {
  const active = useModalStore((s) => s.active.snippet);
  const closeModal = useModalStore((s) => s.closeModal);
  const payload = typeof active === 'object' ? active : undefined;
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const profiles = useConnectionStore((s) => s.profiles);
  const [lang, setLang] = useState<SnippetLanguage>('node');
  const toast = useToast();

  const profile = profiles.find((p) => p.id === activeProfileId);
  const code =
    profile && payload
      ? generateSnippetForProfile(lang, profile, payload.bucket, payload.key)
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
      {code ? (
        <pre className="p-3 text-xs font-mono bg-[var(--bg-base)] border border-[var(--border)] rounded-[var(--radius)] overflow-auto whitespace-pre-wrap max-h-[60vh]">
          {code}
        </pre>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">
          Select or configure a connection to generate SDK snippets.
        </p>
      )}
    </Modal>
  );
}

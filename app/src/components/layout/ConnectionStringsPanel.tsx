import { useState } from 'react';
import { ChevronDown, ChevronUp, Code2, Copy, ExternalLink, Plug } from 'lucide-react';
import type { ConnectionProfile } from '../../api/providerFactory';
import { useToast } from '../../hooks/useToast';
import {
  CONNECTION_SDK_LANGUAGE_LABELS,
  CONNECTION_SDK_LANGUAGES,
  getProviderConnectionInfo,
  type ConnectionSdkLanguage,
} from '../../lib/connectionStrings';
import {
  SNIPPET_PLACEHOLDER_BUCKET,
  SNIPPET_PLACEHOLDER_KEY,
} from '../../lib/snippetTemplates';
import { providerAccentVar } from '../../lib/providerAccent';
import { useModalStore } from '../../store/modalStore';
import { ProviderLogo } from '../shared/ProviderLogo';

function CopyButton({ value, label }: { value: string; label: string }) {
  const toast = useToast();

  return (
    <button
      type="button"
      className="shrink-0 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border)]"
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(
          () => toast.success('Copied to clipboard'),
          () => toast.error('Could not copy to clipboard'),
        );
      }}
    >
      <Copy size={11} />
    </button>
  );
}

function ActiveSdkConnectionCard({ profile }: { profile: ConnectionProfile }) {
  const accent = providerAccentVar(profile.type);
  const openModal = useModalStore((s) => s.openModal);
  const [language, setLanguage] = useState<ConnectionSdkLanguage>('node');
  const info = getProviderConnectionInfo(profile);
  const code = info.sdkSnippet(language);

  return (
    <div className="flex flex-col gap-2 px-1 pb-1">
      <div className="flex items-center gap-2">
        <ProviderLogo type={profile.type} size={14} variant="icon" />
        <span
          className="text-[10px] font-bold uppercase tracking-wider truncate"
          style={{ fontFamily: 'var(--font-ui)', color: accent }}
        >
          {profile.name}
        </span>
      </div>

      <div className="border border-[var(--border)] bg-[var(--bg-base)]">
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-[var(--border)] bg-[var(--bg-surface)]">
          <span
            className="text-[9px] uppercase tracking-wide text-[var(--text-muted)] shrink-0"
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            Endpoint
          </span>
          <code
            className="flex-1 min-w-0 text-[10px] text-[var(--text-primary)] truncate text-right"
            style={{ fontFamily: 'var(--font-mono)' }}
            title={info.endpoint}
          >
            {info.endpoint}
          </code>
          <CopyButton value={info.endpoint} label="endpoint" />
        </div>

        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[var(--border)] bg-[var(--bg-overlay)]">
          <Code2 size={10} className="text-[var(--text-muted)] shrink-0 mr-1" />
          {CONNECTION_SDK_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider border transition-colors ${
                language === lang
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)]'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {CONNECTION_SDK_LANGUAGE_LABELS[lang]}
            </button>
          ))}
          <div className="flex-1" />
          <CopyButton value={code} label="SDK snippet" />
        </div>

        <pre
          className="px-2.5 py-2 text-[10px] leading-[15px] text-[var(--text-code)] overflow-y-auto max-h-36 m-0 whitespace-pre-wrap break-all"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {code}
        </pre>
      </div>

      <button
        type="button"
        className="flex items-center gap-1.5 self-start px-1 text-[9px] uppercase tracking-wider text-[var(--accent)] hover:underline"
        onClick={() =>
          openModal('snippet', {
            profileId: profile.id,
            bucket: SNIPPET_PLACEHOLDER_BUCKET,
            key: SNIPPET_PLACEHOLDER_KEY,
          })
        }
      >
        <ExternalLink size={10} />
        Full SDK snippets
      </button>
    </div>
  );
}

interface ConnectionStringsPanelProps {
  profiles: ConnectionProfile[];
  activeProfileId: string | null;
}

export function ConnectionStringsPanel({ profiles, activeProfileId }: ConnectionStringsPanelProps) {
  const [open, setOpen] = useState(true);

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0] ?? null;

  if (!activeProfile) return null;

  return (
    <div className="mb-4">
      <button
        type="button"
        className="flex items-center justify-between w-full px-2 py-1.5 mb-2 group"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Plug size={11} className="text-[var(--text-muted)] shrink-0" />
          <span
            className="text-[10px] font-semibold uppercase tracking-[1px] text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            SDK Connection
          </span>
        </span>
        {open ? (
          <ChevronUp size={12} className="text-[var(--text-muted)] shrink-0" />
        ) : (
          <ChevronDown size={12} className="text-[var(--text-muted)] shrink-0" />
        )}
      </button>

      {open && <ActiveSdkConnectionCard key={activeProfile.id} profile={activeProfile} />}
    </div>
  );
}

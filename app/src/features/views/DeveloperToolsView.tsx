import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BarChart3,
  Code2,
  Database,
  FolderInput,
  Keyboard,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useBuckets } from '../../hooks/useBuckets';
import { usePerformanceMetrics } from '../../hooks/usePerformanceMetrics';
import {
  generateSnippetForProfile,
  SNIPPET_PLACEHOLDER_BUCKET,
  SNIPPET_PLACEHOLDER_KEY,
} from '../../lib/snippetTemplates';
import { useAppStore } from '../../store/appStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import type { CorsRule } from '../../api/types';

function MiniSparkline({ points }: { points: number[] }) {
  const max = Math.max(...points, 1);
  const w = 280;
  const h = 48;
  const coords = points
    .map((p, i) => `${(i / Math.max(points.length - 1, 1)) * w},${h - (p / max) * (h - 4) - 2}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12 mt-3">
      <polyline fill="none" stroke="var(--accent)" strokeWidth="2" points={coords} />
    </svg>
  );
}

interface ToolCardProps {
  icon: typeof BarChart3;
  iconClass: string;
  title: string;
  description: string;
  badge?: ReactNode;
  footer: React.ReactNode;
  onClick?: () => void;
  keywords: string[];
  search: string;
}

function ToolCard({
  icon: Icon,
  iconClass,
  title,
  description,
  badge,
  footer,
  onClick,
  keywords,
  search,
}: ToolCardProps) {
  const q = search.trim().toLowerCase();
  if (q && !title.toLowerCase().includes(q) && !keywords.some((k) => k.includes(q))) {
    return null;
  }

  return (
    <article
      className={`flex flex-col border border-[var(--border)] bg-[var(--bg-surface)] rounded-[var(--radius)] p-5 transition-colors ${
        onClick ? 'cursor-pointer hover:border-[var(--accent)]/40 hover:bg-[var(--bg-elevated)]' : ''
      }`}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`p-2.5 rounded-[var(--radius)] border border-[var(--border)] ${iconClass}`}>
          <Icon size={18} />
        </div>
        {badge}
      </div>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">{title}</h3>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed flex-1">{description}</p>
      <div className="mt-4 pt-4 border-t border-[var(--border)]">{footer}</div>
    </article>
  );
}

function useCorsPreview(bucket: string | null) {
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const [rules, setRules] = useState<CorsRule[] | null>(null);

  useEffect(() => {
    if (!bucket) {
      setRules(null);
      return;
    }
    const provider = useConnectionStore.getState().getActiveProvider();
    if (!provider) return;
    let cancelled = false;
    void provider
      .getCorsRules(bucket)
      .then((r) => {
        if (!cancelled) setRules(r);
      })
      .catch(() => {
        if (!cancelled) setRules([]);
      });
    return () => {
      cancelled = true;
    };
  }, [bucket, activeProfileId]);

  return rules;
}

export function DeveloperToolsView() {
  const [search, setSearch] = useState('');
  const openModal = useModalStore((s) => s.openModal);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const { buckets } = useBuckets();
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const profiles = useConnectionStore((s) => s.profiles);
  const profile = profiles.find((p) => p.id === activeProfileId);
  const metrics = usePerformanceMetrics();

  const previewBucket = currentBucket ?? buckets[0]?.name ?? null;
  const snippetBucket = previewBucket ?? SNIPPET_PLACEHOLDER_BUCKET;
  const corsRules = useCorsPreview(previewBucket);
  const corsPreview = corsRules?.[0];

  const snippetPreview = useMemo(() => {
    if (!profile) return '';
    const code = generateSnippetForProfile(
      'node',
      profile,
      snippetBucket,
      SNIPPET_PLACEHOLDER_KEY,
    );
    return code.split('\n')[0] ?? '';
  }, [profile, snippetBucket]);

  const cards = [
    {
      id: 'stats',
      icon: BarChart3,
      iconClass: 'text-[var(--accent)] bg-[var(--accent)]/10',
      title: 'Stats Dashboard',
      description: 'Real-time throughput, latency, and request distribution across emulators.',
      keywords: ['metrics', 'performance', 'latency', 'throughput'],
      badge: metrics.hasData ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30">
          <span className="size-1.5 rounded-full bg-[var(--success)] animate-pulse" />
          Live
        </span>
      ) : null,
      footer: <MiniSparkline points={metrics.timeline} />,
      onClick: () => openModal('performanceMetrics'),
    },
    {
      id: 'cors',
      icon: Shield,
      iconClass: 'text-[var(--accent)] bg-[var(--accent)]/10',
      title: 'CORS Editor',
      description: 'Configure Cross-Origin Resource Sharing policies for local buckets instantly.',
      keywords: ['cors', 'origin', 'headers'],
      footer: (
        <div className="font-mono text-[10px] text-[var(--text-muted)] space-y-1">
          <p>
            <span className="text-[var(--text-primary)]">Allowed Origins:</span>{' '}
            {corsPreview?.origins.join(', ') ?? '*'}
          </p>
          <p>
            <span className="text-[var(--accent)]">Methods:</span>{' '}
            {corsPreview?.methods.join(', ') ?? 'GET, HEAD'}
          </p>
        </div>
      ),
      onClick: () => openModal('cors', previewBucket ? { bucket: previewBucket } : {}),
    },
    {
      id: 'fake',
      icon: Database,
      iconClass: 'text-[var(--success)] bg-[var(--success)]/10',
      title: 'Fake Data Generator',
      description: 'Populate buckets with JSON, CSV, logs, SVG images, or binary blobs.',
      keywords: ['mock', 'generate', 'seed', 'test data', 'json', 'csv'],
      footer: (
        <div className="font-mono text-[10px] text-[var(--text-muted)] space-y-1">
          <p>
            <span className="text-[var(--text-primary)]">Types:</span> JSON · CSV · Text · SVG · Binary
          </p>
          <button
            type="button"
            className="w-full h-9 mt-2 bg-[var(--bg-base)] border border-[var(--border)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            onClick={(e) => {
              e.stopPropagation();
              openModal('fakeData', previewBucket ? { bucket: previewBucket } : {});
            }}
          >
            Generate Batch
          </button>
        </div>
      ),
      onClick: () => openModal('fakeData', previewBucket ? { bucket: previewBucket } : {}),
    },
    {
      id: 'snippet',
      icon: Code2,
      iconClass: 'text-[var(--warning)] bg-[var(--warning)]/10',
      title: 'SDK Snippets',
      description: 'Auto-generated connection code for Node.js, Python, and Go for the current emulator.',
      keywords: ['sdk', 'code', 'node', 'python', 'go'],
      footer: (
        <pre className="font-mono text-[10px] text-[var(--text-muted)] truncate bg-[var(--bg-base)] p-2 border border-[var(--border)]">
          {snippetPreview || '// Select a provider to preview snippets'}
        </pre>
      ),
      onClick: () =>
        openModal('snippet', { bucket: snippetBucket, key: SNIPPET_PLACEHOLDER_KEY }),
    },
    {
      id: 'snapshot',
      icon: FolderInput,
      iconClass: 'text-purple-400 bg-purple-500/10',
      title: 'Snapshot Manager',
      description: 'Export emulator state to a portable file or import existing storage snapshots.',
      keywords: ['export', 'import', 'backup', 'snapshot', 'zip'],
      footer: (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="h-9 border border-[var(--border)] text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--bg-elevated)]"
            onClick={(e) => {
              e.stopPropagation();
              openModal('exportImport', { tab: 'export' });
            }}
          >
            Export
          </button>
          <button
            type="button"
            className="h-9 border border-[var(--border)] text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--bg-elevated)]"
            onClick={(e) => {
              e.stopPropagation();
              openModal('exportImport', { tab: 'import' });
            }}
          >
            Import
          </button>
        </div>
      ),
      onClick: () => openModal('exportImport', { tab: 'export' }),
    },
    {
      id: 'shortcuts',
      icon: Keyboard,
      iconClass: 'text-[var(--text-muted)] bg-[var(--bg-base)]',
      title: 'Shortcuts Cheat Sheet',
      description: 'Master the StoragePilot workflow with power-user keyboard combinations.',
      keywords: ['keyboard', 'hotkey', 'shortcuts'],
      footer: (
        <div className="flex flex-wrap gap-2">
          {['⌘ + K', '⌘ + B', 'Shift + ?'].map((s) => (
            <span
              key={s}
              className="px-2 py-1 text-[10px] font-mono border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-muted)]"
            >
              {s}
            </span>
          ))}
        </div>
      ),
      onClick: () => openModal('shortcuts'),
    },
  ];

  const visibleCount = cards.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.includes(q))
    );
  }).length;

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[var(--bg-base)]">
      <div className="px-8 pt-8 pb-6 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-start gap-3 mb-2">
          <Sparkles size={20} className="text-[var(--accent)] mt-0.5 shrink-0" />
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Developer Tools Hub</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl">
              Advanced utilities for emulator management, data generation, and API debugging.
            </p>
          </div>
        </div>
        <div className="mt-5 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder=">_ Search developer tools…"
            className="w-full h-9 px-3 font-mono text-xs bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {visibleCount === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No tools match your search.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-6xl">
            {cards.map((card) => (
              <ToolCard
                key={card.id}
                icon={card.icon}
                iconClass={card.iconClass}
                title={card.title}
                description={card.description}
                badge={card.badge}
                footer={card.footer}
                onClick={card.onClick}
                keywords={card.keywords}
                search={search}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

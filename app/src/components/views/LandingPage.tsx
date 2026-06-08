import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Check,
  ChevronRight,
  Command,
  Copy,
  Download,
  Eye,
  Github,
  Layers,
  Link2,
  Menu,
  Shield,
  Terminal,
  TestTube2,
  Upload,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type { ProviderType } from '../../api/types';
import { APP_VERSION } from '../../lib/buildInfo';
import { providerEndpointHint } from '../../lib/providerAccent';
import {
  DOCKER_HUB_URL,
  DOCKER_IMAGE_FULL_COMPRESSED,
  DOCKER_IMAGE_UI_COMPRESSED,
  DOCKER_RUN_SNIPPET,
  GITHUB_REPO_URL,
  IS_MARKETING_SITE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from '../../lib/siteLinks';
import { Button } from '../shared/Button';
import { ProviderIcon } from '../shared/ProviderLogo';
import { StoragePilotLogo } from '../shared/StoragePilotLogo';

const NAV = [
  { href: '#providers', label: 'Providers' },
  { href: '#features', label: 'Features' },
  { href: '#use-cases', label: 'Use cases' },
  { href: '#quickstart', label: 'Quick start' },
] as const;

const PROVIDERS: Array<{
  type: ProviderType;
  title: string;
  emulator: string;
  accent: string;
}> = [
  { type: 'gcs', title: 'Google Cloud Storage', emulator: 'fake-gcs-server', accent: 'var(--accent-gcs)' },
  { type: 's3', title: 'Amazon S3', emulator: 'MinIO', accent: 'var(--accent-s3)' },
  { type: 'azure', title: 'Azure Blob Storage', emulator: 'Azurite', accent: 'var(--accent-azure)' },
];

const STATS = [
  { value: '3', label: 'Cloud providers' },
  { value: '0', label: 'CORS config needed' },
  { value: DOCKER_IMAGE_FULL_COMPRESSED, label: ':full image' },
  { value: 'MIT', label: 'Open source' },
];

const FEATURES = [
  {
    icon: Layers,
    title: 'One UI, three providers',
    description:
      'Switch between GCS, S3, and Azure emulators from a single sidebar. Connection profiles persist across sessions.',
  },
  {
    icon: Upload,
    title: 'Upload & download',
    description:
      'Drag-and-drop uploads, bulk downloads as ZIP, folder uploads, and progress tracking for every transfer.',
  },
  {
    icon: Eye,
    title: 'Inline previews',
    description:
      'Preview images, JSON, CSV, PDF, code, audio, and video without leaving the browser. Hex view for binaries.',
  },
  {
    icon: Command,
    title: 'Command palette',
    description:
      'Jump to buckets, objects, and actions instantly with ⌘K. Keyboard shortcuts for power users throughout.',
  },
  {
    icon: Activity,
    title: 'Activity log',
    description:
      'Every API call logged with method, status, and duration. Inspect requests and troubleshoot emulator issues.',
  },
  {
    icon: Copy,
    title: 'Copy, move & versioning',
    description:
      'Move objects between buckets, manage object versions, and run bulk operations with undo support.',
  },
  {
    icon: Link2,
    title: 'Shareable URLs',
    description:
      'Deep-link to any bucket, prefix, or object. URL state syncs with React Router for bookmarkable sessions.',
  },
  {
    icon: Terminal,
    title: 'Developer tools',
    description:
      'Generate SDK snippets, create fake test data, export/import emulator state, and edit CORS rules.',
  },
];

const USE_CASES = [
  {
    icon: Terminal,
    title: 'Local development',
    description:
      'Inspect buckets and objects without juggling gsutil, aws s3, or az storage. Upload test files in seconds.',
  },
  {
    icon: TestTube2,
    title: 'Integration testing',
    description:
      'Seed emulator data, verify uploads in CI, and debug storage calls with a full activity log.',
  },
  {
    icon: Users,
    title: 'Team demos',
    description:
      'Give teammates a visual browser for your local stack — no CLI onboarding required.',
  },
];

const COMPARE_POINTS = [
  'Single UI for GCS, S3, and Azure emulators',
  'nginx reverse proxy — no browser CORS setup',
  'Drag-and-drop uploads with progress tracking',
  'Inline previews for JSON, CSV, PDF, images, and more',
  'Shareable deep links to buckets and objects',
  'SDK snippet generator and fake data tools',
];

function GetStartedButton({
  className = '',
  size = 'md',
  onClick,
}: {
  className?: string;
  size?: 'md' | 'lg';
  onClick?: () => void;
}) {
  const sizing = size === 'lg' ? 'h-12 px-8 gap-2 text-base' : 'h-9 px-4 gap-2';

  if (IS_MARKETING_SITE) {
    return (
      <a href="#quickstart" className={className} onClick={onClick}>
        <Button variant="accent" className={`${sizing} w-full sm:w-auto justify-center`}>
          Get started
          <ChevronRight size={size === 'lg' ? 16 : 14} />
        </Button>
      </a>
    );
  }

  return (
    <Link to="/gcs" className={className} onClick={onClick}>
      <Button variant="accent" className={`${sizing} w-full sm:w-auto justify-center`}>
        Open app
        <ArrowRight size={size === 'lg' ? 16 : 14} />
      </Button>
    </Link>
  );
}

function GitHubButton({ className = '', outline = false }: { className?: string; outline?: boolean }) {
  return (
    <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className={className}>
      <Button
        variant={outline ? 'outline' : 'accent'}
        className="h-10 px-6 gap-2 w-full sm:w-auto justify-center"
      >
        <Github size={14} />
        View on GitHub
      </Button>
    </a>
  );
}

function usePageMeta() {
  useEffect(() => {
    document.title = `${SITE_NAME} — ${SITE_TAGLINE}`;
    return () => {
      document.title = SITE_NAME;
    };
  }, []);
}

function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="border border-[var(--border)] bg-[var(--bg-base)]">
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Terminal size={14} />
          <span>{label}</span>
        </div>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          {copied ? (
            <>
              <Check size={14} className="text-[var(--success)]" />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-[11px] font-mono text-[var(--text-muted)] overflow-x-auto leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-base)]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="hover:opacity-90 transition-opacity shrink-0">
          <StoragePilotLogo className="w-auto!" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-[var(--text-muted)]">
          {NAV.map(({ href, label }) => (
            <a key={href} href={href} className="hover:text-[var(--text-primary)] transition-colors">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="View on GitHub"
          >
            <Github size={18} strokeWidth={1.75} />
          </a>
          <GetStartedButton className="hidden sm:block" />
          <button
            type="button"
            className="md:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4 flex flex-col gap-1">
          {NAV.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
          <GetStartedButton className="mt-3" onClick={() => setMenuOpen(false)} />
        </nav>
      )}
    </header>
  );
}

function AppPreview() {
  const rows = [
    { name: 'reports/', size: '—', modified: 'Jun 1' },
    { name: 'config.json', size: '2.4 KB', modified: 'Jun 5' },
    { name: 'logo.png', size: '48 KB', modified: 'Jun 4' },
    { name: 'data.csv', size: '128 KB', modified: 'Jun 3' },
  ];

  return (
    <div
      className="border border-[var(--border)] bg-[var(--bg-surface)] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]"
      aria-hidden
    >
      <div className="flex items-center gap-2 h-7 px-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <span className="size-2 rounded-full bg-[var(--error)]/60" />
        <span className="size-2 rounded-full bg-[var(--warning)]/60" />
        <span className="size-2 rounded-full bg-[var(--success)]/60" />
        <span className="ml-2 text-[9px] font-mono text-[var(--text-muted)] truncate">
          storagepilot / my-bucket / uploads
        </span>
      </div>
      <div className="flex h-[260px] sm:h-[300px]">
        <div className="w-[130px] shrink-0 border-r border-[var(--border)] bg-[var(--bg-base)] p-3 flex flex-col gap-2">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1">
            Providers
          </p>
          {PROVIDERS.map((p, i) => (
            <div
              key={p.type}
              className={`flex items-center gap-2 px-2 py-1.5 text-[10px] border-l-2 ${
                i === 0
                  ? 'border-[var(--accent-gcs)] bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-muted)]'
              }`}
            >
              <ProviderIcon type={p.type} size={12} />
              <span className="truncate">{p.type.toUpperCase()}</span>
            </div>
          ))}
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mt-3 mb-1">
            Buckets
          </p>
          <div className="px-2 py-1 text-[10px] font-mono text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border)]">
            my-bucket
          </div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="grid grid-cols-[1fr_44px_52px] gap-2 px-3 py-2 border-b border-[var(--border)] text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <span>Name</span>
            <span>Size</span>
            <span>Date</span>
          </div>
          {rows.map((row) => (
            <div
              key={row.name}
              className="grid grid-cols-[1fr_44px_52px] gap-2 px-3 py-2 border-b border-[var(--border)]/50 text-[10px] font-mono"
            >
              <span className="text-[var(--text-primary)] truncate">{row.name}</span>
              <span className="text-[var(--text-muted)]">{row.size}</span>
              <span className="text-[var(--text-muted)]">{row.modified}</span>
            </div>
          ))}
          <div className="mt-auto h-6 border-t border-[var(--border)] bg-[var(--bg-base)] flex items-center px-3 gap-3">
            <span className="text-[8px] font-mono text-[var(--success)]">● Connected</span>
            <span className="text-[8px] font-mono text-[var(--text-muted)]">4 objects</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsBar() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px border border-[var(--border)] bg-[var(--border)]">
      {STATS.map(({ value, label }) => (
        <div key={label} className="bg-[var(--bg-surface)] px-4 py-5 text-center">
          <p className="text-2xl font-semibold text-[var(--text-primary)]">{value}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-16 sm:pt-20 sm:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 w-fit px-3 py-1.5 border border-[var(--border)] bg-[var(--bg-surface)] text-xs text-[var(--text-muted)]">
              <Zap size={12} className="text-[var(--accent)]" />
              <span>Open source · MIT · v{APP_VERSION}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold leading-[1.08] text-[var(--text-primary)]">
              Browse local cloud storage{' '}
              <span className="text-[var(--accent)]">without the friction</span>
            </h1>
            <p className="text-lg text-[var(--text-muted)] leading-relaxed max-w-xl">
              {SITE_DESCRIPTION}{' '}
              {IS_MARKETING_SITE
                ? 'Run it on your own machine with Docker — your emulators, your data, nothing stored on this site.'
                : 'Open the app below, or deploy your own with a single Docker command.'}
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              {IS_MARKETING_SITE ? (
                <>
                  <GetStartedButton size="lg" />
                  <GitHubButton outline />
                </>
              ) : (
                <>
                  <GetStartedButton size="lg" />
                  <a href="#quickstart">
                    <Button variant="outline" className="h-12 px-8 gap-2 w-full sm:w-auto justify-center">
                      Self-host with Docker
                      <ChevronRight size={16} />
                    </Button>
                  </a>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
              <span className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Shield size={14} className="text-[var(--success)]" />
                Runs entirely in the browser
              </span>
              <span className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Download size={14} className="text-[var(--accent)]" />
                :full {DOCKER_IMAGE_FULL_COMPRESSED} · :ui {DOCKER_IMAGE_UI_COMPRESSED}
              </span>
            </div>
          </div>
          <div className="relative lg:pl-4">
            <div className="absolute -inset-3 border border-[var(--accent)]/20 pointer-events-none" />
            <AppPreview />
          </div>
        </div>
        <div className="mt-16">
          <StatsBar />
        </div>
      </div>
    </section>
  );
}

function ProvidersSection() {
  return (
    <section id="providers" className="scroll-mt-16 border-t border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] mb-4">
            Three providers, one interface
          </h2>
          <p className="text-[var(--text-muted)] leading-relaxed">
            Connect to any combination of local emulators. nginx reverse-proxies all API calls through
            a single origin — no browser CORS configuration needed.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {PROVIDERS.map(({ type, title, emulator, accent }) => (
            <div
              key={type}
              className="p-6 border border-[var(--border)] bg-[var(--bg-base)] flex flex-col gap-4"
              style={{ borderTopWidth: 2, borderTopColor: accent }}
            >
              <ProviderIcon type={type} size={28} />
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">via {emulator}</p>
              </div>
              <p
                className="text-[10px] font-mono text-[var(--text-muted)] truncate mt-auto"
                title={providerEndpointHint(type)}
              >
                {providerEndpointHint(type)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10 p-4 sm:p-5 border border-[var(--border)] bg-[var(--bg-base)] flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-sm text-[var(--text-muted)]">
          <span className="font-mono text-[var(--text-primary)]">Browser</span>
          <ArrowRight size={14} className="text-[var(--accent)] shrink-0 hidden sm:block" />
          <span className="font-mono text-[var(--text-primary)]">nginx</span>
          <ArrowRight size={14} className="text-[var(--accent)] shrink-0 hidden sm:block" />
          <span className="font-mono text-[var(--text-muted)] text-center">
            /api/gcs · /api/s3 · /api/azure
          </span>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-16 border-t border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16 items-start">
          <div className="lg:sticky lg:top-24">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] mb-4">
              Built for local development
            </h2>
            <p className="text-[var(--text-muted)] leading-relaxed mb-8">
              Everything you need to inspect, upload, and manage objects in your emulators — from
              first bucket to production-like workflows.
            </p>
            <ul className="flex flex-col gap-3">
              {COMPARE_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
                  <Check size={16} className="text-[var(--success)] shrink-0 mt-0.5" strokeWidth={2.5} />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="p-5 border border-[var(--border)] bg-[var(--bg-surface)] flex flex-col gap-3 hover:border-[var(--text-muted)] transition-colors"
              >
                <Icon size={18} className="text-[var(--accent)]" strokeWidth={1.75} />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function UseCasesSection() {
  return (
    <section id="use-cases" className="scroll-mt-16 border-t border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] mb-4">
            Who it&apos;s for
          </h2>
          <p className="text-[var(--text-muted)] leading-relaxed">
            {IS_MARKETING_SITE
              ? 'Developers who run emulators on their own machines and want a fast, visual way to work with buckets and objects.'
              : 'Whether you\u2019re building against emulators locally or sharing a demo environment, StoragePilot keeps storage inspection visual and fast.'}
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {USE_CASES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="p-6 border border-[var(--border)] bg-[var(--bg-base)] flex flex-col gap-4"
            >
              <div className="flex items-center justify-center size-10 border border-[var(--border)] bg-[var(--bg-surface)]">
                <Icon size={18} className="text-[var(--accent)]" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickStartSection() {
  return (
    <section id="quickstart" className="scroll-mt-16 border-t border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]">
              {IS_MARKETING_SITE ? 'Run it locally' : 'Deploy your own instance'}
            </h2>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Pull the all-in-one image with bundled emulators, or run UI-only against emulators you
              already have. Everything runs on your machine — no hosted storage, no shared data.
            </p>
            <ul className="flex flex-col gap-3 text-sm text-[var(--text-muted)]">
              <li className="flex items-start gap-3">
                <span className="font-mono text-[var(--accent)] shrink-0">:full</span>
                <span>
                  UI + GCS, S3, and Azure emulators in one container ({DOCKER_IMAGE_FULL_COMPRESSED}{' '}
                  compressed on Docker Hub)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-[var(--accent)] shrink-0">:ui</span>
                <span>
                  Standalone nginx proxy when emulators run elsewhere ({DOCKER_IMAGE_UI_COMPRESSED})
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-[var(--accent)] shrink-0">ENABLED_PROVIDERS</span>
                <span>Start only the backends you need at container launch</span>
              </li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <GitHubButton />
              <a href={DOCKER_HUB_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="h-10 px-6 gap-2">
                  Docker Hub
                  <ChevronRight size={14} />
                </Button>
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <CodeBlock code={DOCKER_RUN_SNIPPET} label="All-in-one (recommended)" />
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Then open{' '}
              <code className="font-mono text-[var(--text-primary)]">http://localhost:3000</code> on
              your machine. Default MinIO credentials:{' '}
              <code className="font-mono text-[var(--text-primary)]">storagepilot</code> /{' '}
              <code className="font-mono text-[var(--text-primary)]">storagepilot</code>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="border-t border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="border border-[var(--accent)]/30 bg-[var(--bg-base)] p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
              {IS_MARKETING_SITE ? 'Ready to run StoragePilot?' : 'Ready to browse your buckets?'}
            </h2>
            <p className="text-sm text-[var(--text-muted)] max-w-md">
              {IS_MARKETING_SITE
                ? 'Clone the repo or pull the Docker image and run it locally. Your data never leaves your environment.'
                : 'Connect to GCS, S3, or Azure emulators and start uploading in under a minute.'}
            </p>
          </div>
          {IS_MARKETING_SITE ? (
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <GetStartedButton size="lg" />
              <GitHubButton outline />
            </div>
          ) : (
            <Link to="/gcs" className="shrink-0">
              <Button variant="accent" className="h-12 px-10 gap-2 text-base">
                Open StoragePilot
                <ArrowRight size={16} />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <StoragePilotLogo className="w-auto!" />
          <span className="text-xs text-[var(--text-muted)]">
            v{APP_VERSION} · {SITE_TAGLINE}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--text-muted)]">
          {!IS_MARKETING_SITE && (
            <Link to="/gcs" className="hover:text-[var(--text-primary)] transition-colors">
              App
            </Link>
          )}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            GitHub
          </a>
          <a
            href={DOCKER_HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            Docker Hub
          </a>
          <span>MIT License</span>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  usePageMeta();

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <ProvidersSection />
        <FeaturesSection />
        <UseCasesSection />
        <QuickStartSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}

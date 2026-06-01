import {
  BarChart3,
  CheckCircle2,
  Circle,
  FolderOpen,
  LogOut,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useBuckets } from '../../hooks/useBuckets';
import { useToast } from '../../hooks/useToast';
import { logout } from '../../lib/logout';
import { apiVersionLabel } from '../../lib/buildInfo';
import { providerAccentVar, profileEndpoint } from '../../lib/providerAccent';
import { removeConnection } from '../../lib/removeConnection';
import { DISPLAY_USER } from '../../lib/displayUser';
import { useAppStore } from '../../store/appStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { usePreferencesStore } from '../../store/preferencesStore';
import { useUiStore } from '../../store/uiStore';
import { useMainView } from '../../hooks/useMainView';
import { ProviderLogo } from '../shared/ProviderLogo';
import { SectionLabel } from '../shared/SectionLabel';

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof FolderOpen;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs transition-colors border-l-2 ${
        active
          ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)] font-medium'
          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
      }`}
    >
      <Icon size={14} className={active ? 'text-[var(--accent)]' : ''} />
      {label}
    </button>
  );
}

export function Sidebar() {
  const { buckets, loading, refresh } = useBuckets();
  const currentBucket = useAppStore((s) => s.currentBucket);
  const setCurrentBucket = useAppStore((s) => s.setCurrentBucket);
  const setNotFound = useUiStore((s) => s.setNotFound);
  const appSection = useUiStore((s) => s.appSection);
  const setAppSection = useUiStore((s) => s.setAppSection);
  const profiles = useConnectionStore((s) => s.profiles);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const setActiveProfile = useConnectionStore((s) => s.setActiveProfile);
  const connectionStatus = useConnectionStore((s) => s.connectionStatus);
  const testConnection = useConnectionStore((s) => s.testConnection);
  const openModal = useModalStore((s) => s.openModal);
  const view = useMainView();
  const recentlyVisited = usePreferencesStore((s) => s.recentlyVisited);
  const addRecentBucket = usePreferencesStore((s) => s.addRecentBucket);
  const enabledProviders = usePreferencesStore((s) => s.enabledProviders);
  const toast = useToast();

  const visibleProfiles = profiles.filter((p) => enabledProviders.includes(p.type));
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  const explorerMode = appSection === 'explorer';

  const goExplorer = () => {
    setAppSection('explorer');
    setNotFound(false);
  };

  const goDevTools = () => {
    setAppSection('developer-tools');
    setNotFound(false);
  };

  return (
    <aside className="shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--bg-surface)] w-[var(--sidebar-width)]">
      <div className="border-b border-[var(--border)] bg-[var(--bg-overlay)] pt-3 pb-3 px-2">
        <SectionLabel className="px-2 py-0">Navigation</SectionLabel>
        <div className="flex flex-col gap-0.5 mt-2">
          <NavItem
            icon={FolderOpen}
            label="Explorer"
            active={explorerMode}
            onClick={goExplorer}
          />
          <NavItem
            icon={Sparkles}
            label="Developer Tools"
            active={appSection === 'developer-tools'}
            onClick={goDevTools}
          />
          <NavItem
            icon={BarChart3}
            label="Stats Dashboard"
            active={false}
            onClick={() => openModal('performanceMetrics')}
          />
        </div>
      </div>

      {explorerMode && (
        <>
          <div className="border-b border-[var(--border)] bg-[var(--bg-overlay)] pt-3 pb-[13px] px-3">
            <SectionLabel
              className="px-2 py-0"
              action={
                <button
                  type="button"
                  className="text-[10px] leading-[15px] text-[var(--accent)] hover:underline"
                  style={{ fontFamily: 'var(--font-ui)' }}
                  onClick={() => openModal('connection', { mode: 'create' })}
                >
                  + Add New
                </button>
              }
            >
              {view === 'bucket-list' ? 'Storage' : 'Active Storage'}
            </SectionLabel>
            <div className="flex flex-col gap-2 mt-3">
              {visibleProfiles.map((profile) => {
                const isActive = profile.id === activeProfileId;
                const status = connectionStatus[profile.id] ?? 'unconfigured';
                const accent = providerAccentVar(profile.type);
                return (
                  <div
                    key={profile.id}
                    className={`flex items-stretch w-full border border-[var(--border)] transition-colors ${
                      isActive
                        ? 'bg-[var(--bg-elevated)] opacity-100'
                        : 'bg-[var(--bg-base)] opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      borderLeftWidth: 4,
                      borderLeftColor: accent,
                    }}
                  >
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left"
                      style={{ padding: '9px 9px 9px 12px' }}
                      onClick={() => {
                        setActiveProfile(profile.id);
                        setCurrentBucket(null);
                        setNotFound(false);
                        void testConnection(profile.id);
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <ProviderLogo type={profile.type} size={14} variant="icon" />
                          <span
                            className="text-xs font-semibold leading-4 truncate text-[var(--text-primary)]"
                            style={{ fontFamily: 'var(--font-ui)' }}
                          >
                            {profile.name}
                          </span>
                        </div>
                        {status === 'connected' ? (
                          view === 'bucket-list' ? (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30">
                              Live
                            </span>
                          ) : (
                            <CheckCircle2 size={10} className="text-[var(--success)] shrink-0" />
                          )
                        ) : (
                          <Circle size={10} className="text-[var(--text-muted)] shrink-0" />
                        )}
                      </div>
                      <p
                        className="text-[10px] leading-[15px] text-[var(--text-muted)] truncate pl-[20px]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {profileEndpoint(profile)}
                      </p>
                    </button>
                    <button
                      type="button"
                      className="shrink-0 px-2 text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--bg-overlay)]"
                      aria-label={`Remove ${profile.name}`}
                      title="Remove connection"
                      onClick={() => {
                        removeConnection(profile.id);
                        toast.success(`Removed ${profile.name}`);
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <SectionLabel
              className="px-2 py-1.5"
              action={
                <button
                  type="button"
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  onClick={refresh}
                >
                  <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
                </button>
              }
            >
              Buckets
            </SectionLabel>
            {loading && (
              <p
                className="px-3 py-2 text-[10px] leading-[15px] text-[var(--text-muted)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Loading…
              </p>
            )}
            {!loading && buckets.length === 0 && (
              <p className="px-3 py-2 text-[10px] text-[var(--text-muted)]">No buckets</p>
            )}
            {buckets.map((bucket) => {
              const selected = currentBucket === bucket.name;
              return (
                <button
                  key={bucket.name}
                  type="button"
                  className={`flex items-center justify-between w-full mb-0.5 text-left transition-colors ${
                    selected
                      ? 'bg-[var(--accent)]/5 border-l-2 border-[var(--accent)] text-[var(--text-primary)] pl-[14px] pr-3 py-2'
                      : 'hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] border-l-2 border-transparent px-3 py-2'
                  }`}
                  onClick={() => {
                    setNotFound(false);
                    setCurrentBucket(bucket.name);
                    addRecentBucket(bucket.name);
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderOpen size={12} className="shrink-0" />
                    <span
                      className={`text-xs truncate ${selected ? 'font-medium' : 'font-normal'} text-[var(--text-primary)]`}
                      style={{ fontFamily: 'var(--font-ui)' }}
                    >
                      {bucket.name}
                    </span>
                  </div>
                </button>
              );
            })}
            {view === 'bucket-list' && recentlyVisited.length > 0 && (
              <>
                <SectionLabel className="px-2 py-1.5 mt-4">Recently Visited</SectionLabel>
                {recentlyVisited.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                    onClick={() => {
                      setNotFound(false);
                      setCurrentBucket(name);
                    }}
                  >
                    <FolderOpen size={12} />
                    {name}
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}

      {!explorerMode && <div className="flex-1" />}

      <div className="border-t border-[var(--border)] bg-[rgba(13,17,23,0.3)] shrink-0">
        <div className="pt-[17px] pb-3 px-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--accent)] shrink-0">
              {DISPLAY_USER.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold leading-4 truncate text-[var(--text-primary)]"
                style={{ fontFamily: 'var(--font-ui)' }}
              >
                {DISPLAY_USER.name}
              </p>
              <p
                className="text-[10px] leading-[15px] text-[var(--text-muted)] truncate"
                style={{ fontFamily: 'var(--font-mono)' }}
                title={activeProfile ? profileEndpoint(activeProfile) : undefined}
              >
                {activeProfile ? profileEndpoint(activeProfile) : 'No connection'} · {apiVersionLabel()}
              </p>
            </div>
            <button
              type="button"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
              aria-label="Sign out"
              title="Sign out"
              onClick={() => {
                logout();
                toast.success('Signed out');
              }}
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

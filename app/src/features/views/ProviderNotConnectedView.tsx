import {
  Plug,
  RefreshCw,
  Server,
  Settings,
} from 'lucide-react';
import { providerEndpointHint } from '../../lib/providerAccent';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../shared/Button';
import { ProviderLogo } from '../shared/ProviderLogo';
import { TroubleshootingPanel } from '../detail/TroubleshootingPanel';

export function ProviderNotConnectedView() {
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const profiles = useConnectionStore((s) => s.profiles);
  const connectionStatus = useConnectionStore((s) => s.connectionStatus);
  const testConnection = useConnectionStore((s) => s.testConnection);
  const openModal = useModalStore((s) => s.openModal);

  const profile = profiles.find((p) => p.id === activeProfileId);
  const status = activeProfileId ? connectionStatus[activeProfileId] : 'unconfigured';

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-12 gap-8 bg-[var(--bg-base)]">
      <div className="p-6 border border-[var(--border)] bg-[var(--bg-surface)]">
        {profile && <ProviderLogo type={profile.type} size={48} />}
      </div>
      <div className="text-center max-w-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 border border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)] text-xs uppercase tracking-wider">
          <Plug size={12} />
          Connection Required
        </div>
        <h2 className="text-2xl font-semibold mb-3 text-[var(--text-primary)]">Provider not connected</h2>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          {status === 'checking'
            ? 'Testing connection to your emulator…'
            : `Could not reach ${profile?.name ?? 'the emulator'}. Check that the service is running and your connection settings are correct.`}
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          variant="accent"
          onClick={() =>
            openModal('connection', {
              profileId: activeProfileId ?? undefined,
              mode: 'edit',
            })
          }
        >
          <Settings size={14} />
          Configure Connection
        </Button>
        {activeProfileId && (
          <Button variant="outline" onClick={() => void testConnection(activeProfileId)}>
            <RefreshCw size={14} />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

export function ProviderErrorView() {
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const profiles = useConnectionStore((s) => s.profiles);
  const connectionErrors = useConnectionStore((s) => s.connectionErrors);
  const testConnection = useConnectionStore((s) => s.testConnection);
  const openModal = useModalStore((s) => s.openModal);
  const setSessionConnectionLost = useUiStore((s) => s.setSessionConnectionLost);

  const profile = profiles.find((p) => p.id === activeProfileId);
  const endpoint = profile ? providerEndpointHint(profile.type) : 'localhost';
  const errorMsg =
    (activeProfileId && connectionErrors[activeProfileId]) ||
    `request to http://${endpoint}/ failed, reason: connect ECONNREFUSED ${endpoint}`;
  const timestamp = new Date().toISOString();

  const retry = async () => {
    if (!activeProfileId) return;
    const ok = await testConnection(activeProfileId);
    if (ok) setSessionConnectionLost(false);
  };

  return (
    <div className="flex flex-1 overflow-hidden min-h-0">
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--bg-base)]">
        <div className="max-w-xl w-full border border-[var(--border)] bg-[var(--bg-surface)] p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-2 bg-[var(--error)]/10 border border-[var(--error)]/30">
              <Server size={20} className="text-[var(--error)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Provider Connection Failed
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-[var(--error)]/15 text-[var(--error)] border border-[var(--error)]/30">
                  CRITICAL_ERR_002
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                StoragePilot could not establish a handshake with{' '}
                <strong className="text-[var(--text-primary)] font-medium">
                  {profile?.name ?? 'the provider'}
                </strong>{' '}
                at {endpoint}. This usually happens if the emulator process is not running or a firewall
                is blocking the port.
              </p>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-base)] border border-[var(--border)] mb-6 font-mono text-[11px] flex flex-col gap-2">
            <div>
              <span className="text-[var(--text-muted)]">Timestamp: </span>
              <span className="text-[var(--text-primary)]">{timestamp}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Target: </span>
              <span className="text-[var(--text-primary)]">http://{endpoint}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Error: </span>
              <span className="text-[var(--error)] break-all">{errorMsg}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="accent" onClick={() => void retry()}>
              <RefreshCw size={14} />
              Retry Connection
            </Button>
            <Button variant="outline" onClick={() => openModal('connection')}>
              <Settings size={14} />
              Edit Config
            </Button>
            <button
              type="button"
              className="ml-auto text-xs text-[var(--text-muted)] hover:text-[var(--accent)] underline"
              onClick={() => openModal('devTools')}
            >
              View Logs
            </button>
          </div>
        </div>
      </div>
      <TroubleshootingPanel />
    </div>
  );
}

import { Copy, Info } from 'lucide-react';
import { useEffect } from 'react';
import {
  APP_VERSION,
  buildDiagnosticsPayload,
  DOCKER_MODE,
  EMULATOR_VERSIONS,
  GIT_BRANCH,
} from '../../lib/buildInfo';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { usePreferencesStore } from '../../store/preferencesStore';
import { useToast } from '../../hooks/useToast';
import { EmulatorHealthList } from '../shared/EmulatorHealthList';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';

export function AboutDiagnosticsModal() {
  const isOpen = useModalStore((s) => Boolean(s.active.about));
  const closeModal = useModalStore((s) => s.closeModal);
  const profiles = useConnectionStore((s) => s.profiles);
  const connectionStatus = useConnectionStore((s) => s.connectionStatus);
  const connectionErrors = useConnectionStore((s) => s.connectionErrors);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const testConnection = useConnectionStore((s) => s.testConnection);
  const enabledProviders = usePreferencesStore((s) => s.enabledProviders);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;
    for (const p of profiles) {
      if (connectionStatus[p.id] !== 'connected') {
        void testConnection(p.id);
      }
    }
  }, [isOpen, profiles, connectionStatus, testConnection]);

  const copyDiagnostics = async () => {
    const payload = buildDiagnosticsPayload({
      enabledProviders,
      activeProfileId,
      profiles: profiles.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        status: connectionStatus[p.id] ?? 'unconfigured',
        error: connectionErrors[p.id],
      })),
    });
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success('Diagnostics copied to clipboard');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => closeModal('about')}
      title="About & Diagnostics"
      size="lg"
      headerIcon={<Info size={18} className="text-[var(--accent)]" />}
      footer={
        <Button variant="primary" onClick={() => void copyDiagnostics()}>
          <Copy size={14} />
          Copy diagnostics
        </Button>
      }
    >
      <div className="space-y-6">
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Application
          </p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono">
            <dt className="text-[var(--text-muted)]">Version</dt>
            <dd>{APP_VERSION}</dd>
            <dt className="text-[var(--text-muted)]">Branch</dt>
            <dd>{GIT_BRANCH}</dd>
            <dt className="text-[var(--text-muted)]">Mode</dt>
            <dd>{DOCKER_MODE}</dd>
            <dt className="text-[var(--text-muted)]">Enabled providers</dt>
            <dd>{enabledProviders.join(', ') || '—'}</dd>
          </dl>
        </section>

        <section>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Bundled emulators
          </p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono">
            <dt className="text-[var(--text-muted)]">fake-gcs-server</dt>
            <dd>{EMULATOR_VERSIONS.gcs}</dd>
            <dt className="text-[var(--text-muted)]">MinIO (pgsty)</dt>
            <dd>{EMULATOR_VERSIONS.s3}</dd>
            <dt className="text-[var(--text-muted)]">Azurite</dt>
            <dd>{EMULATOR_VERSIONS.azure}</dd>
          </dl>
        </section>

        <section>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
            Emulator health
          </p>
          <EmulatorHealthList />
        </section>
      </div>
    </Modal>
  );
}

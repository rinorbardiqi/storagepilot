import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Database, Terminal } from 'lucide-react';
import type { ProviderType } from '../../api/types';
import { useSetupManifest } from '../../hooks/useSetupManifest';
import {
  applyOnboardingSources,
  toggleProviderSelection,
} from '../../lib/onboarding';
import { providersKey } from '../../lib/setupManifest';
import { providerEndpointHint } from '../../lib/providerAccent';
import { usePreferencesStore } from '../../store/preferencesStore';
import { ProviderLogo } from '../shared/ProviderLogo';
import { OnboardingLayout } from '../layout/OnboardingLayout';

const SOURCES: Array<{
  type: ProviderType;
  title: string;
  emulator: string;
  endpoint: string;
}> = [
  {
    type: 'gcs',
    title: 'Google Cloud Storage',
    emulator: 'fake-gcs-server',
    endpoint: providerEndpointHint('gcs'),
  },
  {
    type: 's3',
    title: 'Amazon S3',
    emulator: 'MinIO',
    endpoint: providerEndpointHint('s3'),
  },
  {
    type: 'azure',
    title: 'Azure Blob Storage',
    emulator: 'Azurite',
    endpoint: providerEndpointHint('azure'),
  },
];

function OnboardingStep1({
  onContinue,
  onSkip,
}: {
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <OnboardingLayout
      step={1}
      onContinue={onContinue}
      onSkip={onSkip}
      showBack={false}
      continueLabel="Get Started"
      footerHint="Press Enter to continue"
    >
      <div className="max-w-2xl w-full px-8 flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold leading-tight text-[var(--text-primary)]">
            Browse local cloud storage
          </h1>
          <p className="text-lg text-[var(--text-muted)] leading-relaxed">
            StoragePilot is a unified file browser for GCS, S3, and Azure emulators running on your
            machine. On the next step you connect to the backends enabled in your container.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SOURCES.map(({ type, title, emulator }) => (
            <div
              key={type}
              className="p-4 border border-[var(--border)] bg-[var(--bg-surface)] flex flex-col gap-3"
            >
              <ProviderLogo type={type} size={22} variant="icon" />
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">via {emulator}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3 p-4 border border-[var(--border)] bg-[var(--bg-surface)] text-sm text-[var(--text-muted)]">
            <Terminal size={16} className="text-[var(--accent)] shrink-0 mt-0.5" />
            <p>
              Run the bundled image with{' '}
              <code className="font-mono text-[var(--text-primary)]">rinorbardiqi/storagepilot:full</code>
              . Choose providers at start with{' '}
              <code className="font-mono text-[var(--text-primary)]">ENABLED_PROVIDERS</code>:
            </p>
          </div>
          <pre className="p-3 border border-[var(--border)] bg-[var(--bg-base)] text-[10px] font-mono text-[var(--text-muted)] overflow-x-auto">
{`docker run -d -p 3000:80 -p 9000:9000 \\
  -v storagepilot-data:/data \\
  rinorbardiqi/storagepilot:full

# S3 only:
docker run -d -p 3000:80 -p 9000:9000 \\
  -e ENABLED_PROVIDERS=s3 \\
  -v storagepilot-data:/data \\
  rinorbardiqi/storagepilot:full`}
          </pre>
        </div>
      </div>
    </OnboardingLayout>
  );
}

function OnboardingStep2({
  onBack,
  availableProviders,
  manifest,
}: {
  onBack: () => void;
  availableProviders: ProviderType[];
  manifest: ReturnType<typeof useSetupManifest>['manifest'];
}) {
  const setEnabledProviders = usePreferencesStore((s) => s.setEnabledProviders);
  const visibleSources = useMemo(
    () => SOURCES.filter((s) => availableProviders.includes(s.type)),
    [availableProviders],
  );
  const [selected, setSelected] = useState<ProviderType[]>(availableProviders);
  const availableKey = providersKey(availableProviders);

  useEffect(() => {
    setSelected(availableProviders);
    setEnabledProviders(availableProviders);
  }, [availableKey, setEnabledProviders]);

  const finish = () => applyOnboardingSources(selected, manifest);
  const allSelected = selected.length === visibleSources.length;

  const toggle = (type: ProviderType) => {
    setSelected((current) => toggleProviderSelection(current, type));
  };

  return (
    <OnboardingLayout
      step={2}
      onBack={onBack}
      onContinue={finish}
      onSkip={finish}
      continueLabel="Connect"
      continueDisabled={selected.length === 0}
      footerHint="Select backends running in your container, then press Enter"
    >
      <div className="max-w-3xl w-full px-8 flex flex-col gap-8">
        <div className="text-center flex flex-col gap-2">
          <div className="inline-flex items-center justify-center gap-2 mx-auto text-[var(--accent)]">
            <Database size={18} />
            <span className="text-xs font-semibold uppercase tracking-widest">Step 2 of 2</span>
          </div>
          <h2 className="text-3xl font-semibold text-[var(--text-primary)]">Choose your storage</h2>
          <p className="text-[var(--text-muted)] max-w-lg mx-auto">
            {manifest
              ? 'These backends are running in your container. Select which ones to use in the sidebar.'
              : 'Pick any combination — a single provider, two, or all three.'}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-mono text-[var(--text-muted)]">
            {selected.length} of {visibleSources.length} selected
          </p>
          {visibleSources.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setSelected(
                  allSelected ? [visibleSources[0]!.type] : availableProviders,
                )
              }
              className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] hover:underline"
            >
              {allSelected ? 'Select one only' : 'Select all'}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3" role="group" aria-label="Storage backends">
          {visibleSources.map(({ type, title, emulator, endpoint }) => {
            const active = selected.includes(type);
            return (
              <button
                key={type}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(type)}
                className={`w-full text-left p-4 border transition-colors flex items-start gap-4 ${
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                    : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)]'
                }`}
              >
                <ProviderLogo type={type} size={28} variant="icon" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{title}</span>
                    <span
                      className={`size-4 border shrink-0 flex items-center justify-center ${
                        active
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg-base)]'
                          : 'border-[var(--border)] bg-transparent'
                      }`}
                    >
                      {active && <Check size={10} strokeWidth={3} />}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mb-2">
                    Local emulator: {emulator}
                  </p>
                  <p className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                    {endpoint}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-center text-[var(--text-muted)]">
          To add more backends, restart the container with a broader{' '}
          <code className="font-mono">ENABLED_PROVIDERS</code> value.
        </p>
      </div>
    </OnboardingLayout>
  );
}

export function OnboardingView() {
  const step = usePreferencesStore((s) => s.onboardingStep);
  const setStep = usePreferencesStore((s) => s.setOnboardingStep);
  const { manifest, availableProviders, loading } = useSetupManifest();
  const availableKey = providersKey(availableProviders);
  const manifestKey = manifest?.enabledProviders?.length
    ? providersKey(manifest.enabledProviders)
    : 'none';

  const skipStep1 = () => applyOnboardingSources(availableProviders, manifest);
  const autoAppliedRef = useRef(false);

  useEffect(() => {
    if (loading || availableProviders.length !== 1 || autoAppliedRef.current) return;
    autoAppliedRef.current = true;
    applyOnboardingSources(availableProviders, manifest);
  }, [loading, availableKey, manifestKey]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (loading) return;
      if (availableProviders.length === 1) return;
      if (step === 1) setStep(2);
      else {
        const enabled = usePreferencesStore.getState().enabledProviders;
        if (enabled.length) applyOnboardingSources(enabled, manifest);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, setStep, loading, availableKey, manifestKey]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-muted)]">
        Loading setup…
      </div>
    );
  }

  if (availableProviders.length === 1) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-muted)]">
        Connecting…
      </div>
    );
  }

  if (step === 2) {
    return (
      <OnboardingStep2
        onBack={() => setStep(1)}
        availableProviders={availableProviders}
        manifest={manifest}
      />
    );
  }

  return <OnboardingStep1 onContinue={() => setStep(2)} onSkip={skipStep1} />;
}

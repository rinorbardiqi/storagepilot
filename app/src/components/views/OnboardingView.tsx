import { useEffect, useState } from 'react';
import { Check, Database, Terminal } from 'lucide-react';
import type { ProviderType } from '../../api/types';
import {
  ALL_PROVIDER_TYPES,
  applyOnboardingSources,
  toggleProviderSelection,
} from '../../lib/onboarding';
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

function OnboardingStep1({ onContinue }: { onContinue: () => void }) {
  return (
    <OnboardingLayout
      step={1}
      onContinue={onContinue}
      onSkip={() => applyOnboardingSources(ALL_PROVIDER_TYPES)}
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
            machine. On the next step you can enable <strong className="text-[var(--text-primary)]">one,
            two, or all three</strong> backends at once.
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

        <div className="flex items-start gap-3 p-4 border border-[var(--border)] bg-[var(--bg-surface)] text-sm text-[var(--text-muted)]">
          <Terminal size={16} className="text-[var(--accent)] shrink-0 mt-0.5" />
          <p>
            Run <code className="font-mono text-[var(--text-primary)]">docker compose up</code> to
            start the UI and all three emulators together.
          </p>
        </div>
      </div>
    </OnboardingLayout>
  );
}

function OnboardingStep2({ onBack }: { onBack: () => void }) {
  const enabledProviders = usePreferencesStore((s) => s.enabledProviders);
  const setEnabledProviders = usePreferencesStore((s) => s.setEnabledProviders);
  const [selected, setSelected] = useState<ProviderType[]>(enabledProviders);

  useEffect(() => {
    setEnabledProviders(selected);
  }, [selected, setEnabledProviders]);

  const finish = () => applyOnboardingSources(selected);
  const allSelected = selected.length === SOURCES.length;

  const toggle = (type: ProviderType) => {
    setSelected((current) => toggleProviderSelection(current, type));
  };

  return (
    <OnboardingLayout
      step={2}
      onBack={onBack}
      onContinue={finish}
      onSkip={() => applyOnboardingSources(selected)}
      continueLabel="Connect"
      continueDisabled={selected.length === 0}
      footerHint="Select one or more backends, then press Enter"
    >
      <div className="max-w-3xl w-full px-8 flex flex-col gap-8">
        <div className="text-center flex flex-col gap-2">
          <div className="inline-flex items-center justify-center gap-2 mx-auto text-[var(--accent)]">
            <Database size={18} />
            <span className="text-xs font-semibold uppercase tracking-widest">Step 2 of 2</span>
          </div>
          <h2 className="text-3xl font-semibold text-[var(--text-primary)]">Choose your storage</h2>
          <p className="text-[var(--text-muted)] max-w-lg mx-auto">
            Pick any combination — a single provider, two, or all three. Selected backends appear in
            the sidebar and you can switch between them anytime.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-mono text-[var(--text-muted)]">
            {selected.length} of {SOURCES.length} selected
          </p>
          <button
            type="button"
            onClick={() => setSelected(allSelected ? [SOURCES[0]!.type] : ALL_PROVIDER_TYPES)}
            className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] hover:underline"
          >
            {allSelected ? 'Select one only' : 'Select all'}
          </button>
        </div>

        <div className="flex flex-col gap-3" role="group" aria-label="Storage backends">
          {SOURCES.map(({ type, title, emulator, endpoint }) => {
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
          At least one backend must stay selected. Change this later from connection settings.
        </p>
      </div>
    </OnboardingLayout>
  );
}

export function OnboardingView() {
  const step = usePreferencesStore((s) => s.onboardingStep);
  const setStep = usePreferencesStore((s) => s.setOnboardingStep);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (step === 1) setStep(2);
      else {
        const enabled = usePreferencesStore.getState().enabledProviders;
        if (enabled.length) applyOnboardingSources(enabled);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, setStep]);

  if (step === 2) {
    return <OnboardingStep2 onBack={() => setStep(1)} />;
  }

  return <OnboardingStep1 onContinue={() => setStep(2)} />;
}

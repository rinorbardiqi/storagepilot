import { ArrowRight, Check, Keyboard } from 'lucide-react';
import { StoragePilotLogo } from '../shared/StoragePilotLogo';
import { Button } from '../shared/Button';

export type OnboardingStepDef = { id: number; label: string };

const STEPS: OnboardingStepDef[] = [
  { id: 1, label: 'Welcome' },
  { id: 2, label: 'Storage' },
];

interface OnboardingLayoutProps {
  step: number;
  children: React.ReactNode;
  footerHint?: string;
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  showBack?: boolean;
  onSkip: () => void;
}

export function OnboardingLayout({
  step,
  children,
  footerHint = 'Press Enter to continue',
  onBack,
  onContinue,
  continueLabel = 'Continue',
  continueDisabled = false,
  showBack = true,
  onSkip,
}: OnboardingLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-[var(--bg-base)]">
      <header className="flex items-center h-16 px-8 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0">
        <div className="w-[464px] max-w-[30%]">
          <StoragePilotLogo />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-4">
            {STEPS.map((s, i) => {
              const active = s.id === step;
              const done = s.id < step;
              return (
                <div key={s.id} className="flex items-center gap-4">
                  {i > 0 && (
                    <div
                      className={`w-12 h-px ${done || active ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}
                    />
                  )}
                  <div
                    className={`flex items-center gap-2 ${!active && !done ? 'opacity-40' : ''}`}
                  >
                    <span
                      className={`flex items-center justify-center size-8 rounded-full text-sm font-semibold ${
                        active
                          ? 'bg-[var(--accent)] text-[var(--bg-base)]'
                          : done
                            ? 'border border-[var(--border)] text-[var(--text-primary)]'
                            : 'border border-[var(--border)] text-[var(--text-muted)]'
                      }`}
                    >
                      {done ? '✓' : s.id}
                    </span>
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        active ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="w-[464px] max-w-[30%] flex justify-end">
          <button
            type="button"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            onClick={onSkip}
          >
            Skip Setup
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto flex items-center justify-center bg-[var(--bg-base)]">
        {children}
      </main>

      <footer className="flex items-center justify-between h-24 px-12 border-t border-[var(--border)] bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-center gap-2 opacity-50">
          <Keyboard size={14} className="text-[var(--text-muted)]" />
          <span
            className="text-[10px] uppercase tracking-widest text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {footerHint}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {showBack && onBack && (
            <Button variant="outline" className="h-12 px-8" onClick={onBack}>
              Back
            </Button>
          )}
          <Button
            variant="accent"
            className="h-12 px-10 gap-3"
            onClick={onContinue}
            disabled={continueDisabled}
          >
            {continueLabel}
            {continueLabel === 'Complete Setup' ? <Check size={16} /> : <ArrowRight size={16} />}
          </Button>
        </div>
      </footer>
    </div>
  );
}

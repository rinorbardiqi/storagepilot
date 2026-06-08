import { RefreshCw } from 'lucide-react';
import { profileEndpoint } from '../../lib/providerAccent';
import { isDefaultProfileId } from '../../lib/reconcileProfiles';
import { useConnectionStore } from '../../store/connectionStore';
import { Button } from './Button';
import { ProviderChip } from './ProviderChip';

interface EmulatorHealthListProps {
  profileIds?: string[];
  showRetest?: boolean;
  compact?: boolean;
}

export function EmulatorHealthList({
  profileIds,
  showRetest = true,
  compact = false,
}: EmulatorHealthListProps) {
  const profiles = useConnectionStore((s) => s.profiles);
  const connectionStatus = useConnectionStore((s) => s.connectionStatus);
  const connectionErrors = useConnectionStore((s) => s.connectionErrors);
  const testConnection = useConnectionStore((s) => s.testConnection);

  const visible = profileIds
    ? profiles.filter((p) => profileIds.includes(p.id))
    : profiles.filter((p) => isDefaultProfileId(p.id) || connectionStatus[p.id] !== 'unconfigured');

  if (visible.length === 0) {
    return (
      <p className="text-xs text-[var(--text-muted)]">No connection profiles configured.</p>
    );
  }

  return (
    <ul className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'}`}>
      {visible.map((p) => {
        const status = connectionStatus[p.id] ?? 'unconfigured';
        const healthy = status === 'connected';
        const endpoint = profileEndpoint(p);
        const error = connectionErrors[p.id];

        return (
          <li
            key={p.id}
            className={`flex ${compact ? 'flex-col gap-1' : 'items-center justify-between'} p-3 border border-[var(--border)] bg-[var(--bg-base)] text-xs`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <ProviderChip type={p.type} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[var(--text-primary)] truncate">{p.name}</p>
                <p
                  className="text-[10px] font-mono text-[var(--text-muted)] truncate"
                  title={endpoint}
                >
                  {endpoint}
                </p>
                {error && (
                  <p className="text-[10px] text-[var(--error)] break-all mt-1" title={error}>
                    {error}
                  </p>
                )}
              </div>
            </div>
            <div className={`flex items-center gap-2 ${compact ? 'justify-between' : 'shrink-0'}`}>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  healthy
                    ? 'text-[var(--success)]'
                    : status === 'checking'
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--error)]'
                }`}
              >
                {status === 'checking'
                  ? 'Checking…'
                  : healthy
                    ? 'Healthy'
                    : status === 'unconfigured'
                      ? 'Unconfigured'
                      : 'Unavailable'}
              </span>
              {showRetest && (
                <Button
                  variant="outline"
                  className="!px-2 !py-1 !text-[9px]"
                  onClick={() => void testConnection(p.id, { force: true })}
                >
                  <RefreshCw size={10} />
                  Re-test
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

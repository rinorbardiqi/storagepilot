import { useEffect, useState } from 'react';
import type { CorsRule } from '../../api/types';
import { useBuckets } from '../../hooks/useBuckets';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { useToast } from '../../hooks/useToast';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';

const EMPTY_RULE: CorsRule = {
  origins: ['*'],
  methods: ['GET', 'HEAD'],
  headers: ['*'],
  maxAgeSeconds: 3600,
};

export function CorsEditorModal() {
  const active = useModalStore((s) => s.active.cors);
  const closeModal = useModalStore((s) => s.closeModal);
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const payload = typeof active === 'object' ? active : undefined;
  const { buckets, loading: bucketsLoading } = useBuckets();
  const toast = useToast();
  const [bucket, setBucket] = useState('');
  const [rules, setRules] = useState<CorsRule[]>([]);
  const [rawMode, setRawMode] = useState(false);
  const [rawJson, setRawJson] = useState('[]');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const provider = getActiveProvider();
  const providerType = provider?.type;
  const readOnly = providerType === 'azure' || providerType === 'gcs';

  useEffect(() => {
    if (!active) return;
    const initial = payload?.bucket ?? buckets[0]?.name ?? '';
    setBucket(initial);
  }, [active, payload?.bucket, buckets]);

  useEffect(() => {
    if (!bucket || !activeProfileId) {
      setRules([]);
      setRawJson('[]');
      return;
    }
    const p = getActiveProvider();
    if (!p) return;
    let cancelled = false;
    setLoading(true);
    void p
      .getCorsRules(bucket)
      .then((r) => {
        if (cancelled) return;
        setRules(r.length ? r : [{ ...EMPTY_RULE }]);
        setRawJson(JSON.stringify(r.length ? r : [EMPTY_RULE], null, 2));
      })
      .catch(() => {
        if (cancelled) return;
        setRules([{ ...EMPTY_RULE }]);
        setRawJson(JSON.stringify([EMPTY_RULE], null, 2));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bucket, activeProfileId, getActiveProvider]);

  const save = async () => {
    if (!provider || !bucket || readOnly) return;
    setSaving(true);
    try {
      const toSave = rawMode ? (JSON.parse(rawJson) as CorsRule[]) : rules;
      await provider.setCorsRules(bucket, toSave);
      toast.success('CORS rules saved');
      closeModal('cors');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save CORS');
    } finally {
      setSaving(false);
    }
  };

  const updateRule = (idx: number, patch: Partial<CorsRule>) => {
    setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const readOnlyMessage =
    providerType === 'azure'
      ? 'Azurite does not support CORS editing via the Blob API. CORS is handled by the nginx proxy.'
      : providerType === 'gcs'
        ? 'fake-gcs-server applies permissive CORS at the server level. Per-bucket CORS configuration is not supported by the emulator.'
        : null;

  return (
    <Modal
      isOpen={Boolean(active)}
      onClose={() => closeModal('cors')}
      title="CORS configuration"
      size="lg"
      footer={
        !readOnly ? (
          <>
            <Button onClick={() => closeModal('cors')}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => void save()}
              disabled={saving || loading || !bucket}
            >
              {saving ? 'Saving…' : 'Save rules'}
            </Button>
          </>
        ) : (
          <Button onClick={() => closeModal('cors')}>Close</Button>
        )
      }
    >
      {buckets.length > 0 ? (
        <label className="block mb-4">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Bucket</span>
          <select
            className="mt-1 w-full h-9 px-3 text-sm bg-[var(--bg-base)] border border-[var(--border)] rounded-[var(--radius)]"
            value={bucket}
            onChange={(e) => setBucket(e.target.value)}
          >
            {buckets.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="text-sm text-[var(--text-muted)] mb-4">
          {bucketsLoading
            ? 'Loading buckets…'
            : 'Create a bucket first to configure CORS rules.'}
        </p>
      )}

      {readOnlyMessage && (
        <p className="text-sm text-[var(--text-muted)] mb-4">{readOnlyMessage}</p>
      )}

      {bucket && loading && <p className="text-sm text-[var(--text-muted)]">Loading rules…</p>}
      {bucket && !loading && (
        <>
          <div className="flex gap-2 mb-4">
            <Button variant={rawMode ? 'ghost' : 'primary'} onClick={() => setRawMode(false)}>
              Visual
            </Button>
            <Button variant={rawMode ? 'primary' : 'ghost'} onClick={() => setRawMode(true)}>
              JSON
            </Button>
            {!readOnly && !rawMode && (
              <Button variant="outline" onClick={() => setRules((r) => [...r, { ...EMPTY_RULE }])}>
                Add rule
              </Button>
            )}
          </div>
          {rawMode ? (
            <textarea
              className="w-full h-64 p-3 text-xs font-mono bg-[var(--bg-base)] border border-[var(--border)] rounded-[var(--radius)]"
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              readOnly={readOnly}
            />
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {rules.map((rule, idx) => (
                <div key={idx} className="p-3 border border-[var(--border)] rounded-[var(--radius)] space-y-2">
                  <Input
                    label="Origins (comma-separated)"
                    value={rule.origins.join(', ')}
                    onChange={(e) =>
                      updateRule(idx, { origins: e.target.value.split(',').map((s) => s.trim()) })
                    }
                    disabled={readOnly}
                  />
                  <Input
                    label="Methods"
                    value={rule.methods.join(', ')}
                    onChange={(e) =>
                      updateRule(idx, { methods: e.target.value.split(',').map((s) => s.trim()) })
                    }
                    disabled={readOnly}
                  />
                  <Input
                    label="Headers"
                    value={rule.headers.join(', ')}
                    onChange={(e) =>
                      updateRule(idx, { headers: e.target.value.split(',').map((s) => s.trim()) })
                    }
                    disabled={readOnly}
                  />
                  <Input
                    label="Max age (seconds)"
                    type="number"
                    value={String(rule.maxAgeSeconds)}
                    onChange={(e) => updateRule(idx, { maxAgeSeconds: Number(e.target.value) })}
                    disabled={readOnly}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

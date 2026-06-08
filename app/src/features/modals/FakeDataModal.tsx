import { useEffect, useRef, useState } from 'react';
import { useBuckets } from '../../hooks/useBuckets';
import { refreshBuckets } from '../../store/bucketStore';
import { useAppStore } from '../../store/appStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { useToast } from '../../hooks/useToast';
import {
  createFakeFile,
  FAKE_DATA_KINDS,
  FAKE_DATA_PRESETS,
  parseSizeRange,
  type FakeDataKind,
  type FakeDataPreset,
} from '../../lib/fakeDataGenerator';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';

export function FakeDataModal() {
  const isOpen = useModalStore((s) => Boolean(s.active.fakeData));
  const closeModal = useModalStore((s) => s.closeModal);
  const payload = useModalStore((s) => s.active.fakeData);
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const connectionStatus = useConnectionStore((s) =>
    activeProfileId ? s.connectionStatus[activeProfileId] : undefined,
  );
  const currentBucket = useAppStore((s) => s.currentBucket);
  const currentPrefix = useAppStore((s) => s.currentPrefix);
  const invalidateObjects = useAppStore((s) => s.invalidateObjects);
  const { buckets, loading: bucketsLoading } = useBuckets();
  const toast = useToast();
  const openedRef = useRef(false);

  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [kind, setKind] = useState<FakeDataKind>('json');
  const [count, setCount] = useState(10);
  const [sizeRange, setSizeRange] = useState('512-4096');
  const [pattern, setPattern] = useState('record-{n}.json');
  const [prefix, setPrefix] = useState('');
  const [presetId, setPresetId] = useState<string>('custom');
  const [busy, setBusy] = useState(false);

  const payloadBucket =
    typeof payload === 'object' && payload?.bucket ? payload.bucket : null;

  useEffect(() => {
    if (!isOpen) {
      openedRef.current = false;
      return;
    }
    if (openedRef.current) return;
    openedRef.current = true;
    if (connectionStatus === 'connected') void refreshBuckets();
  }, [isOpen, connectionStatus]);

  useEffect(() => {
    if (!isOpen) return;
    const initial =
      payloadBucket ?? currentBucket ?? buckets[0]?.name ?? '';
    setSelectedBucket(initial);
    setPrefix(currentPrefix);
  }, [isOpen, payloadBucket, currentBucket, currentPrefix, buckets]);

  const onKindChange = (next: FakeDataKind) => {
    setKind(next);
    const def = FAKE_DATA_KINDS.find((k) => k.id === next)!;
    setPattern(def.defaultPattern);
    setSizeRange(def.defaultSizeRange);
  };

  const applyPreset = (preset: FakeDataPreset) => {
    setPresetId(preset.id);
    setPrefix(preset.prefix);
    if (preset.files.length === 1) {
      const f = preset.files[0]!;
      onKindChange(f.kind);
      setPattern(f.pattern);
      setCount(f.count);
      setSizeRange(f.sizeRange);
    }
  };

  const generate = async () => {
    const provider = getActiveProvider();
    if (!provider || !selectedBucket) {
      toast.error('Select a target bucket');
      return;
    }
    if (connectionStatus !== 'connected') {
      toast.error('Wait for the provider connection before generating data');
      return;
    }
    setBusy(true);
    try {
      let uploaded = 0;
      const preset = FAKE_DATA_PRESETS.find((p) => p.id === presetId);

      if (preset && presetId !== 'custom') {
        for (const spec of preset.files) {
          const { min, max } = parseSizeRange(spec.sizeRange);
          const basePrefix = prefix || preset.prefix;
          for (let n = 1; n <= spec.count; n++) {
            const name = spec.pattern.replace('{n}', String(n));
            const file = createFakeFile(spec.kind, n, name, min, max);
            const key = `${basePrefix}${spec.subpath ?? ''}${name}`;
            await provider.uploadObject(selectedBucket, key, file, {
              contentType: file.type,
            });
            uploaded++;
          }
        }
      } else {
        const { min, max } = parseSizeRange(sizeRange);
        for (let n = 1; n <= count; n++) {
          const name = pattern.replace('{n}', String(n));
          const file = createFakeFile(kind, n, name, min, max);
          await provider.uploadObject(selectedBucket, prefix + name, file, {
            contentType: file.type,
          });
          uploaded++;
        }
      }

      invalidateObjects();
      toast.success(`Generated ${uploaded} object(s) in ${selectedBucket}`);
      closeModal('fakeData');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setBusy(false);
    }
  };

  const kindDef = FAKE_DATA_KINDS.find((k) => k.id === kind)!;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => closeModal('fakeData')}
      title="Fake Data Generator"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => closeModal('fakeData')}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void generate()} disabled={!selectedBucket || busy}>
            {busy ? 'Generating…' : `Generate ${count} file${count !== 1 ? 's' : ''}`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">
            Target bucket
          </label>
          <select
            value={selectedBucket}
            onChange={(e) => setSelectedBucket(e.target.value)}
            disabled={bucketsLoading}
            className="w-full h-9 px-3 font-mono text-xs bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)]"
          >
            <option value="">Select bucket…</option>
            {buckets.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
          {!buckets.length && !bucketsLoading && (
            <p className="text-xs text-[var(--warning)] mt-1">Create a bucket first.</p>
          )}
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2 block">
            Scenario preset
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => setPresetId('custom')}
              className={`p-3 text-left border transition-colors ${
                presetId === 'custom'
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--accent)]/40'
              }`}
            >
              <p className="text-xs font-semibold">Custom</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Single type and pattern</p>
            </button>
            {FAKE_DATA_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`p-3 text-left border transition-colors ${
                  presetId === preset.id
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--accent)]/40'
                }`}
              >
                <p className="text-xs font-semibold">{preset.label}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2 block">
            Data type
          </label>
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${presetId !== 'custom' ? 'opacity-50 pointer-events-none' : ''}`}>
            {FAKE_DATA_KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => {
                  setPresetId('custom');
                  onKindChange(k.id);
                }}
                className={`p-3 text-left border transition-colors ${
                  kind === k.id
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--accent)]/40'
                }`}
              >
                <p className="text-xs font-semibold text-[var(--text-primary)]">{k.label}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-relaxed">{k.description}</p>
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Folder prefix (optional)"
          placeholder="testdata/"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Object count"
            type="number"
            value={String(count)}
            onChange={(e) => setCount(Math.max(1, Math.min(500, Number(e.target.value))))}
          />
          <Input
            label="Size range (bytes)"
            placeholder={kindDef.defaultSizeRange}
            value={sizeRange}
            onChange={(e) => setSizeRange(e.target.value)}
          />
        </div>

        <Input
          label="Filename pattern"
          placeholder={kindDef.defaultPattern}
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
        />

        <p className="text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border)] bg-[var(--bg-base)] p-2">
          Preview: {selectedBucket || '(bucket)'}/{prefix}
          {pattern.replace('{n}', '1')} · {kindDef.contentType}
        </p>
      </div>
    </Modal>
  );
}

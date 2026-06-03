import { useState } from 'react';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { useBuckets } from '../../hooks/useBuckets';
import { useToast } from '../../hooks/useToast';
import { downloadAsZip } from '../../lib/zip';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';

export function ExportImportModal() {
  const isOpen = useModalStore((s) => Boolean(s.active.exportImport));
  const closeModal = useModalStore((s) => s.closeModal);
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const { buckets } = useBuckets();
  const toast = useToast();
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [importFiles, setImportFiles] = useState<Array<{ path: string; blob: Blob }>>([]);

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const exportBuckets = async () => {
    const provider = getActiveProvider();
    if (!provider || selected.size === 0) return;
    setBusy(true);
    try {
      const files: Array<{ key: string; blob: Blob }> = [];
      for (const bucket of selected) {
        let token: string | undefined;
        do {
          const page = await provider.listObjects(bucket, { maxResults: 200, pageToken: token });
          for (const obj of page.objects) {
            if (obj.isFolder) continue;
            const blob = await provider.getObject(bucket, obj.key);
            files.push({ key: `${bucket}/${obj.key}`, blob });
          }
          token = page.nextPageToken;
        } while (token);
      }
      await downloadAsZip(files, 'storagepilot-export.zip');
      toast.success(`Exported ${files.length} object(s)`);
      closeModal('exportImport');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  const onImportZip = async (file: File) => {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(file);
    const entries: Array<{ path: string; blob: Blob }> = [];
    for (const [path, entry] of Object.entries(zip.files)) {
      if (!entry.dir) {
        const blob = await entry.async('blob');
        entries.push({ path, blob });
      }
    }
    setImportFiles(entries);
  };

  const confirmImport = async () => {
    const provider = getActiveProvider();
    if (!provider || importFiles.length === 0) return;
    setBusy(true);
    try {
      for (const { path, blob } of importFiles) {
        const slash = path.indexOf('/');
        if (slash === -1) continue;
        const bucket = path.slice(0, slash);
        const key = path.slice(slash + 1);
        const file = new File([blob], key.split('/').pop() ?? key, {
          type: blob.type || 'application/octet-stream',
        });
        await provider.uploadObject(bucket, key, file);
      }
      toast.success(`Imported ${importFiles.length} object(s)`);
      closeModal('exportImport');
      setImportFiles([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => closeModal('exportImport')}
      title="Export / import emulator state"
      size="lg"
      footer={
        tab === 'export' ? (
          <Button variant="primary" onClick={() => void exportBuckets()} disabled={selected.size === 0 || busy}>
            {busy ? 'Exporting…' : `Export ${selected.size} bucket(s)`}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => void confirmImport()}
            disabled={importFiles.length === 0 || busy}
          >
            {busy ? 'Importing…' : `Import ${importFiles.length} file(s)`}
          </Button>
        )
      }
    >
      <div className="flex gap-1 mb-4 border-b border-[var(--border)]">
        {(['export', 'import'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`px-3 py-2 text-sm capitalize border-b-2 -mb-px ${
              tab === t ? 'border-[var(--accent)]' : 'border-transparent text-[var(--text-muted)]'
            }`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'export' ? (
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {buckets.map((b) => (
            <li key={b.name}>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={selected.has(b.name)} onChange={() => toggle(b.name)} />
                <span className="font-mono">{b.name}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-4">
          <input
            type="file"
            accept=".zip"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImportZip(f);
            }}
          />
          {importFiles.length > 0 && (
            <ul className="text-xs font-mono max-h-48 overflow-y-auto border border-[var(--border)] p-2">
              {importFiles.slice(0, 50).map((f) => (
                <li key={f.path}>{f.path}</li>
              ))}
              {importFiles.length > 50 && (
                <li className="text-[var(--text-muted)]">…and {importFiles.length - 50} more</li>
              )}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}

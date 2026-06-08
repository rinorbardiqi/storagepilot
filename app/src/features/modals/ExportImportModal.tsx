import { useEffect, useState } from 'react';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { useBuckets } from '../../hooks/useBuckets';
import { useToast } from '../../hooks/useToast';
import {
  createSnapshotManifest,
  objectManifestKey,
  parseSnapshotManifest,
  SNAPSHOT_MANIFEST_FILE,
  snapshotManifestToJson,
  type SnapshotBucketEntry,
  type SnapshotObjectEntry,
} from '../../lib/snapshotManifest';
import { countImportablePaths, countImportOverwrites } from '../../lib/importHelpers';
import { downloadAsZip } from '../../lib/zip';
import { useTransferStore } from '../../store/transferStore';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';

export function ExportImportModal() {
  const active = useModalStore((s) => s.active.exportImport);
  const isOpen = Boolean(active);
  const payload = typeof active === 'object' ? active : undefined;
  const closeModal = useModalStore((s) => s.closeModal);
  const openModal = useModalStore((s) => s.openModal);
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const profiles = useConnectionStore((s) => s.profiles);
  const profile = profiles.find((p) => p.id === activeProfileId);
  const { buckets } = useBuckets();
  const toast = useToast();
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [importFiles, setImportFiles] = useState<Array<{ path: string; blob: Blob }>>([]);
  const [importManifest, setImportManifest] = useState<ReturnType<typeof parseSnapshotManifest>>(null);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTab(payload?.tab ?? 'export');
      if (payload?.buckets?.length) {
        setSelected(new Set(payload.buckets));
      }
    } else {
      // Clear import state when modal closes so reopening starts fresh.
      setImportFiles([]);
      setImportManifest(null);
      setSelected(new Set());
      setProgress('');
    }
  }, [isOpen, payload?.tab]);

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
    if (!provider || !profile || !activeProfileId || selected.size === 0) return;
    setBusy(true);
    setProgress('');
    const transfer = useTransferStore.getState();
    const bucketList = [...selected];
    const jobId = transfer.createJob({
      kind: 'export',
      label: `Export ${bucketList.length} bucket(s)`,
      sourceProfileId: activeProfileId,
      items: bucketList.map((name) => ({ key: name, status: 'pending' as const })),
    });
    try {
      const files: Array<{ key: string; blob: Blob }> = [];
      const bucketEntries: SnapshotBucketEntry[] = [];

      for (const bucketName of bucketList) {
        transfer.updateItem(jobId, bucketName, { status: 'running' });
        const objects: SnapshotObjectEntry[] = [];
        let token: string | undefined;
        let listed = 0;
        try {
          do {
            const page = await provider.listObjects(bucketName, { maxResults: 200, pageToken: token });
            for (const obj of page.objects) {
              if (obj.isFolder) continue;
              listed++;
              setProgress(`Exporting ${bucketName} (${listed})…`);
              const meta = await provider.getObjectMetadata(bucketName, obj.key).catch(() => null);
              const blob = await provider.getObject(bucketName, obj.key);
              const zipPath = `${bucketName}/${obj.key}`;
              files.push({ key: zipPath, blob });
              objects.push({
                key: obj.key,
                contentType: meta?.contentType ?? obj.contentType ?? (blob.type || 'application/octet-stream'),
                customMetadata: meta?.customMetadata,
              });
            }
            token = page.nextPageToken;
          } while (token);

          let cors;
          try {
            cors = await provider.getCorsRules(bucketName);
          } catch {
            cors = undefined;
          }
          bucketEntries.push({ name: bucketName, cors, objects });
          transfer.updateItem(jobId, bucketName, { status: 'done' });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Export failed';
          transfer.updateItem(jobId, bucketName, { status: 'error', error: msg });
          throw err;
        }
      }

      const manifest = createSnapshotManifest(
        provider.type,
        activeProfileId,
        profile.name,
        bucketEntries,
      );
      await downloadAsZip(files, 'storagepilot-snapshot.zip', snapshotManifestToJson(manifest));
      transfer.finishJob(jobId, 'done');
      toast.success(`Exported snapshot with ${files.length} object(s)`);
      closeModal('exportImport');
    } catch (err) {
      transfer.finishJob(jobId, 'error', err instanceof Error ? err.message : 'Export failed');
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  const onImportZip = async (file: File) => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(file);
      const entries: Array<{ path: string; blob: Blob }> = [];
      let manifestRaw: string | null = null;

      for (const [path, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue;
        // Reject paths that could escape the zip root (zip-slip prevention).
        const normalised = path.replace(/\\/g, '/').replace(/^\/+/, '');
        if (normalised.includes('../') || normalised.startsWith('/')) continue;
        if (path === SNAPSHOT_MANIFEST_FILE) {
          manifestRaw = await entry.async('string');
          continue;
        }
        const blob = await entry.async('blob');
        entries.push({ path: normalised, blob });
      }
      setImportFiles(entries);
      setImportManifest(manifestRaw ? parseSnapshotManifest(manifestRaw) : null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to read ZIP file');
      setImportFiles([]);
      setImportManifest(null);
    }
  };

  const confirmImport = async () => {
    const provider = getActiveProvider();
    if (!provider || importFiles.length === 0) return;
    setBusy(true);
    const transfer = useTransferStore.getState();
    const jobId = transfer.createJob({
      kind: 'import',
      label: `Import ${importFiles.length} file(s)`,
      sourceProfileId: activeProfileId ?? undefined,
      items: importFiles.map((f) => ({ key: f.path, status: 'pending' as const })),
    });
    let succeeded = 0;
    let failed = 0;
    try {
      const metaByPath = new Map<string, SnapshotObjectEntry>();
      if (importManifest) {
        for (const bucket of importManifest.buckets) {
          for (const obj of bucket.objects) {
            metaByPath.set(objectManifestKey(bucket.name, obj.key), obj);
          }
        }
      }

      const bucketNames = new Set<string>();
      for (const { path } of importFiles) {
        const slash = path.indexOf('/');
        if (slash > 0) bucketNames.add(path.slice(0, slash));
      }
      if (importManifest) {
        for (const b of importManifest.buckets) bucketNames.add(b.name);
      }

      const existing = new Set((await provider.listBuckets()).map((b) => b.name));
      for (const name of bucketNames) {
        if (!existing.has(name)) {
          await provider.createBucket(name);
        }
      }

      let done = 0;
      for (const { path, blob } of importFiles) {
        done++;
        setProgress(`Importing ${done}/${importFiles.length}…`);
        const slash = path.indexOf('/');
        if (slash === -1) {
          transfer.updateItem(jobId, path, { status: 'error', error: 'Invalid path' });
          failed++;
          continue;
        }
        const bucket = path.slice(0, slash);
        const key = path.slice(slash + 1);
        transfer.updateItem(jobId, path, { status: 'running' });
        try {
          const meta = metaByPath.get(path);
          const file = new File([blob], key.split('/').pop() ?? key, {
            type: meta?.contentType ?? (blob.type || 'application/octet-stream'),
          });
          await provider.uploadObject(bucket, key, file, {
            contentType: meta?.contentType,
            customMetadata: meta?.customMetadata,
          });
          transfer.updateItem(jobId, path, { status: 'done' });
          succeeded++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Import failed';
          transfer.updateItem(jobId, path, { status: 'error', error: msg });
          failed++;
        }
      }

      if (importManifest) {
        for (const bucket of importManifest.buckets) {
          if (bucket.cors?.length) {
            try {
              await provider.setCorsRules(bucket.name, bucket.cors);
            } catch {
              /* emulator may not support CORS write */
            }
          }
        }
      }

      if (failed === 0) transfer.finishJob(jobId, 'done');
      else if (succeeded > 0) transfer.finishJob(jobId, 'partial');
      else transfer.finishJob(jobId, 'error');

      if (failed === 0) {
        toast.success(
          importManifest
            ? `Imported snapshot (${importManifest.profileName}, ${succeeded} objects)`
            : `Imported ${succeeded} object(s)`,
        );
        closeModal('exportImport');
        setImportFiles([]);
        setImportManifest(null);
      } else if (succeeded > 0) {
        toast.warning(`${succeeded} imported, ${failed} failed — see Transfer Center`);
      } else {
        toast.error('Import failed — see Transfer Center');
      }
    } catch (err) {
      transfer.finishJob(jobId, 'error', err instanceof Error ? err.message : 'Import failed');
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => closeModal('exportImport')}
      title="Snapshot manager"
      size="lg"
      footer={
        tab === 'export' ? (
          <Button variant="primary" onClick={() => void exportBuckets()} disabled={selected.size === 0 || busy}>
            {busy ? progress || 'Exporting…' : `Export ${selected.size} bucket(s)`}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => {
              const provider = getActiveProvider();
              if (!provider || importFiles.length === 0) return;
              const importable = countImportablePaths(importFiles);
              if (importable === 0) {
                toast.error(
                  'ZIP entries must use bucket/object paths (e.g. my-bucket/file.txt). Re-export from StoragePilot or add a bucket prefix to each file.',
                );
                return;
              }
              void (async () => {
                try {
                  const overwrites = await countImportOverwrites(provider, importFiles);
                  if (overwrites > 0) {
                    openModal('bulkConfirm', {
                      count: overwrites,
                      label: `Import will overwrite ${overwrites} existing object(s). Continue?`,
                      confirmLabel: 'Import anyway',
                      onConfirm: () => void confirmImport(),
                    });
                  } else {
                    void confirmImport();
                  }
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : 'Could not check existing objects before import',
                  );
                }
              })();
            }}
            disabled={importFiles.length === 0 || busy}
          >
            {busy ? progress || 'Importing…' : `Import ${importFiles.length} file(s)`}
          </Button>
        )
      }
    >
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Snapshots include a <code className="font-mono">manifest.json</code> with bucket configs, CORS
        rules, and object metadata. Legacy zip exports without a manifest still import as object data only.
      </p>
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
          {importManifest && (
            <p className="text-xs text-[var(--success)] font-mono">
              Manifest v{importManifest.version} · {importManifest.provider} ·{' '}
              {importManifest.buckets.length} bucket(s)
            </p>
          )}
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

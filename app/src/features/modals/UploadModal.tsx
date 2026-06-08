import { useState } from 'react';
import { CloudUpload, File as FileIconLucide, FolderOpen, X } from 'lucide-react';
import { formatBytes } from '../../lib/formatBytes';
import { useAppStore } from '../../store/appStore';
import { useModalStore } from '../../store/modalStore';
import { useUploadStore } from '../../store/uploadStore';
import { useToast } from '../../hooks/useToast';
import { FileIcon } from '../shared/FileIcon';
import { Modal } from '../shared/Modal';
import { Input } from '../shared/Input';

type UploadTab = 'files' | 'url';

export function UploadModal() {
  const isOpen = useModalStore((s) => Boolean(s.active.upload));
  const closeModal = useModalStore((s) => s.closeModal);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const currentPrefix = useAppStore((s) => s.currentPrefix);
  const addToQueue = useUploadStore((s) => s.addToQueue);
  const removeItem = useUploadStore((s) => s.removeItem);
  const processUploads = useUploadStore((s) => s.processUploads);
  const queue = useUploadStore((s) => s.queue);
  const toast = useToast();
  const [tab, setTab] = useState<UploadTab>('files');
  const [url, setUrl] = useState('');
  const [urlName, setUrlName] = useState('');
  const [busy, setBusy] = useState(false);

  const bucketQueue = currentBucket ? queue.filter((i) => i.bucket === currentBucket) : [];

  const fetchFromUrl = async () => {
    if (!url.trim() || !currentBucket) return;
    setBusy(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const name = urlName.trim() || url.split('/').pop()?.split('?')[0] || 'download';
      const file = new File([blob], name, { type: blob.type || 'application/octet-stream' });
      addToQueue([
        {
          id: crypto.randomUUID(),
          file,
          bucket: currentBucket,
          key: currentPrefix + name,
          contentType: file.type,
          status: 'staged' as const,
          progress: 0,
          bytesUploaded: 0,
        },
      ]);
      toast.success('Added URL to upload queue');
      setTab('files');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch URL');
    } finally {
      setBusy(false);
    }
  };

  const onFiles = (files: FileList | null) => {
    if (!files?.length || !currentBucket) return;
    addToQueue(
      Array.from(files).map((file) => ({
        id: crypto.randomUUID(),
        file,
        bucket: currentBucket,
        key: currentPrefix + file.name,
        contentType: file.type,
        status: 'staged' as const,
        progress: 0,
        bytesUploaded: 0,
      })),
    );
  };

  const startUpload = async () => {
    if (!currentBucket) return;
    const { uploaded, failed } = await processUploads({ bucket: currentBucket });
    if (uploaded > 0) toast.success(`Uploaded ${uploaded} file${uploaded !== 1 ? 's' : ''}`);
    if (failed > 0) toast.error(`${failed} upload${failed !== 1 ? 's' : ''} failed`);
    if (uploaded > 0 || failed === 0) closeModal('upload');
  };

  const pendingCount = bucketQueue.filter((i) => i.status === 'staged' || i.status === 'uploading').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => closeModal('upload')}
      title="Upload Objects"
      size="xl"
      headerIcon={<CloudUpload size={18} className="text-[var(--accent)]" />}
      footer={
        <>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
            <FolderOpen size={12} />
            Target: /{currentPrefix || ''}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-xs uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              onClick={() => closeModal('upload')}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pendingCount === 0}
              onClick={() => void startUpload()}
              className="h-10 px-6 bg-[var(--accent)] text-[var(--bg-base)] text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
            >
              Start Upload ({pendingCount})
            </button>
          </div>
        </>
      }
    >
      <div className="flex justify-end mb-4">
        <div className="inline-flex border border-[var(--border)] p-0.5 bg-[var(--bg-base)]">
          {(['files', 'url'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                tab === t
                  ? 'bg-[var(--accent)] text-[var(--bg-base)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              onClick={() => setTab(t)}
            >
              {t === 'files' ? 'Files' : 'From URL'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'files' ? (
        <>
          <div
            className="border-2 border-dashed border-[var(--border)] p-10 text-center mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          >
            <FileIconLucide size={28} className="mx-auto mb-3 text-[var(--text-muted)]" />
            <input
              type="file"
              multiple
              className="hidden"
              id="upload-input"
              onChange={(e) => onFiles(e.target.files)}
            />
            <label htmlFor="upload-input" className="cursor-pointer text-sm text-[var(--text-muted)]">
              Drag and drop files or{' '}
              <span className="text-[var(--accent)] underline">browse local files</span>
            </label>
            <p className="text-[10px] uppercase text-[var(--text-muted)] mt-2 tracking-wider">
              Max size: 5GB per object
            </p>
          </div>

          {bucketQueue.length > 0 && (
            <ul className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {bucketQueue.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-[var(--bg-base)] border border-[var(--border)]"
                >
                  <FileIcon
                    object={{
                      key: item.key,
                      size: item.file.size,
                      contentType: item.contentType,
                      lastModified: new Date(),
                      isFolder: false,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono truncate">{item.file.name}</p>
                    {item.status === 'uploading' && (
                      <div className="mt-2 h-1 bg-[var(--bg-elevated)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)]"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">
                    {item.status === 'uploading'
                      ? `${formatBytes(item.bytesUploaded || item.file.size * (item.progress / 100))} / ${formatBytes(item.file.size)}`
                      : item.status === 'staged'
                        ? 'PENDING'
                        : item.status.toUpperCase()}
                  </span>
                  {item.status === 'staged' && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-[var(--text-muted)] hover:text-[var(--error)]"
                    >
                      <X size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <Input label="URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          <Input
            label="Filename (optional)"
            value={urlName}
            onChange={(e) => setUrlName(e.target.value)}
            placeholder="my-file.png"
          />
          <button
            type="button"
            disabled={!url.trim() || !currentBucket || busy}
            onClick={() => void fetchFromUrl()}
            className="h-9 px-4 bg-[var(--accent)] text-[var(--bg-base)] text-xs font-semibold uppercase disabled:opacity-50"
          >
            {busy ? 'Fetching…' : 'Fetch & queue'}
          </button>
        </div>
      )}
    </Modal>
  );
}

import { useEffect, useState } from 'react';
import { Code2, Copy, Download, Trash2 } from 'lucide-react';
import type { ObjectMetadata, StorageObject } from '../../api/types';
import { formatBytes } from '../../lib/formatBytes';
import { formatDate } from '../../lib/formatDate';
import { getPreviewKind } from '../../lib/contentTypeIcons';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { useObjectActions } from '../../hooks/useObjectActions';
import { useObjectBlob } from '../../hooks/useObjectBlob';
import { Button } from '../shared/Button';
import { FileIcon } from '../shared/FileIcon';
import { ObjectPreview } from './preview/ObjectPreview';

export function MetadataTab({ object, bucket }: { object: StorageObject; bucket: string }) {
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const openModal = useModalStore((s) => s.openModal);
  const { downloadOne, deleteOne } = useObjectActions();
  const provider = getActiveProvider();
  const previewKind = getPreviewKind(object.key, object.contentType);
  const compactPreviewEnabled = object.size <= 10 * 1024 * 1024;
  const { blob, url, contentType, loading, error } = useObjectBlob(bucket, object.key, object.contentType, {
    enabled: compactPreviewEnabled,
  });

  const [metadata, setMetadata] = useState<ObjectMetadata | null>(null);
  const [imageSize, setImageSize] = useState<string | null>(null);

  const publicUrl = provider?.getObjectUrl(bucket, object.key) ?? '';
  const paths = provider?.getPathFormats(bucket, object.key);

  useEffect(() => {
    const p = getActiveProvider();
    if (!p) return;
    let cancelled = false;
    void p
      .getObjectMetadata(bucket, object.key)
      .then((m) => {
        if (!cancelled) setMetadata(m);
      })
      .catch(() => {
        if (!cancelled) setMetadata(null);
      });
    return () => {
      cancelled = true;
    };
  }, [bucket, object.key, getActiveProvider]);

  useEffect(() => {
    if (previewKind !== 'image' || !url) return;
    const img = new Image();
    img.onload = () => setImageSize(`${img.naturalWidth} × ${img.naturalHeight} px`);
    img.src = url;
  }, [previewKind, url]);

  const rows: Array<[string, string]> = [
    ['Object ID', object.key],
    ['ETag', metadata?.etag ?? object.etag ?? '—'],
    ['Created', formatDate(metadata?.lastModified ?? object.lastModified)],
    ['Size', formatBytes(metadata?.size ?? object.size)],
    ['Content-Type', metadata?.contentType ?? object.contentType],
  ];

  const customMeta = metadata?.customMetadata ?? {};
  const customRows = Object.entries(customMeta);

  const copy = (text: string) => void navigator.clipboard.writeText(text);

  return (
    <div className="flex flex-col gap-5">
      <div className="relative aspect-video bg-[var(--bg-base)] border border-[var(--border)] flex items-center justify-center overflow-hidden">
        {loading ? (
          <p className="text-xs text-[var(--text-muted)]">Loading preview…</p>
        ) : error || !blob ? (
          <div className="text-center p-4">
            <div className="mx-auto mb-2 w-fit">
              <FileIcon object={object} size={24} />
            </div>
            <p className="font-mono text-xs truncate">{object.key.split('/').pop()}</p>
            {!compactPreviewEnabled && (
              <p className="text-[10px] text-[var(--text-muted)] mt-2">Open Preview tab for large files</p>
            )}
          </div>
        ) : (
          <div className="w-full h-full p-2">
            <ObjectPreview
              object={object}
              blob={blob}
              url={url}
              contentType={contentType}
              previewKind={previewKind}
              compact
            />
          </div>
        )}
        {imageSize && (
          <p className="absolute bottom-2 right-2 text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface)]/90 px-1.5 py-0.5">
            {imageSize}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            System Metadata
          </p>
        </div>
        <table className="w-full text-xs">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-b border-[var(--border)]">
                <td className="py-2 pr-3 text-[var(--text-muted)] align-top w-24">{k}</td>
                <td className="py-2 font-mono break-all text-[11px]">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {customRows.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Custom Metadata
          </p>
          <table className="w-full text-xs">
            <tbody>
              {customRows.map(([k, v]) => (
                <tr key={k} className="border-b border-[var(--border)]">
                  <td className="py-2 pr-3 text-[var(--text-muted)] align-top w-24">{k}</td>
                  <td className="py-2 font-mono break-all text-[11px]">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
          Access Control
        </p>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          IAM and ACL details are not exposed by local emulators. Use the provider console or CLI for
          production buckets.
        </p>
        <Button variant="outline" className="w-full text-[10px] uppercase" onClick={() => openModal('permissions', { bucket })}>
          Manage Permissions
        </Button>
      </div>

      {publicUrl && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Object URL
          </p>
          <div className="flex items-center gap-2 p-2 bg-[var(--bg-base)] border border-[var(--border)]">
            <code className="flex-1 text-[10px] font-mono truncate text-[var(--text-muted)]">{publicUrl}</code>
            <button type="button" onClick={() => copy(publicUrl)} className="text-[var(--text-muted)] hover:text-[var(--accent)]">
              <Copy size={12} />
            </button>
          </div>
          {paths && paths.native !== publicUrl && (
            <p className="text-[10px] font-mono text-[var(--text-muted)] mt-2 truncate" title={paths.native}>
              {paths.native}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
        <Button variant="outline" onClick={() => void downloadOne(object.key)}>
          <Download size={14} />
          Download
        </Button>
        <Button
          variant="outline"
          onClick={() => openModal('snippet', { bucket, key: object.key, operation: 'download' })}
        >
          <Code2 size={14} />
          SDK snippet
        </Button>
        <Button variant="danger" onClick={() => deleteOne(object.key)}>
          <Trash2 size={14} />
          Delete
        </Button>
      </div>
    </div>
  );
}

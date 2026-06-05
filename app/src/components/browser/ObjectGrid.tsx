import { useEffect, useState } from 'react';
import { formatBytes } from '../../lib/formatBytes';
import { getPreviewKind } from '../../lib/contentTypeIcons';
import { objectDisplayName } from '../../lib/objectKey';
import { useAppStore } from '../../store/appStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useUiStore } from '../../store/uiStore';
import { useBrowserRows } from '../../hooks/useBrowserRows';
import { FileIcon } from '../shared/FileIcon';
import type { StorageObject } from '../../api/types';

interface ObjectGridProps {
  objects: StorageObject[];
  prefixes: string[];
  onNavigatePrefix: (prefix: string) => void;
}

function GridThumbnail({ object, bucket }: { object: StorageObject; bucket: string }) {
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const previewKind = getPreviewKind(object.key, object.contentType);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    if (previewKind !== 'image') return;
    const provider = getActiveProvider();
    if (!provider) return;

    let objectUrl: string | null = null;
    let cancelled = false;

    void provider
      .getObject(bucket, object.key)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setThumbUrl(objectUrl);
      })
      .catch(() => {
        // Thumbnail fetch failed — fall back to icon silently.
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [bucket, object.key, object.contentType, previewKind, getActiveProvider, activeProfileId]);

  if (thumbUrl) {
    return (
      <div className="w-12 h-12 rounded border border-[var(--border)] overflow-hidden bg-[var(--bg-base)] flex items-center justify-center">
        <img src={thumbUrl} alt="" className="max-w-full max-h-full object-contain" />
      </div>
    );
  }

  return <FileIcon object={object} size={28} />;
}

export function ObjectGrid({ objects, prefixes, onNavigatePrefix }: ObjectGridProps) {
  const openDetail = useUiStore((s) => s.openDetail);
  const currentBucket = useAppStore((s) => s.currentBucket);

  const { rows, isEmpty, query } = useBrowserRows(objects, prefixes);

  if (isEmpty) {
    return (
      <div className="p-8 text-center text-sm text-[var(--text-muted)]">
        {query ? `No objects matching "${query}"` : 'No objects in this prefix'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
      {rows.map((obj) => {
        const { isFolder } = obj;
        return (
          <button
            key={obj.key}
            type="button"
            className="flex flex-col items-center gap-2 p-4 border border-[var(--border)] rounded-[var(--radius)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-left"
            onClick={() => (isFolder ? onNavigatePrefix(obj.key) : openDetail(obj))}
          >
            {isFolder || !currentBucket ? (
              <FileIcon object={obj} size={28} />
            ) : (
              <GridThumbnail object={obj} bucket={currentBucket} />
            )}
            <span className="font-mono text-xs truncate w-full text-center" title={obj.key}>
              {objectDisplayName(obj.key)}
            </span>
            {!isFolder && (
              <span className="text-xs text-[var(--text-muted)]">{formatBytes(obj.size)}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

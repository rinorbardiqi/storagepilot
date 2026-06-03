import { useEffect, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import type { StorageObject } from '../../api/types';
import { isImage, isText } from '../../lib/contentTypeIcons';
import { downloadBlob, filenameFromKey } from '../../lib/download';
import { useConnectionStore } from '../../store/connectionStore';
import { useObjectActions } from '../../hooks/useObjectActions';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';

export function PreviewTab({ object, bucket }: { object: StorageObject; bucket: string }) {
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const { downloadOne } = useObjectActions();
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const provider = getActiveProvider();
    if (!provider) return;

    let cancelled = false;
    setBlob(null);
    setUrl(null);
    setError(null);

    void provider
      .getObject(bucket, object.key)
      .then((b) => {
        if (cancelled) return;
        setBlob(b);
        if (isImage(object.contentType)) {
          setUrl(URL.createObjectURL(b));
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      });

    return () => {
      cancelled = true;
    };
  }, [bucket, object.key, object.contentType, getActiveProvider]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  if (error) return <p className="text-sm text-[var(--error)]">{error}</p>;
  if (!blob) return <p className="text-sm text-[var(--text-muted)]">Loading preview…</p>;

  const canFullscreen = isImage(object.contentType) || isText(object.contentType) || object.contentType === 'application/json';
  const displayName = object.key.split('/').pop() ?? object.key;

  const actions = (
    <div className="flex items-center justify-center gap-2 mt-3">
      {canFullscreen && (
        <Button variant="outline" onClick={() => setFullscreen(true)}>
          <Maximize2 size={14} />
          Fullscreen
        </Button>
      )}
      <Button variant="outline" onClick={() => void downloadOne(object.key)}>
        Download
      </Button>
    </div>
  );

  const fullscreenBody =
    isImage(object.contentType) && url ? (
      <img
        src={url}
        alt={object.key}
        className="max-w-full max-h-full object-contain"
      />
    ) : (
      <TextPreview blob={blob} fullscreen />
    );

  return (
    <>
      {isImage(object.contentType) && url ? (
        <div>
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="block w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-base)] p-2 hover:border-[var(--accent)]/40 transition-colors"
            title="Open fullscreen preview"
          >
            <img src={url} alt={object.key} className="max-w-full max-h-64 object-contain mx-auto" />
          </button>
          {actions}
        </div>
      ) : isText(object.contentType) || object.contentType === 'application/json' ? (
        <div>
          <TextPreview blob={blob} />
          {actions}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-[var(--text-muted)] mb-3">No preview for {object.contentType}</p>
          <Button variant="outline" onClick={() => void downloadOne(object.key)}>
            Download
          </Button>
        </div>
      )}

      <Modal
        isOpen={fullscreen}
        onClose={() => setFullscreen(false)}
        title={displayName}
        size="viewport"
        contentClassName={
          isImage(object.contentType) && url
            ? 'flex items-center justify-center overflow-hidden bg-[var(--bg-base)] p-2'
            : 'flex flex-col overflow-hidden bg-[var(--bg-base)]'
        }
        footer={
          <Button variant="outline" onClick={() => downloadBlob(blob, filenameFromKey(object.key))}>
            Download
          </Button>
        }
      >
        {fullscreenBody}
      </Modal>
    </>
  );
}

function TextPreview({ blob, fullscreen }: { blob: Blob; fullscreen?: boolean }) {
  const [text, setText] = useState('');
  useEffect(() => {
    void blob.text().then(setText);
  }, [blob]);

  const limit = fullscreen ? 500_000 : 8000;
  const truncated = text.length > limit;

  return (
    <pre
      className={`text-xs font-mono p-3 bg-[var(--bg-base)] overflow-auto whitespace-pre-wrap ${
        fullscreen ? 'h-full w-full border-0 rounded-none' : 'max-h-64 border border-[var(--border)] rounded-[var(--radius)]'
      }`}
    >
      {text.slice(0, limit)}
      {truncated ? '\n\n… truncated for preview' : ''}
    </pre>
  );
}

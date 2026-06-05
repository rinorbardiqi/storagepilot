import { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import type { StorageObject } from '../../api/types';
import type { PreviewKind } from '../../lib/contentTypeIcons';
import { useObjectBlob } from '../../hooks/useObjectBlob';
import { useObjectActions } from '../../hooks/useObjectActions';
import { downloadBlob, filenameFromKey } from '../../lib/download';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import { ObjectPreview } from './preview/ObjectPreview';

function fullscreenModalClass(previewKind: PreviewKind): string {
  if (previewKind === 'image' || previewKind === 'video') {
    return 'flex flex-1 min-h-0 items-center justify-center overflow-hidden bg-[var(--bg-base)] p-2';
  }
  if (previewKind === 'audio' || previewKind === 'archive') {
    return 'flex flex-1 min-h-0 items-center justify-center overflow-auto bg-[var(--bg-base)] p-6';
  }
  return 'flex flex-1 min-h-0 flex-col overflow-hidden bg-[var(--bg-base)]';
}

export function PreviewTab({ object, bucket }: { object: StorageObject; bucket: string }) {
  const { downloadOne } = useObjectActions();
  const { blob, url, contentType, previewKind, loading, error } = useObjectBlob(
    bucket,
    object.key,
    object.contentType,
  );
  const [fullscreen, setFullscreen] = useState(false);

  if (error) return <p className="text-sm text-[var(--error)]">{error}</p>;
  if (loading || !blob) return <p className="text-sm text-[var(--text-muted)]">Loading preview…</p>;

  const displayName = object.key.split('/').pop() ?? object.key;

  const actions = (
    <div className="flex items-center justify-center gap-2 mt-3">
      <Button variant="outline" onClick={() => setFullscreen(true)}>
        <Maximize2 size={14} />
        Fullscreen
      </Button>
      <Button variant="outline" onClick={() => void downloadOne(object.key)}>
        Download
      </Button>
    </div>
  );

  return (
    <>
      <div>
        <ObjectPreview
          object={object}
          blob={blob}
          url={url}
          contentType={contentType}
          previewKind={previewKind}
          onOpenFullscreen={() => setFullscreen(true)}
        />
        {actions}
      </div>

      <Modal
        isOpen={fullscreen}
        onClose={() => setFullscreen(false)}
        title={displayName}
        size="viewport"
        contentClassName={fullscreenModalClass(previewKind)}
        footer={
          <Button variant="outline" onClick={() => downloadBlob(blob, filenameFromKey(object.key))}>
            Download
          </Button>
        }
      >
        <ObjectPreview
          object={object}
          blob={blob}
          url={url}
          contentType={contentType}
          previewKind={previewKind}
          fullscreen
        />
      </Modal>
    </>
  );
}

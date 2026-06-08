import { Archive } from 'lucide-react';
import { formatBytes } from '../../../lib/formatBytes';
import { FileIcon } from '../../shared/FileIcon';
import type { StorageObject } from '../../../api/types';

interface ArchivePreviewProps {
  object: StorageObject;
  fullscreen?: boolean;
}

export function ArchivePreview({ object, fullscreen }: ArchivePreviewProps) {
  return (
    <div
      className={`text-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-base)] ${
        fullscreen ? 'py-16 px-12 max-w-lg' : 'py-6'
      }`}
    >
      <div className="mx-auto mb-3 w-fit">
        <Archive size={fullscreen ? 48 : 32} className="text-[#ff9900]" />
      </div>
      <p className={`font-mono mb-1 ${fullscreen ? 'text-sm' : 'text-xs'}`}>
        {object.key.split('/').pop()}
      </p>
      <p className="text-xs text-[var(--text-muted)] mb-3">{formatBytes(object.size)}</p>
      <p className="text-xs text-[var(--text-muted)] px-4">
        Archive preview is not available. Download to inspect contents locally.
      </p>
      <div className="mt-4 flex justify-center opacity-60">
        <FileIcon object={object} size={fullscreen ? 28 : 20} />
      </div>
    </div>
  );
}

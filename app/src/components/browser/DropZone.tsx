import { useState, type ReactNode } from 'react';
import { Upload } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useModalStore } from '../../store/modalStore';
import { useUploadStore } from '../../store/uploadStore';

interface DropZoneProps {
  children: ReactNode;
}

export function DropZone({ children }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const currentPrefix = useAppStore((s) => s.currentPrefix);
  const addToQueue = useUploadStore((s) => s.addToQueue);
  const openModal = useModalStore((s) => s.openModal);

  const onDrop = (files: FileList | null) => {
    if (!files?.length || !currentBucket) return;
    addToQueue(
      Array.from(files).map((file) => ({
        id: crypto.randomUUID(),
        file,
        bucket: currentBucket,
        key: currentPrefix + file.name,
        contentType: file.type || 'application/octet-stream',
        status: 'staged' as const,
        progress: 0,
        bytesUploaded: 0,
      })),
    );
    openModal('upload');
  };

  return (
    <div
      className="relative flex flex-col flex-1 min-h-0"
      onDragEnter={(e) => {
        e.preventDefault();
        if (currentBucket) setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onDrop(e.dataTransfer.files);
      }}
    >
      {children}
      {dragging && currentBucket && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--accent)]/10 border-2 border-dashed border-[var(--accent)] pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-[var(--accent)]">
            <Upload size={32} />
            <span className="text-sm font-semibold">Drop files to upload</span>
          </div>
        </div>
      )}
    </div>
  );
}

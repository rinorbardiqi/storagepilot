import { Copy, FolderPlus, RefreshCw, Trash2, Upload } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useModalStore } from '../../store/modalStore';
import { useSelectionStore } from '../../store/selectionStore';
import { Button } from '../shared/Button';

interface ToolbarProps {
  onRefresh: () => void;
  loading?: boolean;
  onDeleteSelected?: (keys: string[]) => void;
}

export function Toolbar({ onRefresh, loading, onDeleteSelected }: ToolbarProps) {
  const openModal = useModalStore((s) => s.openModal);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const currentPrefix = useAppStore((s) => s.currentPrefix);
  const selectedKeys = useSelectionStore((s) => s.selectedKeys);
  const selected = [...selectedKeys];

  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)]">
      {selected.length > 0 && (
        <div className="flex items-center gap-2 mr-auto">
          <span className="text-xs text-[var(--text-muted)]">{selected.length} selected</span>
          <Button
            variant="outline"
            onClick={() => openModal('copyMove', { operation: 'copy', keys: selected })}
          >
            <Copy size={14} />
            Copy
          </Button>
          <Button
            variant="outline"
            onClick={() => openModal('copyMove', { operation: 'move', keys: selected })}
          >
            Move
          </Button>
          <Button variant="danger" onClick={() => onDeleteSelected?.(selected)}>
            <Trash2 size={14} />
            Delete
          </Button>
        </div>
      )}
      <div className={`flex items-center gap-2 ${selected.length === 0 ? 'ml-auto' : ''}`}>
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            currentBucket &&
            openModal('newFolder', { bucket: currentBucket, prefix: currentPrefix })
          }
          disabled={!currentBucket}
        >
          <FolderPlus size={14} />
          New Folder
        </Button>
        <Button variant="accent" onClick={() => openModal('upload')}>
          <Upload size={14} />
          Upload
        </Button>
      </div>
    </div>
  );
}

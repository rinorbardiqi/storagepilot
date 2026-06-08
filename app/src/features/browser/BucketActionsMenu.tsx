import { useEffect, useRef } from 'react';
import {
  BarChart3,
  FolderOpen,
  Globe,
  Info,
  Package,
  Shield,
  Trash2,
} from 'lucide-react';
import { useModalStore } from '../../store/modalStore';
import { useUiStore } from '../../store/uiStore';

interface BucketActionsMenuProps {
  bucketName: string;
  open: boolean;
  onClose: () => void;
  onBrowse: () => void;
  onDelete: () => void;
}

export function BucketActionsMenu({
  bucketName,
  open,
  onClose,
  onBrowse,
  onDelete,
}: BucketActionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const openModal = useModalStore((s) => s.openModal);
  const openBucketDetail = useUiStore((s) => s.openBucketDetail);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const items = [
    {
      label: 'Browse objects',
      icon: FolderOpen,
      onClick: () => {
        onBrowse();
        onClose();
      },
    },
    {
      label: 'Bucket details',
      icon: Info,
      onClick: () => {
        openBucketDetail(bucketName);
        onClose();
      },
    },
    {
      label: 'Bucket stats',
      icon: BarChart3,
      onClick: () => {
        openModal('stats', { bucket: bucketName });
        onClose();
      },
    },
    {
      label: 'CORS settings',
      icon: Globe,
      onClick: () => {
        openModal('cors', { bucket: bucketName });
        onClose();
      },
    },
    {
      label: 'Permissions (IAM)',
      icon: Shield,
      onClick: () => {
        openModal('permissions', { bucket: bucketName });
        onClose();
      },
    },
    {
      label: 'Export snapshot',
      icon: Package,
      onClick: () => {
        openModal('exportImport', { tab: 'export', buckets: [bucketName] });
        onClose();
      },
    },
    {
      label: 'Delete bucket',
      icon: Trash2,
      danger: true,
      onClick: () => {
        onDelete();
        onClose();
      },
    },
  ];

  return (
    <div
      ref={menuRef}
      role="menu"
      className="absolute right-0 top-full mt-1 z-50 min-w-[180px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-lg py-1"
    >
      {items.map(({ label, icon: Icon, onClick, danger }) => (
        <button
          key={label}
          type="button"
          role="menuitem"
          className={`flex items-center gap-2 w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-elevated)] ${
            danger ? 'text-[var(--error)]' : 'text-[var(--text-primary)]'
          }`}
          onClick={onClick}
        >
          <Icon size={14} className="shrink-0 opacity-80" />
          {label}
        </button>
      ))}
    </div>
  );
}

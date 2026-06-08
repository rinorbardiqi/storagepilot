import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'viewport';

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm w-full',
  md: 'max-w-md w-full',
  lg: 'max-w-lg w-full',
  xl: 'max-w-2xl w-full',
  full: 'max-w-4xl w-full',
  viewport: 'w-[96vw] h-[92vh] max-w-none max-h-none',
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: ModalSize;
  footer?: ReactNode;
  headerIcon?: ReactNode;
  headerClassName?: string;
  footerClassName?: string;
  contentClassName?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  headerIcon,
  headerClassName = '',
  footerClassName = '',
  contentClassName = '',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] flex flex-col ${
          size === 'viewport' ? sizeClasses.viewport : `max-h-[90vh] ${sizeClasses[size]}`
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div
          className={`flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0 bg-[var(--bg-base)] ${headerClassName}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {headerIcon}
            <h2
              id="modal-title"
              className="font-semibold text-sm uppercase tracking-wide text-[var(--text-primary)] truncate"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div
          className={
            contentClassName
              ? `flex-1 min-h-0 ${contentClassName}`
              : 'p-5 overflow-y-auto flex-1 min-h-0'
          }
        >
          {children}
        </div>
        {footer && (
          <div
            className={`px-5 py-4 border-t border-[var(--border)] flex items-center justify-between gap-2 shrink-0 ${footerClassName}`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

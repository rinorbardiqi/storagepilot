import { X } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 px-4 py-2 text-sm border rounded-[var(--radius)] bg-[var(--bg-surface)] border-[var(--border)] shadow-lg min-w-[280px]"
        >
          <span className="flex-1">{toast.message}</span>
          {toast.action && (
            <button
              className="text-[var(--accent-gcs)] text-xs font-medium"
              onClick={() => {
                toast.action!.onClick();
                dismiss(toast.id);
              }}
            >
              {toast.action.label}
            </button>
          )}
          <button onClick={() => dismiss(toast.id)} className="text-[var(--text-muted)]">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

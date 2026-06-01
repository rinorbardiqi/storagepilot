import { useToastStore } from '../store/toastStore';

export function useToast() {
  const show = useToastStore((s) => s.show);
  const dismiss = useToastStore((s) => s.dismiss);

  return {
    success: (message: string) => show({ type: 'success', message }),
    error: (message: string) => show({ type: 'error', message, duration: 5000 }),
    warning: (message: string) => show({ type: 'warning', message }),
    undo: (message: string, onClick: () => void) =>
      show({ type: 'undo', message, duration: 5000, action: { label: 'Undo', onClick } }),
    dismiss,
  };
}

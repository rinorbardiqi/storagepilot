import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'undo';
  message: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastState {
  toasts: Toast[];
  timers: Map<string, ReturnType<typeof setTimeout>>;
  show: (toast: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  timers: new Map(),

  show: (toast) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    if (toast.duration !== 0) {
      const timer = setTimeout(() => get().dismiss(id), toast.duration ?? 3000);
      set((s) => {
        const timers = new Map(s.timers);
        timers.set(id, timer);
        return { timers };
      });
    }
    return id;
  },

  dismiss: (id) => {
    set((s) => {
      const timer = s.timers.get(id);
      if (timer !== undefined) clearTimeout(timer);
      const timers = new Map(s.timers);
      timers.delete(id);
      return { toasts: s.toasts.filter((t) => t.id !== id), timers };
    });
  },

  dismissAll: () => {
    set((s) => {
      for (const timer of s.timers.values()) clearTimeout(timer);
      return { toasts: [], timers: new Map() };
    });
  },
}));

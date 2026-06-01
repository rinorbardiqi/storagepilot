import { create } from 'zustand';

interface SelectionState {
  selectedKeys: Set<string>;
  lastSelectedKey: string | null;

  select: (key: string) => void;
  deselect: (key: string) => void;
  toggle: (key: string) => void;
  selectRange: (fromKey: string, toKey: string, allKeys: string[]) => void;
  selectAll: (keys: string[]) => void;
  clearSelection: () => void;
  isSelected: (key: string) => boolean;
}

export const useSelectionStore = create<SelectionState>()((set, get) => ({
  selectedKeys: new Set(),
  lastSelectedKey: null,

  select: (key) =>
    set((s) => ({ selectedKeys: new Set([...s.selectedKeys, key]), lastSelectedKey: key })),

  deselect: (key) =>
    set((s) => {
      const next = new Set(s.selectedKeys);
      next.delete(key);
      return { selectedKeys: next };
    }),

  toggle: (key) => (get().selectedKeys.has(key) ? get().deselect(key) : get().select(key)),

  selectRange: (fromKey, toKey, allKeys) => {
    const fromIdx = allKeys.indexOf(fromKey);
    const toIdx = allKeys.indexOf(toKey);
    const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
    set({ selectedKeys: new Set(allKeys.slice(start, end + 1)), lastSelectedKey: toKey });
  },

  selectAll: (keys) => set({ selectedKeys: new Set(keys) }),
  clearSelection: () => set({ selectedKeys: new Set(), lastSelectedKey: null }),
  isSelected: (key) => get().selectedKeys.has(key),
}));

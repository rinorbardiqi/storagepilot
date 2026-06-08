import { useModalStore } from '../../store/modalStore';
import { Modal } from '../shared/Modal';
import { KbdChip } from '../shared/KbdChip';

const SHORTCUTS = [
  { category: 'Navigation', items: [['Backspace', 'Go back'], ['/', 'Search']] },
  { category: 'Actions', items: [['u', 'Upload'], ['n', 'New bucket'], ['t', 'Toggle view'], ['Esc', 'Clear / close']] },
  { category: 'Global', items: [['⌘K', 'Command palette'], ['?', 'Shortcuts']] },
];

export function ShortcutsModal() {
  const isOpen = useModalStore((s) => Boolean(s.active.shortcuts));
  const closeModal = useModalStore((s) => s.closeModal);

  return (
    <Modal isOpen={isOpen} onClose={() => closeModal('shortcuts')} title="Keyboard shortcuts" size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SHORTCUTS.map((group) => (
          <div key={group.category}>
            <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase mb-2">
              {group.category}
            </h3>
            <ul className="space-y-2">
              {group.items.map(([key, desc]) => (
                <li key={key} className="flex items-center justify-between text-sm gap-4">
                  <span>{desc}</span>
                  <KbdChip>{key}</KbdChip>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}

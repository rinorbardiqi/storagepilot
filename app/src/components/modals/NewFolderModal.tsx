import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { useToast } from '../../hooks/useToast';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';

export function NewFolderModal() {
  const active = useModalStore((s) => s.active.newFolder);
  const closeModal = useModalStore((s) => s.closeModal);
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const currentPrefix = useAppStore((s) => s.currentPrefix);
  const invalidateObjects = useAppStore((s) => s.invalidateObjects);
  const toast = useToast();
  const [folderName, setFolderName] = useState('');
  const [busy, setBusy] = useState(false);

  const payload = typeof active === 'object' ? active : undefined;
  const bucket = payload?.bucket ?? currentBucket;
  const prefix = payload?.prefix ?? currentPrefix;
  const isOpen = Boolean(active);

  const create = async () => {
    const provider = getActiveProvider();
    if (!provider || !bucket) return;
    const name = folderName.trim().replace(/\/$/, '') + '/';
    const key = prefix + name + '.keep';
    setBusy(true);
    try {
      const file = new File([''], '.keep', { type: 'application/octet-stream' });
      await provider.uploadObject(bucket, key, file);
      toast.success(`Folder "${prefix + name}" created`);
      invalidateObjects();
      closeModal('newFolder');
      setFolderName('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => closeModal('newFolder')}
      title="New folder"
      size="sm"
      footer={
        <>
          <Button onClick={() => closeModal('newFolder')}>Cancel</Button>
          <Button variant="primary" onClick={() => void create()} disabled={!folderName.trim() || !bucket || busy}>
            {busy ? 'Creating…' : 'Create'}
          </Button>
        </>
      }
    >
      <p className="text-xs text-[var(--text-muted)] mb-3">
        In {bucket}/{prefix || '(root)'}
      </p>
      <Input
        label="Folder name"
        value={folderName}
        onChange={(e) => setFolderName(e.target.value)}
        placeholder="my-folder"
      />
    </Modal>
  );
}

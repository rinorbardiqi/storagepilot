import { Folder, File } from 'lucide-react';
import type { StorageObject } from '../../api/types';

export function FileIcon({ object }: { object: StorageObject }) {
  if (object.isFolder || object.key.endsWith('/')) {
    return <Folder size={16} className="text-[var(--text-muted)]" />;
  }
  return <File size={16} className="text-[var(--text-muted)]" />;
}

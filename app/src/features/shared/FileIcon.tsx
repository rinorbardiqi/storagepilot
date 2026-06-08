import {
  Archive,
  File,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Folder,
  Image as ImageIcon,
  Music,
  Video,
} from 'lucide-react';
import type { StorageObject } from '../../api/types';
import { getFileTypeCategory, type FileTypeCategory } from '../../lib/contentTypeIcons';

const CATEGORY_STYLES: Record<
  FileTypeCategory,
  { Icon: typeof File; className: string; label: string; fill?: string }
> = {
  folder: { Icon: Folder, className: 'text-[var(--accent-s3)]', label: 'Folder', fill: 'none' },
  image: { Icon: ImageIcon, className: 'text-[#3fb950]', label: 'Image', fill: 'none' },
  video: { Icon: Video, className: 'text-[#58a6ff]', label: 'Video', fill: 'none' },
  audio: { Icon: Music, className: 'text-[#a371f7]', label: 'Audio', fill: 'none' },
  pdf: { Icon: FileText, className: 'text-[#f85149]', label: 'PDF', fill: 'none' },
  code: { Icon: FileCode2, className: 'text-[#d29922]', label: 'Code', fill: 'none' },
  json: { Icon: FileCode2, className: 'text-[#d29922]', label: 'JSON', fill: 'none' },
  csv: { Icon: FileSpreadsheet, className: 'text-[#3fb950]', label: 'Spreadsheet', fill: 'none' },
  xml: { Icon: FileCode2, className: 'text-[#ff9900]', label: 'XML', fill: 'none' },
  text: { Icon: FileText, className: 'text-[var(--text-muted)]', label: 'Text', fill: 'none' },
  archive: { Icon: Archive, className: 'text-[#ff9900]', label: 'Archive', fill: 'none' },
  binary: { Icon: File, className: 'text-[var(--text-muted)]', label: 'Binary', fill: 'none' },
  file: { Icon: File, className: 'text-[var(--text-muted)]', label: 'File', fill: 'none' },
};

interface FileIconProps {
  object: StorageObject;
  size?: number;
  className?: string;
}

export function FileIcon({ object, size = 16, className = '' }: FileIconProps) {
  const category = getFileTypeCategory(object.key, object.contentType);
  const { Icon, className: colorClass, label, fill } = CATEGORY_STYLES[category];

  return (
    <Icon
      size={size}
      strokeWidth={1.75}
      fill={fill}
      className={`shrink-0 ${colorClass} ${className}`}
      aria-label={label}
    />
  );
}

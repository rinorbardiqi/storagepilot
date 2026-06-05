import type { StorageProvider } from '../api/StorageProvider';
import type { ObjectRef, UploadOpts } from '../api/types';

export interface TransferItem {
  src: ObjectRef;
  dst: ObjectRef;
  uploadOpts?: UploadOpts;
}

export interface TransferProgress {
  completed: number;
  total: number;
  currentKey: string;
}

export async function transferObjects(
  source: StorageProvider,
  destination: StorageProvider,
  items: TransferItem[],
  onProgress?: (progress: TransferProgress) => void,
): Promise<void> {
  const total = items.length;
  for (let i = 0; i < items.length; i++) {
    const { src, dst, uploadOpts } = items[i]!;
    onProgress?.({ completed: i, total, currentKey: src.key });

    const blob = await source.getObject(src.bucket, src.key);
    const filename = src.key.split('/').pop() ?? src.key;
    const file = new File([blob], filename, {
      type: uploadOpts?.contentType ?? (blob.type || 'application/octet-stream'),
    });
    await destination.uploadObject(dst.bucket, dst.key, file, uploadOpts);
  }
  onProgress?.({ completed: total, total, currentKey: '' });
}

export function buildDestinationKey(
  sourceKey: string,
  destPrefix: string,
  preservePath: boolean,
): string {
  const normalizedPrefix = destPrefix.replace(/^\//, '').replace(/\/$/, '');
  if (preservePath) {
    return normalizedPrefix ? `${normalizedPrefix}/${sourceKey}` : sourceKey;
  }
  const filename = sourceKey.split('/').pop() ?? sourceKey;
  return normalizedPrefix ? `${normalizedPrefix}/${filename}` : filename;
}

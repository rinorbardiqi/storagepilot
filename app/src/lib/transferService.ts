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

    const [meta, blob] = await Promise.all([
      source.getObjectMetadata(src.bucket, src.key),
      source.getObject(src.bucket, src.key),
    ]);
    const filename = src.key.split('/').pop() ?? src.key;
    const contentType =
      uploadOpts?.contentType ?? meta.contentType ?? (blob.type || 'application/octet-stream');
    const file = new File([blob], filename, { type: contentType });
    await destination.uploadObject(dst.bucket, dst.key, file, { ...uploadOpts, contentType });
  }
  onProgress?.({ completed: total, total, currentKey: '' });
}

export function buildDestinationKey(
  sourceKey: string,
  destPrefix: string,
  preservePath: boolean,
): string {
  // Normalize both inputs: strip leading/trailing slashes, collapse doubles.
  const normalizedPrefix = destPrefix.replace(/^\/+/, '').replace(/\/+$/, '');
  const normalizedKey = sourceKey.replace(/^\/+/, '').replace(/\/+/g, '/');
  if (preservePath) {
    return normalizedPrefix ? `${normalizedPrefix}/${normalizedKey}` : normalizedKey;
  }
  const filename = normalizedKey.split('/').pop() ?? normalizedKey;
  return normalizedPrefix ? `${normalizedPrefix}/${filename}` : filename;
}

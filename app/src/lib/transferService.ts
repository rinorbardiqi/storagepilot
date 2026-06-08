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

export interface TransferItemOutcome {
  srcKey: string;
  dstKey: string;
  success: boolean;
  error?: string;
}

export interface TransferResult {
  outcomes: TransferItemOutcome[];
  succeeded: number;
  failed: number;
}

export async function transferObjects(
  source: StorageProvider,
  destination: StorageProvider,
  items: TransferItem[],
  callbacks?: {
    onProgress?: (progress: TransferProgress) => void;
    onItemComplete?: (outcome: TransferItemOutcome) => void;
  },
): Promise<TransferResult> {
  const total = items.length;
  const outcomes: TransferItemOutcome[] = [];
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i++) {
    const { src, dst, uploadOpts } = items[i]!;
    callbacks?.onProgress?.({ completed: i, total, currentKey: src.key });

    try {
      const [meta, blob] = await Promise.all([
        source.getObjectMetadata(src.bucket, src.key),
        source.getObject(src.bucket, src.key),
      ]);
      const filename = src.key.split('/').pop() ?? src.key;
      const contentType =
        uploadOpts?.contentType ?? meta.contentType ?? (blob.type || 'application/octet-stream');
      const file = new File([blob], filename, { type: contentType });
      await destination.uploadObject(dst.bucket, dst.key, file, { ...uploadOpts, contentType });
      const outcome: TransferItemOutcome = {
        srcKey: src.key,
        dstKey: dst.key,
        success: true,
      };
      outcomes.push(outcome);
      succeeded++;
      callbacks?.onItemComplete?.(outcome);
    } catch (err) {
      const outcome: TransferItemOutcome = {
        srcKey: src.key,
        dstKey: dst.key,
        success: false,
        error: err instanceof Error ? err.message : 'Transfer failed',
      };
      outcomes.push(outcome);
      failed++;
      callbacks?.onItemComplete?.(outcome);
    }
  }

  callbacks?.onProgress?.({ completed: total, total, currentKey: '' });
  return { outcomes, succeeded, failed };
}

export function buildDestinationKey(
  sourceKey: string,
  destPrefix: string,
  preservePath: boolean,
): string {
  const normalizedPrefix = destPrefix.replace(/^\/+/, '').replace(/\/+$/, '');
  const normalizedKey = sourceKey.replace(/^\/+/, '').replace(/\/+/g, '/');
  if (preservePath) {
    return normalizedPrefix ? `${normalizedPrefix}/${normalizedKey}` : normalizedKey;
  }
  const filename = normalizedKey.split('/').pop() ?? normalizedKey;
  return normalizedPrefix ? `${normalizedPrefix}/${filename}` : filename;
}

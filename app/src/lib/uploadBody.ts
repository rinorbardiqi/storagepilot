/** Ensure upload queue items still hold a browser File/Blob (not a plain object). */
export function assertUploadBlob(file: unknown): asserts file is File | Blob {
  if (!(file instanceof Blob)) {
    throw new Error(
      'Invalid upload file — the file object was lost. Remove the item and select the file again.',
    );
  }
}

/** Read file bytes for SDKs that cannot stream File/Blob in the browser (e.g. AWS S3). */
export async function toUploadBytes(file: File | Blob): Promise<Uint8Array> {
  assertUploadBlob(file);
  return new Uint8Array(await new Response(file).arrayBuffer());
}

/** Safe summary for activity logs (File does not JSON-serialize). */
export function describeUploadFile(file: unknown): unknown {
  if (file instanceof File) {
    return { name: file.name, size: file.size, type: file.type };
  }
  if (file instanceof Blob) {
    return { size: file.size, type: file.type };
  }
  return file;
}

export function sanitizeMethodArgs(args: unknown[]): unknown[] {
  return args.map((arg, i) => {
    if (i === 2 && (arg instanceof Blob || (arg && typeof arg === 'object' && !Array.isArray(arg)))) {
      return describeUploadFile(arg);
    }
    return arg;
  });
}

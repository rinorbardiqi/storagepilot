/** S3/MinIO CopySource value — encode each path segment, keep `/` separators. */
export function s3CopySource(bucket: string, key: string, versionId?: string): string {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  let source = `${bucket}/${encodedKey}`;
  if (versionId) source += `?versionId=${encodeURIComponent(versionId)}`;
  return source;
}

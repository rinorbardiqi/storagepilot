/** Relative paths like `/api/s3` work with fetch but not with the AWS SDK. */
export function resolveApiUrl(base: string): string {
  const trimmed = base.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${window.location.origin}${path}`.replace(/\/$/, '');
  }
  return trimmed;
}

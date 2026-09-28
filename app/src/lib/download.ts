export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking synchronously can cancel the download in Firefox/Safari.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function filenameFromKey(key: string): string {
  const parts = key.split('/');
  return parts[parts.length - 1] || key;
}

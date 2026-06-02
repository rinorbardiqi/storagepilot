import JSZip from 'jszip';

export async function downloadAsZip(
  files: Array<{ key: string; blob: Blob }>,
  zipName = 'download.zip',
): Promise<void> {
  const zip = new JSZip();
  for (const { key, blob } of files) {
    zip.file(key, blob);
  }
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  a.click();
  URL.revokeObjectURL(url);
}

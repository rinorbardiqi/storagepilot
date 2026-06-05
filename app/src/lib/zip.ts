import JSZip from 'jszip';

export async function downloadAsZip(
  files: Array<{ key: string; blob: Blob }>,
  zipName = 'download.zip',
  manifestJson?: string,
): Promise<void> {
  const zip = new JSZip();
  if (manifestJson) {
    zip.file('manifest.json', manifestJson);
  }
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

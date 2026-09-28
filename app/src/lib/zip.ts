import JSZip from 'jszip';
import { downloadBlob } from './download';

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
  downloadBlob(content, zipName);
}

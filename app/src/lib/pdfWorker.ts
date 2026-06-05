import * as pdfjs from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

let configured = false;

/** Configure pdf.js once using a Vite-bundled worker (avoids raw .mjs fetch in nginx). */
export function configurePdfWorker(): void {
  if (configured || typeof window === 'undefined' || !('Worker' in window)) return;
  pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();
  configured = true;
}

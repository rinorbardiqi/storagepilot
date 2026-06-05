import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { configurePdfWorker } from '../../../lib/pdfWorker';

interface PdfPreviewProps {
  blob: Blob;
  compact?: boolean;
  fullscreen?: boolean;
}

export function PdfPreview({ blob, compact, fullscreen }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    configurePdfWorker();

    let cancelled = false;

    void (async () => {
      try {
        const data = await blob.arrayBuffer();
        const doc = await pdfjs.getDocument({ data }).promise;
        if (cancelled) return;
        setPageCount(doc.numPages);
        const pdfPage = await doc.getPage(page);
        if (cancelled) return;
        const scale = fullscreen ? 2 : compact ? 0.8 : 1.2;
        const viewport = pdfPage.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await pdfPage.render({ canvasContext: ctx, viewport }).promise;
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to render PDF');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [blob, page, compact, fullscreen]);

  if (error) return <p className="text-sm text-[var(--error)]">{error}</p>;

  return (
    <div className={`flex flex-col gap-2 ${fullscreen ? 'h-full min-h-0' : ''}`}>
      <div
        className={`overflow-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-base)] p-2 ${
          fullscreen ? 'flex-1 min-h-0' : ''
        }`}
      >
        <canvas ref={canvasRef} className="mx-auto max-w-full" />
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)] shrink-0">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-2 py-1 border border-[var(--border)] rounded disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            Page {page} / {pageCount}
          </span>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            className="px-2 py-1 border border-[var(--border)] rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

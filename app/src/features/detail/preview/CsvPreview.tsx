import { useEffect, useState } from 'react';
import Papa from 'papaparse';

interface CsvPreviewProps {
  blob: Blob;
  compact?: boolean;
  fullscreen?: boolean;
}

export function CsvPreview({ blob, compact, fullscreen }: CsvPreviewProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [truncated, setTruncated] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    void blob
      .text()
      .then((text) => {
        if (cancelled) return;
        // Papa reports recoverable issues (e.g. ragged rows) as errors but still
        // returns the rows, so render whatever parsed instead of hanging.
        const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
        const data = parsed.data;
        if (!data.length) {
          setStatus('empty');
          return;
        }
        const maxRows = compact ? 10 : fullscreen ? 500 : 50;
        setHeaders(data[0] ?? []);
        setRows(data.slice(1, maxRows + 1));
        setTruncated(data.length - 1 > maxRows);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [blob, compact, fullscreen]);

  if (status === 'loading') return <p className="text-sm text-[var(--text-muted)]">Loading preview…</p>;
  if (status === 'empty') return <p className="text-sm text-[var(--text-muted)]">Empty CSV file.</p>;
  if (status === 'error') return <p className="text-sm text-[var(--error)]">Could not read CSV file.</p>;

  return (
    <div
      className={`overflow-auto rounded-[var(--radius)] border border-[var(--border)] ${
        fullscreen ? 'h-full min-h-0 border-0 rounded-none' : compact ? 'max-h-40' : 'max-h-96'
      }`}
    >
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[var(--bg-elevated)]">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="p-2 text-left font-mono border-b border-[var(--border)] whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--accent)]/5">
              {row.map((cell, j) => (
                <td key={j} className="p-2 font-mono whitespace-nowrap text-[var(--text-muted)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {truncated && (
        <p className="p-2 text-[10px] text-[var(--text-muted)] border-t border-[var(--border)]">
          Showing first {compact ? 10 : fullscreen ? 500 : 50} rows
        </p>
      )}
    </div>
  );
}

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

  useEffect(() => {
    let cancelled = false;
    void blob.text().then((text) => {
      const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
      if (cancelled || parsed.errors.length) return;
      const data = parsed.data;
      if (!data.length) return;
      const maxRows = compact ? 10 : fullscreen ? 500 : 50;
      setHeaders(data[0] ?? []);
      setRows(data.slice(1, maxRows + 1));
      setTruncated(data.length - 1 > maxRows);
    });
    return () => {
      cancelled = true;
    };
  }, [blob, compact, fullscreen]);

  if (!headers.length) return <p className="text-sm text-[var(--text-muted)]">Loading preview…</p>;

  return (
    <div
      className={`overflow-auto rounded-[var(--radius)] border border-[var(--border)] ${
        fullscreen ? 'h-full min-h-0 border-0 rounded-none' : compact ? 'max-h-40' : 'max-h-96'
      }`}
    >
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[var(--bg-elevated)]">
          <tr>
            {headers.map((h) => (
              <th key={h} className="p-2 text-left font-mono border-b border-[var(--border)] whitespace-nowrap">
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

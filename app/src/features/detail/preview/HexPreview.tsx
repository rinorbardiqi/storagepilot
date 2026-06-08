import { useEffect, useState } from 'react';

interface HexPreviewProps {
  blob: Blob;
  compact?: boolean;
  fullscreen?: boolean;
}

const BYTES_LIMIT = 4096;
const FULLSCREEN_BYTES_LIMIT = 65536;

export function HexPreview({ blob, compact, fullscreen }: HexPreviewProps) {
  const [rows, setRows] = useState<Array<{ offset: string; hex: string; ascii: string }>>([]);
  const [bytesShown, setBytesShown] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const limit = fullscreen ? FULLSCREEN_BYTES_LIMIT : BYTES_LIMIT;

    void blob.slice(0, limit).arrayBuffer().then((buf) => {
      if (cancelled) return;
      const bytes = new Uint8Array(buf);
      setBytesShown(bytes.length);
      const result: Array<{ offset: string; hex: string; ascii: string }> = [];
      for (let i = 0; i < bytes.length; i += 16) {
        const chunk = bytes.slice(i, i + 16);
        const hex = Array.from(chunk)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(' ');
        const ascii = Array.from(chunk)
          .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.'))
          .join('');
        result.push({
          offset: i.toString(16).padStart(8, '0'),
          hex,
          ascii,
        });
      }
      setRows(result);
    });
    return () => {
      cancelled = true;
    };
  }, [blob, compact, fullscreen]);

  if (!rows.length) return <p className="text-sm text-[var(--text-muted)]">Loading preview…</p>;

  return (
    <div
      className={`overflow-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-base)] font-mono text-[10px] ${
        fullscreen ? 'h-full min-h-0 border-0 rounded-none' : compact ? 'max-h-40' : 'max-h-96'
      }`}
    >
      <table className="w-full">
        <tbody>
          {rows.map((row) => (
            <tr key={row.offset} className="border-b border-[var(--border)]/50">
              <td className="px-2 py-1 text-[var(--text-muted)] w-20">{row.offset}</td>
              <td className="px-2 py-1 text-[var(--accent)]">{row.hex}</td>
              <td className="px-2 py-1 text-[var(--text-primary)]">{row.ascii}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {blob.size > bytesShown && (
        <p className="p-2 text-[10px] text-[var(--text-muted)] border-t border-[var(--border)]">
          Showing first {bytesShown.toLocaleString()} of {blob.size.toLocaleString()} bytes
        </p>
      )}
    </div>
  );
}

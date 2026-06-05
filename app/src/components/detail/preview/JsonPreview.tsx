import { useEffect, useState } from 'react';
import { highlightCode } from './shikiHighlighter';

interface JsonPreviewProps {
  blob: Blob;
  compact?: boolean;
  fullscreen?: boolean;
}

export function JsonPreview({ blob, compact, fullscreen }: JsonPreviewProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const maxChars = compact ? 20_000 : fullscreen ? 500_000 : 20_000;

    void blob.text().then(async (raw) => {
      try {
        const formatted = JSON.stringify(JSON.parse(raw), null, 2);
        const highlighted = await highlightCode(formatted, 'json', maxChars);
        if (!cancelled) setHtml(highlighted);
      } catch {
        if (!cancelled) {
          setParseError('Invalid JSON — showing raw text');
          const highlighted = await highlightCode(raw, 'plaintext', maxChars);
          if (!cancelled) setHtml(highlighted);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [blob, compact, fullscreen]);

  if (!html) return <p className="text-sm text-[var(--text-muted)]">Loading preview…</p>;

  return (
    <div className={fullscreen ? 'h-full min-h-0 flex flex-col' : ''}>
      {parseError && <p className="text-xs text-[var(--error)] mb-2 shrink-0">{parseError}</p>}
      <div
        className={`text-xs overflow-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-base)] ${
          fullscreen ? 'flex-1 min-h-0 border-0 rounded-none' : compact ? 'max-h-40' : 'max-h-96'
        }`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { shikiLanguageFor } from '../../../lib/contentTypeIcons';
import { highlightCode } from '../../../lib/shikiHighlighter';

interface TextPreviewProps {
  blob: Blob;
  keyName: string;
  contentType: string;
  compact?: boolean;
  fullscreen?: boolean;
}

export function TextPreview({ blob, keyName, contentType, compact, fullscreen }: TextPreviewProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    setError(null);
    const lang = shikiLanguageFor(keyName, contentType);
    void blob
      .text()
      .then((text) =>
        highlightCode(text, lang, compact ? 4000 : fullscreen ? 500_000 : 20_000),
      )
      .then((highlighted) => {
        if (!cancelled) setHtml(highlighted);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Could not highlight file');
      });
    return () => {
      cancelled = true;
    };
  }, [blob, keyName, contentType, compact, fullscreen]);

  if (error) {
    // Fall back to raw <pre> so the user can still read the file.
    return (
      <div
        className={`text-xs overflow-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-base)] p-3 font-mono whitespace-pre-wrap ${
          fullscreen ? 'h-full w-full border-0 rounded-none' : compact ? 'max-h-40' : 'max-h-96'
        }`}
      >
        <FallbackText blob={blob} />
      </div>
    );
  }

  if (!html) return <p className="text-sm text-[var(--text-muted)]">Loading preview…</p>;

  return (
    <div
      className={`text-xs overflow-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-base)] ${
        fullscreen ? 'h-full w-full border-0 rounded-none' : compact ? 'max-h-40' : 'max-h-96'
      }`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function FallbackText({ blob }: { blob: Blob }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    void blob.text().then(setText).catch(() => setText('(Could not read file)'));
  }, [blob]);
  return <>{text ?? 'Loading…'}</>;
}

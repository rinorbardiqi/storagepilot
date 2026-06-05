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

  useEffect(() => {
    let cancelled = false;
    const lang = shikiLanguageFor(keyName, contentType);
    void blob.text().then(async (text) => {
      const highlighted = await highlightCode(text, lang, compact ? 4000 : fullscreen ? 500_000 : 20_000);
      if (!cancelled) setHtml(highlighted);
    });
    return () => {
      cancelled = true;
    };
  }, [blob, keyName, contentType, compact, fullscreen]);

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

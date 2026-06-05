interface ImagePreviewProps {
  url: string;
  alt: string;
  compact?: boolean;
  fullscreen?: boolean;
  onOpenFullscreen?: () => void;
}

export function ImagePreview({ url, alt, compact, fullscreen, onOpenFullscreen }: ImagePreviewProps) {
  const img = (
    <img
      src={url}
      alt={alt}
      className={`max-w-full object-contain mx-auto ${
        fullscreen ? 'max-h-full' : compact ? 'max-h-40' : 'max-h-64'
      }`}
    />
  );

  if (onOpenFullscreen && !fullscreen) {
    return (
      <button
        type="button"
        onClick={onOpenFullscreen}
        className="block w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-base)] p-2 hover:border-[var(--accent)]/40 transition-colors"
        title="Open fullscreen preview"
      >
        {img}
      </button>
    );
  }

  return (
    <div
      className={`${fullscreen ? 'h-full flex items-center justify-center' : ''} rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-base)] p-2`}
    >
      {img}
    </div>
  );
}

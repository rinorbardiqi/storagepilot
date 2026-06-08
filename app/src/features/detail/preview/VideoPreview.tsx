interface VideoPreviewProps {
  url: string;
  contentType: string;
  compact?: boolean;
  fullscreen?: boolean;
}

export function VideoPreview({ url, contentType, compact, fullscreen }: VideoPreviewProps) {
  return (
    <video
      src={url}
      controls
      className={`w-full rounded-[var(--radius)] border border-[var(--border)] bg-black ${
        fullscreen ? 'max-h-full max-w-full' : compact ? 'max-h-40' : 'max-h-80'
      }`}
    >
      <source src={url} type={contentType} />
    </video>
  );
}

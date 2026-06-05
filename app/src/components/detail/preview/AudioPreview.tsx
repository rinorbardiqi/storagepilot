interface AudioPreviewProps {
  url: string;
  contentType: string;
  fullscreen?: boolean;
}

export function AudioPreview({ url, contentType, fullscreen }: AudioPreviewProps) {
  return (
    <div
      className={`rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-base)] ${
        fullscreen ? 'p-8 w-full max-w-xl' : 'p-4'
      }`}
    >
      <audio src={url} controls className="w-full">
        <source src={url} type={contentType} />
      </audio>
    </div>
  );
}

import type { StorageObject } from '../../../api/types';
import type { PreviewKind } from '../../../lib/contentTypeIcons';
import { AudioPreview } from './AudioPreview';
import { ArchivePreview } from './ArchivePreview';
import { CsvPreview } from './CsvPreview';
import { HexPreview } from './HexPreview';
import { ImagePreview } from './ImagePreview';
import { JsonPreview } from './JsonPreview';
import { PdfPreview } from './PdfPreview';
import { TextPreview } from './TextPreview';
import { VideoPreview } from './VideoPreview';

interface ObjectPreviewProps {
  object: StorageObject;
  blob: Blob;
  url: string | null;
  contentType: string;
  previewKind: PreviewKind;
  compact?: boolean;
  onOpenFullscreen?: () => void;
  fullscreen?: boolean;
}

export function ObjectPreview({
  object,
  blob,
  url,
  contentType,
  previewKind,
  compact,
  onOpenFullscreen,
  fullscreen,
}: ObjectPreviewProps) {
  const wrapperClass = fullscreen ? 'h-full w-full min-h-0 flex flex-col' : undefined;

  const content = (() => {
    switch (previewKind) {
      case 'image':
        return url ? (
          <ImagePreview
            url={url}
            alt={object.key}
            compact={compact}
            fullscreen={fullscreen}
            onOpenFullscreen={onOpenFullscreen}
          />
        ) : null;
      case 'video':
        return url ? (
          <VideoPreview url={url} contentType={contentType} compact={compact} fullscreen={fullscreen} />
        ) : null;
      case 'audio':
        return url ? <AudioPreview url={url} contentType={contentType} fullscreen={fullscreen} /> : null;
      case 'pdf':
        return <PdfPreview blob={blob} compact={compact} fullscreen={fullscreen} />;
      case 'json':
        return <JsonPreview blob={blob} compact={compact} fullscreen={fullscreen} />;
      case 'csv':
        return <CsvPreview blob={blob} compact={compact} fullscreen={fullscreen} />;
      case 'xml':
      case 'text':
      case 'code':
        return (
          <TextPreview
            blob={blob}
            keyName={object.key}
            contentType={contentType}
            compact={compact}
            fullscreen={fullscreen}
          />
        );
      case 'archive':
        return <ArchivePreview object={object} fullscreen={fullscreen} />;
      case 'hex':
      default:
        return <HexPreview blob={blob} compact={compact} fullscreen={fullscreen} />;
    }
  })();

  if (!content) return null;
  if (!wrapperClass) return content;

  return <div className={wrapperClass}>{content}</div>;
}

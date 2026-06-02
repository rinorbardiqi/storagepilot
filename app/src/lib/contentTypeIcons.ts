export function isImage(contentType: string): boolean {
  return contentType.startsWith('image/');
}

export function isText(contentType: string): boolean {
  return contentType.startsWith('text/') || contentType === 'application/json';
}

/**
 * Encode each segment of an object key for use in URLs, preserving `/` separators.
 * "photos/My File.jpg" → "photos/My%20File.jpg"
 */
export function encodeObjectKey(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/');
}

/**
 * Last path segment of an object key, without trailing slash.
 * "folder/sub/file.txt" → "file.txt"
 * "folder/"             → "folder"
 */
export function objectDisplayName(key: string): string {
  return key.replace(/\/$/, '').split('/').pop() ?? key;
}

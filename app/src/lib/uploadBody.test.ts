import { describe, expect, it } from 'vitest';
import { describeUploadFile, sanitizeMethodArgs, toUploadBytes } from './uploadBody';

describe('uploadBody', () => {
  it('converts File to Uint8Array', async () => {
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    const bytes = await toUploadBytes(file);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.byteLength).toBeGreaterThan(0);
  });

  it('describes File for activity logs', () => {
    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    expect(describeUploadFile(file)).toEqual({
      name: 'photo.png',
      size: 1,
      type: 'image/png',
    });
  });

  it('sanitizes uploadObject args', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    const sanitized = sanitizeMethodArgs(['bucket', 'key', file, { contentType: 'image/png' }]);
    expect(sanitized[2]).toEqual({ name: 'a.png', size: 1, type: 'image/png' });
    expect(sanitized[3]).toEqual({ contentType: 'image/png' });
  });
});

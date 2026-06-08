import { describe, expect, it, vi } from 'vitest';
import { resolveApiUrl } from '@/lib/resolveApiUrl';

describe('resolveApiUrl', () => {
  it('returns absolute URLs unchanged', () => {
    expect(resolveApiUrl('http://localhost:9000')).toBe('http://localhost:9000');
    expect(resolveApiUrl('https://minio.example.com/api/s3/')).toBe(
      'https://minio.example.com/api/s3',
    );
  });

  it('resolves relative paths against window.origin', () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:5173' } });
    expect(resolveApiUrl('/api/s3')).toBe('http://localhost:5173/api/s3');
    vi.unstubAllGlobals();
  });
});

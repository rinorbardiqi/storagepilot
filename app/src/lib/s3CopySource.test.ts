import { describe, expect, it } from 'vitest';
import { s3CopySource } from './s3CopySource';

describe('s3CopySource', () => {
  it('keeps path slashes between segments', () => {
    expect(s3CopySource('mybucket', 'photos/2024/a.jpg')).toBe('mybucket/photos/2024/a.jpg');
  });

  it('encodes spaces and special characters per segment', () => {
    expect(s3CopySource('mybucket', 'Screenshot 2024.png')).toBe(
      'mybucket/Screenshot%202024.png',
    );
  });

  it('appends versionId query param', () => {
    expect(s3CopySource('b', 'file.txt', 'abc123')).toBe('b/file.txt?versionId=abc123');
  });
});

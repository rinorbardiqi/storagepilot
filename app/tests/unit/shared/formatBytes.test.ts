import { describe, expect, it } from 'vitest';
import { formatBytes } from '@/lib/formatBytes';

describe('formatBytes', () => {
  it.each([
    [0, '0 B'],
    [1023, '1023 B'],
    [1024, '1.0 KB'],
    [1048576, '1.0 MB'],
    [1073741824, '1.0 GB'],
    [2560, '2.5 KB'],
  ])('formats %i bytes as %s', (input, expected) => {
    expect(formatBytes(input)).toBe(expected);
  });
});

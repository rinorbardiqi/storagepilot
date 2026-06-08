import { describe, expect, it } from 'vitest';
import { buildDestinationKey } from '@/lib/transferService';

describe('buildDestinationKey', () => {
  it('preserves full path when requested', () => {
    expect(buildDestinationKey('photos/2024/a.jpg', 'backup', true)).toBe('backup/photos/2024/a.jpg');
    expect(buildDestinationKey('photos/2024/a.jpg', '', true)).toBe('photos/2024/a.jpg');
  });

  it('flattens to filename when preservePath is false', () => {
    expect(buildDestinationKey('photos/2024/a.jpg', 'archive/q2', false)).toBe('archive/q2/a.jpg');
  });
});

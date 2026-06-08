import { describe, expect, it } from 'vitest';
import { OBJECTS_PAGE_SIZE, shouldShowListPagination } from '@/lib/listPagination';

describe('listPagination', () => {
  it('uses a reasonable default page size', () => {
    expect(OBJECTS_PAGE_SIZE).toBeGreaterThan(0);
  });

  it('shows pagination when more pages exist', () => {
    expect(shouldShowListPagination(0, true, false)).toBe(true);
    expect(shouldShowListPagination(1, false, true)).toBe(true);
  });

  it('hides pagination on a single short page', () => {
    expect(shouldShowListPagination(0, false, false)).toBe(false);
  });
});

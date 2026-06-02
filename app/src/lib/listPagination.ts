/** Default page size for object listing (folders + files per page). */
export const OBJECTS_PAGE_SIZE = 50;

export function shouldShowListPagination(
  pageIndex: number,
  hasNextPage: boolean,
  hasPreviousPage: boolean,
): boolean {
  return hasPreviousPage || hasNextPage || pageIndex > 0;
}

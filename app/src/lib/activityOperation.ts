import type { ActivityEntry } from '../store/activityStore';

export type OperationKind = 'GET' | 'PUT' | 'LIST' | 'DELETE' | 'OTHER';

export type ActivityFilter = 'all' | 'get' | 'post' | 'put' | 'delete' | 'errors';

export type ActivityHttpVerb = 'GET' | 'POST' | 'PUT' | 'DELETE';

export const ACTIVITY_FILTERS: ActivityFilter[] = [
  'all',
  'get',
  'post',
  'put',
  'delete',
  'errors',
];

const METHOD_KIND: Record<string, OperationKind> = {
  getObject: 'GET',
  getObjectMetadata: 'GET',
  getObjectUrl: 'GET',
  uploadObject: 'PUT',
  createBucket: 'PUT',
  setCorsRules: 'PUT',
  updateMetadata: 'PUT',
  copyObject: 'PUT',
  moveObject: 'PUT',
  listObjects: 'LIST',
  listBuckets: 'LIST',
  listVersions: 'LIST',
  getCorsRules: 'LIST',
  getBucketStats: 'LIST',
  deleteObject: 'DELETE',
  deleteBucket: 'DELETE',
  deleteVersion: 'DELETE',
  restoreVersion: 'PUT',
  setBucketVersioning: 'PUT',
  testConnection: 'LIST',
};

const READ_METHODS = new Set([
  'getObject',
  'getObjectMetadata',
  'getObjectUrl',
  'getCorsRules',
  'getBucketStats',
  'listObjects',
  'listBuckets',
  'listVersions',
  'testConnection',
]);

const DELETE_METHODS = new Set([
  'deleteObject',
  'deleteBucket',
  'deleteVersion',
]);

/** GCS JSON API uses POST for uploads, copies, and bucket create. */
const GCS_POST_METHODS = new Set([
  'uploadObject',
  'copyObject',
  'createBucket',
  'restoreVersion',
]);

export function classifyOperation(method: string): OperationKind {
  return METHOD_KIND[method] ?? 'OTHER';
}

/** Map a logged provider call to the HTTP verb shown in the activity filter bar. */
export function activityHttpVerb(
  entry: Pick<ActivityEntry, 'method' | 'provider'>,
): ActivityHttpVerb | null {
  const { method, provider } = entry;

  if (READ_METHODS.has(method)) return 'GET';
  if (DELETE_METHODS.has(method)) return 'DELETE';

  if (provider === 'gcs') {
    if (GCS_POST_METHODS.has(method)) return 'POST';
    if (method === 'moveObject') return 'POST';
    if (method === 'updateMetadata' || method === 'setCorsRules' || method === 'setBucketVersioning') {
      return 'PUT';
    }
    return null;
  }

  const kind = classifyOperation(method);
  if (kind === 'PUT') return 'PUT';
  return null;
}

export function matchesActivityFilter(entry: ActivityEntry, filter: ActivityFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'errors') return entry.status === 'error';

  const verb = activityHttpVerb(entry);
  if (!verb) return false;
  return verb.toLowerCase() === filter;
}

export function activityFilterLabel(filter: ActivityFilter): string {
  if (filter === 'errors') return 'ERRORS';
  return filter.toUpperCase();
}
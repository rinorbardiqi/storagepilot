import type {
  Bucket,
  BucketStats,
  CorsRule,
  CreateBucketOpts,
  ListOpts,
  ListResult,
  ObjectMetadata,
  ObjectRef,
  ObjectVersion,
  PathFormats,
  ProviderType,
  UploadOpts,
} from './types';

export interface StorageProvider {
  readonly type: ProviderType;
  readonly displayName: string;
  readonly baseUrl: string;

  testConnection(): Promise<boolean>;

  listBuckets(): Promise<Bucket[]>;
  createBucket(name: string, opts?: CreateBucketOpts): Promise<Bucket>;
  deleteBucket(name: string): Promise<void>;
  getBucketStats(name: string): Promise<BucketStats>;
  setCorsRules(bucket: string, rules: CorsRule[]): Promise<void>;
  getCorsRules(bucket: string): Promise<CorsRule[]>;
  setBucketVersioning(bucket: string, enabled: boolean): Promise<void>;

  listObjects(bucket: string, opts: ListOpts): Promise<ListResult>;
  getObject(bucket: string, key: string): Promise<Blob>;
  getObjectMetadata(bucket: string, key: string): Promise<ObjectMetadata>;
  uploadObject(
    bucket: string,
    key: string,
    file: File,
    opts?: UploadOpts,
  ): Promise<void>;
  deleteObject(bucket: string, key: string): Promise<void>;
  copyObject(src: ObjectRef, dst: ObjectRef): Promise<void>;
  moveObject(src: ObjectRef, dst: ObjectRef): Promise<void>;
  updateMetadata(
    bucket: string,
    key: string,
    metadata: Record<string, string>,
  ): Promise<void>;

  listVersions(bucket: string, key: string): Promise<ObjectVersion[]>;
  restoreVersion(bucket: string, key: string, versionId: string): Promise<void>;
  deleteVersion(bucket: string, key: string, versionId: string): Promise<void>;

  getObjectUrl(bucket: string, key: string): string;
  getPathFormats(bucket: string, key: string): PathFormats;
}

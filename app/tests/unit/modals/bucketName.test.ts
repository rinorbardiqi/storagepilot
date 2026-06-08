import { describe, expect, it } from 'vitest';
import { prepareBucketName, sanitizeBucketName, validateBucketName } from '@/lib/bucketName';

describe('bucketName', () => {
  it('sanitizes schemes and underscores for S3', () => {
    expect(sanitizeBucketName('gs://my_bucket')).toBe('my-bucket');
    expect(sanitizeBucketName('  My-Bucket  ')).toBe('my-bucket');
  });

  it('rejects short S3 names', () => {
    expect(validateBucketName('ab', 's3')).toMatch(/at least 3/);
  });

  it('rejects underscores in S3 names', () => {
    expect(validateBucketName('my_bucket', 's3')).toBeTruthy();
    expect(prepareBucketName('my_bucket', 's3')).toBe('my-bucket');
  });

  it('accepts valid S3 names', () => {
    expect(validateBucketName('prod-assets-v2', 's3')).toBeNull();
    expect(prepareBucketName('prod-assets-v2', 's3')).toBe('prod-assets-v2');
  });
});

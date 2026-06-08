import { describe, expect, it } from 'vitest';
import { mapHttpStatusToError, parseStorageErrorBody } from '@/api/types';

describe('parseStorageErrorBody', () => {
  it('extracts GCS JSON error messages', () => {
    const body = JSON.stringify({
      error: {
        code: 412,
        message: 'bucket must be empty prior to deletion',
      },
    });

    expect(parseStorageErrorBody(body)).toBe('bucket must be empty prior to deletion');
  });

  it('extracts S3 XML error messages', () => {
    const body =
      '<?xml version="1.0"?><Error><Code>BucketNotEmpty</Code><Message>The bucket you tried to delete is not empty</Message></Error>';

    expect(parseStorageErrorBody(body)).toBe('The bucket you tried to delete is not empty');
  });
});

describe('mapHttpStatusToError', () => {
  it('maps 412 to CONFLICT', () => {
    const err = mapHttpStatusToError(412, 'gcs', 'bucket must be empty prior to deletion');
    expect(err.code).toBe('CONFLICT');
    expect(err.message).toBe('bucket must be empty prior to deletion');
  });
});

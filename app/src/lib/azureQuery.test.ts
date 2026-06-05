import { describe, expect, it } from 'vitest';
import { appendAzureQuery, buildAzureQueryString } from './azureQuery';

describe('azureQuery', () => {
  it('encodes spaces as %20 not +', () => {
    expect(buildAzureQueryString({ prefix: 'Screenshot 2024.png' })).toBe(
      'prefix=Screenshot%202024.png',
    );
  });

  it('sorts query keys alphabetically', () => {
    expect(
      buildAzureQueryString({
        restype: 'container',
        comp: 'list',
        prefix: 'a.txt',
        include: 'versions',
      }),
    ).toBe('comp=list&include=versions&prefix=a.txt&restype=container');
  });

  it('appendAzureQuery skips empty values', () => {
    expect(appendAzureQuery('http://x/container', { comp: 'list', marker: undefined })).toBe(
      'http://x/container?comp=list',
    );
  });
});

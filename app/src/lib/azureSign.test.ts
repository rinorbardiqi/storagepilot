import { describe, expect, it } from 'vitest';
import { buildCanonicalizedResource } from './azureSign';

describe('azureSign canonicalizedResource', () => {
  it('strips nginx /api/azure prefix for path-style signing', () => {
    expect(
      buildCanonicalizedResource(
        'devstoreaccount1',
        'http://localhost:3000/api/azure/devstoreaccount1?comp=list',
      ),
    ).toBe('/devstoreaccount1/devstoreaccount1/\ncomp:list');
  });

  it('handles direct Azurite URL', () => {
    expect(
      buildCanonicalizedResource(
        'devstoreaccount1',
        'http://localhost:10000/devstoreaccount1/?comp=list',
      ),
    ).toBe('/devstoreaccount1/devstoreaccount1/\ncomp:list');
  });

  it('includes container path and query params', () => {
    expect(
      buildCanonicalizedResource(
        'devstoreaccount1',
        'http://localhost:3000/api/azure/devstoreaccount1/mycontainer?restype=container&comp=list',
      ),
    ).toBe('/devstoreaccount1/devstoreaccount1/mycontainer\ncomp:list\nrestype:container');
  });
});

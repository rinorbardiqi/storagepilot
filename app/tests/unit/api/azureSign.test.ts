import { describe, expect, it } from 'vitest';
import { buildCanonicalizedResource } from '@/api/azureSign';

describe('azureSign canonicalizedResource', () => {
  it('builds Azurite path-style account resource with doubled account segment', () => {
    expect(
      buildCanonicalizedResource(
        'devstoreaccount1',
        'http://localhost:3000/api/azure/devstoreaccount1/?comp=list',
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

  it('includes list versions query params', () => {
    expect(
      buildCanonicalizedResource(
        'devstoreaccount1',
        'http://localhost:3000/api/azure/devstoreaccount1/mycontainer?restype=container&comp=list&prefix=a.txt&include=versions',
      ),
    ).toBe(
      '/devstoreaccount1/devstoreaccount1/mycontainer\ncomp:list\ninclude:versions\nprefix:a.txt\nrestype:container',
    );
  });

  it('canonicalizes prefix values with spaces (%20 encoding)', () => {
    expect(
      buildCanonicalizedResource(
        'devstoreaccount1',
        'http://localhost:3000/api/azure/devstoreaccount1/c?comp=list&include=versions&prefix=Screenshot%202024.png&restype=container',
      ),
    ).toBe(
      '/devstoreaccount1/devstoreaccount1/c\ncomp:list\ninclude:versions\nprefix:Screenshot 2024.png\nrestype:container',
    );
  });
});

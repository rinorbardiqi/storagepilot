import { describe, expect, it } from 'vitest';
import { normalizeAzureServiceUrl } from '@/lib/emulatorEndpoints';

describe('normalizeAzureServiceUrl', () => {
  it('appends account name to proxy root without account segment', () => {
    expect(normalizeAzureServiceUrl('/api/azure', 'devstoreaccount1')).toMatch(
      /\/api\/azure\/devstoreaccount1$/,
    );
  });

  it('preserves proxy URL that already includes the account', () => {
    const url = 'http://localhost:3000/api/azure/devstoreaccount1';
    expect(normalizeAzureServiceUrl(url, 'devstoreaccount1')).toBe(url);
  });

  it('preserves container paths after the account segment', () => {
    const url = 'http://localhost:3000/api/azure/devstoreaccount1/my-container';
    expect(normalizeAzureServiceUrl(url, 'devstoreaccount1')).toBe(url);
  });

  it('rewrites legacy direct Azurite port to the proxy base', () => {
    expect(
      normalizeAzureServiceUrl('http://localhost:10000/devstoreaccount1', 'devstoreaccount1'),
    ).toMatch(/\/api\/azure\/devstoreaccount1$/);
  });
});

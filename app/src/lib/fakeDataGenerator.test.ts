import { describe, expect, it } from 'vitest';
import { createFakeFile, parseSizeRange, FAKE_DATA_KINDS } from '../lib/fakeDataGenerator';

describe('fakeDataGenerator', () => {
  it('creates JSON files with correct type and size', () => {
    const file = createFakeFile('json', 1, 'test.json', 200, 800);
    expect(file.type).toBe('application/json');
    expect(file.name).toBe('test.json');
    expect(file.size).toBeGreaterThan(100);
  });

  it('creates CSV files with correct type', () => {
    const file = createFakeFile('csv', 2, 'test.csv', 100, 300);
    expect(file.type).toBe('text/csv');
    expect(file.size).toBeGreaterThanOrEqual(100);
  });

  it('creates SVG image files', () => {
    const file = createFakeFile('image', 3, 'test.svg', 100, 200);
    expect(file.type).toBe('image/svg+xml');
    expect(file.size).toBeGreaterThan(50);
  });

  it('parses size ranges', () => {
    expect(parseSizeRange('1024-8192')).toEqual({ min: 1024, max: 8192 });
  });

  it('defines all fake data kinds', () => {
    expect(FAKE_DATA_KINDS.map((k) => k.id)).toEqual(['json', 'csv', 'text', 'image', 'binary']);
  });
});

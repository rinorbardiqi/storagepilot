import { describe, expect, it } from 'vitest';
import {
  fileExtension,
  getFileTypeCategory,
  getPreviewKind,
  resolveContentType,
  shikiLanguageFor,
} from '@/lib/contentTypeIcons';

describe('contentTypeIcons', () => {
  it('infers extension from key', () => {
    expect(fileExtension('photos/banner.png')).toBe('png');
    expect(fileExtension('folder/')).toBe('');
  });

  it('resolves content type from extension when octet-stream', () => {
    expect(resolveContentType('data/report.pdf', 'application/octet-stream')).toBe('application/pdf');
    expect(resolveContentType('img/photo.jpg', '')).toBe('image/jpeg');
  });

  it('maps file categories from type and extension', () => {
    expect(getFileTypeCategory('a/b/report.pdf', 'application/pdf')).toBe('pdf');
    expect(getFileTypeCategory('a/b/song.mp3', 'application/octet-stream')).toBe('audio');
    expect(getFileTypeCategory('a/b/app.js', 'application/octet-stream')).toBe('code');
    expect(getFileTypeCategory('a/b/data.bin', 'application/octet-stream')).toBe('binary');
    expect(getFileTypeCategory('images/', '')).toBe('folder');
  });

  it('maps preview kinds', () => {
    expect(getPreviewKind('x/a.png', 'image/png')).toBe('image');
    expect(getPreviewKind('x/a.mp4', 'video/mp4')).toBe('video');
    expect(getPreviewKind('x/a.csv', 'text/csv')).toBe('csv');
    expect(getPreviewKind('x/a.zip', 'application/zip')).toBe('archive');
    expect(getPreviewKind('x/a.bin', 'application/octet-stream')).toBe('hex');
  });

  it('picks shiki language from extension', () => {
    expect(shikiLanguageFor('src/app.tsx', 'text/plain')).toBe('typescript');
    expect(shikiLanguageFor('data.json', 'application/json')).toBe('json');
  });
});

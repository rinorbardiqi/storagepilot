export type FakeDataKind = 'json' | 'csv' | 'text' | 'image' | 'binary';

export interface FakeDataKindDef {
  id: FakeDataKind;
  label: string;
  description: string;
  defaultPattern: string;
  defaultSizeRange: string;
  contentType: string;
}

export const FAKE_DATA_KINDS: FakeDataKindDef[] = [
  {
    id: 'json',
    label: 'JSON',
    description: 'Structured records with ids, names, and timestamps',
    defaultPattern: 'record-{n}.json',
    defaultSizeRange: '512-4096',
    contentType: 'application/json',
  },
  {
    id: 'csv',
    label: 'CSV',
    description: 'Tabular rows with headers for spreadsheet testing',
    defaultPattern: 'export-{n}.csv',
    defaultSizeRange: '1024-8192',
    contentType: 'text/csv',
  },
  {
    id: 'text',
    label: 'Text / Logs',
    description: 'Plain-text log lines with levels and timestamps',
    defaultPattern: 'app-{n}.log',
    defaultSizeRange: '2048-16384',
    contentType: 'text/plain',
  },
  {
    id: 'image',
    label: 'Images (SVG)',
    description: 'Colorful SVG thumbnails for preview testing',
    defaultPattern: 'photo-{n}.svg',
    defaultSizeRange: '800-2400',
    contentType: 'image/svg+xml',
  },
  {
    id: 'binary',
    label: 'Binary',
    description: 'Random byte blobs for size and upload testing',
    defaultPattern: 'blob-{n}.bin',
    defaultSizeRange: '1024-65536',
    contentType: 'application/octet-stream',
  },
];

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomBytes(size: number): Uint8Array {
  const buf = new Uint8Array(size);
  crypto.getRandomValues(buf);
  return buf;
}

function buildJson(index: number, targetSize: number): string {
  const rows = Math.max(3, Math.floor(targetSize / 120));
  const items = Array.from({ length: rows }, (_, i) => ({
    id: `item-${index}-${i + 1}`,
    name: `Sample ${index}-${i + 1}`,
    value: randomInt(1, 9999),
    active: i % 2 === 0,
    createdAt: new Date(Date.now() - i * 86_400_000).toISOString(),
  }));
  return JSON.stringify({ batch: index, generatedAt: new Date().toISOString(), items }, null, 2);
}

function buildCsv(index: number, targetSize: number): string {
  const headers = 'id,name,email,score,created_at';
  const lines = [headers];
  let i = 0;
  while (lines.join('\n').length < targetSize && i < 5000) {
    i++;
    lines.push(
      `${index}-${i},User ${i},user${i}@example.com,${randomInt(0, 100)},${new Date().toISOString()}`,
    );
  }
  return lines.join('\n');
}

function buildText(index: number, targetSize: number): string {
  const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'] as const;
  const lines: string[] = [];
  let i = 0;
  while (lines.join('\n').length < targetSize && i < 5000) {
    i++;
    const level = levels[i % levels.length]!;
    lines.push(
      `[${new Date().toISOString()}] ${level} batch=${index} event=${i} msg="Synthetic log line for testing"`,
    );
  }
  return lines.join('\n');
}

function buildSvg(index: number): string {
  const hue = (index * 47) % 360;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
  <rect width="320" height="240" fill="hsl(${hue}, 55%, 22%)"/>
  <circle cx="160" cy="110" r="56" fill="hsl(${hue}, 70%, 55%)" opacity="0.9"/>
  <text x="160" y="200" text-anchor="middle" fill="#e6edf3" font-family="monospace" font-size="14">fake-${index}</text>
</svg>`;
}

export function createFakeFile(
  kind: FakeDataKind,
  index: number,
  name: string,
  minSize: number,
  maxSize: number,
): File {
  const def = FAKE_DATA_KINDS.find((k) => k.id === kind)!;
  const targetSize = randomInt(minSize, maxSize);

  switch (kind) {
    case 'json': {
      const body = buildJson(index, targetSize);
      return new File([body], name, { type: def.contentType });
    }
    case 'csv': {
      const body = buildCsv(index, targetSize);
      return new File([body], name, { type: def.contentType });
    }
    case 'text': {
      const body = buildText(index, targetSize);
      return new File([body], name, { type: def.contentType });
    }
    case 'image': {
      const body = buildSvg(index);
      return new File([body], name, { type: def.contentType });
    }
    case 'binary':
    default: {
      const data = randomBytes(targetSize);
      return new File([data], name, { type: def.contentType });
    }
  }
}

export interface FakeDataPresetFile {
  kind: FakeDataKind;
  pattern: string;
  count: number;
  sizeRange: string;
  subpath?: string;
}

export interface FakeDataPreset {
  id: string;
  label: string;
  description: string;
  prefix: string;
  files: FakeDataPresetFile[];
}

export const FAKE_DATA_PRESETS: FakeDataPreset[] = [
  {
    id: 'json-batch',
    label: 'JSON batch',
    description: 'Flat JSON records for API fixture testing',
    prefix: 'fixtures/json/',
    files: [{ kind: 'json', pattern: 'record-{n}.json', count: 20, sizeRange: '512-4096' }],
  },
  {
    id: 'ecommerce',
    label: 'E-commerce catalog',
    description: 'Products CSV plus sample product images',
    prefix: 'catalog/',
    files: [
      { kind: 'csv', pattern: 'products-{n}.csv', count: 3, sizeRange: '2048-8192' },
      { kind: 'image', pattern: 'product-{n}.svg', count: 12, sizeRange: '800-2400', subpath: 'images/' },
      { kind: 'json', pattern: 'inventory-{n}.json', count: 5, sizeRange: '1024-4096', subpath: 'meta/' },
    ],
  },
  {
    id: 'ml-dataset',
    label: 'ML dataset layout',
    description: 'Train/test split with labels and binary features',
    prefix: 'datasets/ml-v1/',
    files: [
      { kind: 'csv', pattern: 'train-{n}.csv', count: 8, sizeRange: '4096-16384', subpath: 'train/' },
      { kind: 'csv', pattern: 'test-{n}.csv', count: 2, sizeRange: '2048-8192', subpath: 'test/' },
      { kind: 'binary', pattern: 'weights-{n}.bin', count: 4, sizeRange: '8192-32768', subpath: 'models/' },
      { kind: 'json', pattern: 'labels-{n}.json', count: 2, sizeRange: '512-2048', subpath: 'labels/' },
    ],
  },
  {
    id: 'logs',
    label: 'App logs',
    description: 'Rotated plain-text logs for search and preview tests',
    prefix: 'logs/',
    files: [{ kind: 'text', pattern: 'app-{n}.log', count: 15, sizeRange: '4096-16384' }],
  },
];

export function parseSizeRange(range: string): { min: number; max: number } {
  const [minStr, maxStr] = range.split('-');
  const min = Math.max(1, Number(minStr) || 1024);
  const max = Math.max(min, Number(maxStr) || min * 8);
  return { min, max };
}

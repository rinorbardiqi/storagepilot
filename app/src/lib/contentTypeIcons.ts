export type FileTypeCategory =
  | 'folder'
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'code'
  | 'json'
  | 'csv'
  | 'xml'
  | 'text'
  | 'archive'
  | 'binary'
  | 'file';

export type PreviewKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'json'
  | 'csv'
  | 'xml'
  | 'text'
  | 'code'
  | 'hex'
  | 'archive';

const EXTENSION_CATEGORY: Record<string, FileTypeCategory> = {
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  bmp: 'image',
  ico: 'image',
  avif: 'image',
  mp4: 'video',
  webm: 'video',
  mov: 'video',
  m4v: 'video',
  mkv: 'video',
  avi: 'video',
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  m4a: 'audio',
  flac: 'audio',
  aac: 'audio',
  pdf: 'pdf',
  json: 'json',
  csv: 'csv',
  tsv: 'csv',
  xml: 'xml',
  xsd: 'xml',
  xsl: 'xml',
  html: 'code',
  htm: 'code',
  css: 'code',
  js: 'code',
  mjs: 'code',
  cjs: 'code',
  jsx: 'code',
  ts: 'code',
  tsx: 'code',
  py: 'code',
  rb: 'code',
  go: 'code',
  rs: 'code',
  java: 'code',
  kt: 'code',
  swift: 'code',
  c: 'code',
  cpp: 'code',
  h: 'code',
  hpp: 'code',
  cs: 'code',
  php: 'code',
  sh: 'code',
  bash: 'code',
  zsh: 'code',
  yaml: 'code',
  yml: 'code',
  toml: 'code',
  sql: 'text',
  md: 'text',
  markdown: 'text',
  txt: 'text',
  log: 'text',
  ini: 'text',
  cfg: 'text',
  conf: 'text',
  zip: 'archive',
  tar: 'archive',
  gz: 'archive',
  tgz: 'archive',
  bz2: 'archive',
  xz: 'archive',
  '7z': 'archive',
  rar: 'archive',
  bin: 'binary',
  dat: 'binary',
  exe: 'binary',
  dll: 'binary',
  wasm: 'binary',
};

const CODE_EXTENSIONS = new Set([
  'html',
  'htm',
  'css',
  'js',
  'mjs',
  'cjs',
  'jsx',
  'ts',
  'tsx',
  'py',
  'rb',
  'go',
  'rs',
  'java',
  'kt',
  'swift',
  'c',
  'cpp',
  'h',
  'hpp',
  'cs',
  'php',
  'sh',
  'bash',
  'zsh',
  'yaml',
  'yml',
  'toml',
]);

export function fileExtension(key: string): string {
  const name = key.replace(/\/$/, '').split('/').pop() ?? key;
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return '';
  return name.slice(dot + 1).toLowerCase();
}

export function resolveContentType(key: string, contentType: string): string {
  const trimmed = contentType?.trim() ?? '';
  if (trimmed && trimmed !== 'application/octet-stream') return trimmed;

  const ext = fileExtension(key);
  const fromExt: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    pdf: 'application/pdf',
    json: 'application/json',
    csv: 'text/csv',
    xml: 'application/xml',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    ts: 'text/typescript',
    md: 'text/markdown',
    txt: 'text/plain',
    log: 'text/plain',
    sql: 'application/sql',
    zip: 'application/zip',
  };
  return fromExt[ext] ?? (trimmed || 'application/octet-stream');
}

export function isImage(contentType: string): boolean {
  return contentType.startsWith('image/');
}

export function isVideo(contentType: string): boolean {
  return contentType.startsWith('video/');
}

export function isAudio(contentType: string): boolean {
  return contentType.startsWith('audio/');
}

export function isPdf(contentType: string): boolean {
  return contentType === 'application/pdf';
}

export function isJson(contentType: string): boolean {
  return contentType === 'application/json' || contentType.endsWith('+json');
}

export function isCsv(contentType: string, key?: string): boolean {
  if (contentType === 'text/csv' || contentType === 'application/csv') return true;
  if (key) return fileExtension(key) === 'csv' || fileExtension(key) === 'tsv';
  return false;
}

export function isXml(contentType: string): boolean {
  return (
    contentType === 'text/xml' ||
    contentType === 'application/xml' ||
    contentType.endsWith('+xml')
  );
}

export function isArchive(contentType: string, key?: string): boolean {
  if (
    contentType === 'application/zip' ||
    contentType === 'application/x-tar' ||
    contentType === 'application/gzip' ||
    contentType === 'application/x-7z-compressed' ||
    contentType === 'application/vnd.rar'
  ) {
    return true;
  }
  if (!key) return false;
  const ext = fileExtension(key);
  return ext === 'zip' || ext === 'tar' || ext === 'gz' || ext === 'tgz' || ext === '7z' || ext === 'rar';
}

export function isText(contentType: string): boolean {
  return (
    contentType.startsWith('text/') ||
    contentType === 'application/json' ||
    contentType === 'application/xml' ||
    contentType === 'application/sql'
  );
}

export function isCode(contentType: string, key?: string): boolean {
  if (
    contentType.includes('javascript') ||
    contentType.includes('typescript') ||
    contentType === 'text/html' ||
    contentType === 'text/css' ||
    contentType === 'application/x-yaml' ||
    contentType === 'text/x-python'
  ) {
    return true;
  }
  if (!key) return false;
  return CODE_EXTENSIONS.has(fileExtension(key));
}

export function isBinary(contentType: string, key?: string): boolean {
  if (contentType === 'application/octet-stream') return true;
  if (!key) return false;
  const ext = fileExtension(key);
  return ext === 'bin' || ext === 'dat' || ext === 'exe' || ext === 'dll' || ext === 'wasm';
}

export function getFileTypeCategory(key: string, contentType = ''): FileTypeCategory {
  if (key.endsWith('/') || key.endsWith('\\')) return 'folder';

  const resolved = resolveContentType(key, contentType);
  if (isImage(resolved)) return 'image';
  if (isVideo(resolved)) return 'video';
  if (isAudio(resolved)) return 'audio';
  if (isPdf(resolved)) return 'pdf';
  if (isJson(resolved)) return 'json';
  if (isCsv(resolved, key)) return 'csv';
  if (isXml(resolved)) return 'xml';
  if (isArchive(resolved, key)) return 'archive';
  if (isCode(resolved, key)) return 'code';
  if (isText(resolved)) return 'text';
  if (isBinary(resolved, key)) return 'binary';

  const fromExt = EXTENSION_CATEGORY[fileExtension(key)];
  return fromExt ?? 'file';
}

export function getPreviewKind(key: string, contentType = ''): PreviewKind {
  const resolved = resolveContentType(key, contentType);
  if (isImage(resolved)) return 'image';
  if (isVideo(resolved)) return 'video';
  if (isAudio(resolved)) return 'audio';
  if (isPdf(resolved)) return 'pdf';
  if (isJson(resolved)) return 'json';
  if (isCsv(resolved, key)) return 'csv';
  if (isXml(resolved)) return 'xml';
  if (isArchive(resolved, key)) return 'archive';
  if (isCode(resolved, key)) return 'code';
  if (isText(resolved)) return 'text';
  return 'hex';
}

export function shikiLanguageFor(key: string, contentType: string): string {
  const ext = fileExtension(key);
  const resolved = resolveContentType(key, contentType);
  if (isJson(resolved)) return 'json';
  if (isXml(resolved)) return 'xml';
  if (isCsv(resolved, key)) return 'csv';

  const map: Record<string, string> = {
    js: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    kt: 'kotlin',
    swift: 'plaintext',
    cs: 'csharp',
    php: 'php',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    html: 'html',
    htm: 'html',
    css: 'css',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    sql: 'sql',
    md: 'markdown',
    markdown: 'markdown',
    log: 'plaintext',
    txt: 'plaintext',
  };
  return map[ext] ?? 'plaintext';
}

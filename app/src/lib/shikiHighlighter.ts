import { createHighlighter, type Highlighter } from 'shiki';

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: [
        'json',
        'javascript',
        'typescript',
        'xml',
        'html',
        'css',
        'shell',
        'python',
        'sql',
        'markdown',
        'plaintext',
        'yaml',
        'toml',
        'csv',
        'ruby',
        'go',
        'rust',
        'java',
        'kotlin',
        'csharp',
        'php',
      ],
    });
  }
  return highlighterPromise;
}

export async function highlightCode(
  source: string,
  language: string,
  maxChars = 500_000,
): Promise<string> {
  const text = source.length > maxChars ? `${source.slice(0, maxChars)}\n\n… truncated for preview` : source;
  const highlighter = await getHighlighter();
  let lang = language;
  if (!highlighter.getLoadedLanguages().includes(lang as never)) {
    try {
      await highlighter.loadLanguage(lang as never);
    } catch {
      lang = 'plaintext';
    }
  }
  return highlighter.codeToHtml(text, { lang, theme: 'github-dark' });
}

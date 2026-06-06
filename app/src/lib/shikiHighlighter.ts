import { createHighlighterCore, type HighlighterCore, type LanguageInput } from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';
import langCsharp from 'shiki/langs/csharp.mjs';
import langCss from 'shiki/langs/css.mjs';
import langGo from 'shiki/langs/go.mjs';
import langHtml from 'shiki/langs/html.mjs';
import langJava from 'shiki/langs/java.mjs';
import langJavascript from 'shiki/langs/javascript.mjs';
import langJson from 'shiki/langs/json.mjs';
import langKotlin from 'shiki/langs/kotlin.mjs';
import langMarkdown from 'shiki/langs/markdown.mjs';
import langPhp from 'shiki/langs/php.mjs';
import langPython from 'shiki/langs/python.mjs';
import langRuby from 'shiki/langs/ruby.mjs';
import langRust from 'shiki/langs/rust.mjs';
import langShell from 'shiki/langs/shellscript.mjs';
import langSql from 'shiki/langs/sql.mjs';
import langToml from 'shiki/langs/toml.mjs';
import langTs from 'shiki/langs/typescript.mjs';
import langXml from 'shiki/langs/xml.mjs';
import langYaml from 'shiki/langs/yaml.mjs';
import themeGithubDark from 'shiki/themes/github-dark.mjs';

const BUNDLED_LANGS = [
  langJson,
  langJavascript,
  langTs,
  langXml,
  langHtml,
  langCss,
  langShell,
  langPython,
  langSql,
  langMarkdown,
  langYaml,
  langToml,
  langRuby,
  langGo,
  langRust,
  langJava,
  langKotlin,
  langCsharp,
  langPhp,
] as const;

const BUNDLED_LANG_NAMES = new Set([
  'json',
  'javascript',
  'typescript',
  'xml',
  'html',
  'css',
  'shellscript',
  'python',
  'sql',
  'markdown',
  'yaml',
  'toml',
  'ruby',
  'go',
  'rust',
  'java',
  'kotlin',
  'csharp',
  'php',
  'plaintext',
]);

const LANG_ALIASES: Record<string, string> = {
  csv: 'plaintext',
  shell: 'shellscript',
  bash: 'shellscript',
  zsh: 'shellscript',
};

function resolveLang(language: string): string {
  const aliased = LANG_ALIASES[language] ?? language;
  return BUNDLED_LANG_NAMES.has(aliased) ? aliased : 'plaintext';
}

function escapeHtml(source: string): string {
  return source
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [themeGithubDark],
      langs: [...BUNDLED_LANGS] as LanguageInput[],
      engine: createOnigurumaEngine(),
    });
  }
  return highlighterPromise;
}

export async function highlightCode(
  source: string,
  language: string,
  maxChars = 500_000,
): Promise<string> {
  const text =
    source.length > maxChars ? `${source.slice(0, maxChars)}\n\n… truncated for preview` : source;
  const lang = resolveLang(language);
  if (lang === 'plaintext') {
    return `<pre class="shiki github-dark"><code>${escapeHtml(text)}</code></pre>`;
  }
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(text, { lang, theme: 'github-dark' });
}

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const appVersion = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
).version as string;

function resolveGitBranch(): string {
  if (process.env.GIT_BRANCH?.trim()) return process.env.GIT_BRANCH.trim();
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'dev';
  }
}

const gitBranch = resolveGitBranch();

function urlFetchProxyPlugin(): Plugin {
  return {
    name: 'url-fetch-proxy',
    configureServer(server) {
      server.middlewares.use('/api/fetch', (req: IncomingMessage, res: ServerResponse, next) => {
        if (req.method !== 'GET') {
          next();
          return;
        }
        void (async () => {
          try {
            const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
            const target = requestUrl.searchParams.get('url');
            if (!target) {
              res.statusCode = 400;
              res.end('Missing url parameter');
              return;
            }
            let parsed: URL;
            try {
              parsed = new URL(target);
            } catch {
              res.statusCode = 400;
              res.end('Invalid url parameter');
              return;
            }
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
              res.statusCode = 400;
              res.end('Only http(s) URLs are supported');
              return;
            }
            const upstream = await fetch(target, { redirect: 'follow' });
            if (!upstream.ok) {
              res.statusCode = upstream.status;
              res.end(`Upstream HTTP ${upstream.status}`);
              return;
            }
            res.statusCode = 200;
            res.setHeader(
              'Content-Type',
              upstream.headers.get('content-type') || 'application/octet-stream',
            );
            const body = Buffer.from(await upstream.arrayBuffer());
            res.end(body);
          } catch (err) {
            res.statusCode = 502;
            res.end(err instanceof Error ? err.message : 'Fetch failed');
          }
        })();
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: mode === 'marketing' ? './' : '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [react(), tailwindcss(), urlFetchProxyPlugin()],
  build: {
    rollupOptions: {
      input:
        mode === 'marketing'
          ? resolve(__dirname, 'index.marketing.html')
          : resolve(__dirname, 'index.html'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __GIT_BRANCH__: JSON.stringify(gitBranch),
    // Keep in sync with app/Dockerfile emulator image pins
    __EMULATOR_GCS_VERSION__: JSON.stringify('1.54.0'),
    __EMULATOR_S3_VERSION__: JSON.stringify('RELEASE.2026-04-17T00-00-00Z'),
    __EMULATOR_AZURE_VERSION__: JSON.stringify('3.35.0'),
    __DOCKER_MODE__: JSON.stringify(process.env.VITE_DOCKER_MODE ?? 'dev'),
  },
  server: {
    port: 5173,
    proxy: {
      '/api/gcs': {
        target: 'http://localhost:4443',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gcs/, ''),
      },
      '/api/s3': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/s3/, ''),
      },
      '/api/azure': {
        target: process.env.VITE_AZURE_PROXY_TARGET ?? 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const origin = req.headers.origin;
            if (origin) {
              res.setHeader('Access-Control-Allow-Origin', origin);
              res.setHeader('Vary', 'Origin');
            }
            res.setHeader(
              'Access-Control-Expose-Headers',
              'etag, x-ms-request-id, content-length, content-type, last-modified, x-ms-version',
            );
          });
        },
        bypass(req, res) {
          if (req.method === 'OPTIONS' && res) {
            const origin = req.headers.origin ?? '*';
            res.writeHead(204, {
              'Access-Control-Allow-Origin': origin,
              'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, HEAD, OPTIONS',
              'Access-Control-Allow-Headers':
              'Authorization, Content-Type, Content-Length, x-ms-date, x-ms-version, x-ms-blob-type, x-ms-blob-content-type, x-ms-copy-source, x-ms-meta-*',
              'Access-Control-Max-Age': '86400',
              Vary: 'Origin',
            });
            res.end();
            return req.url;
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    globals: true,
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'tests/integration/**', '**/node_modules/**', '**/dist/**'],
  },
}));

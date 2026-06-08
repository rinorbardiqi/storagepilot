import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
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

export default defineConfig(({ mode }) => ({
  base: mode === 'marketing' ? './' : '/',
  plugins: [react(), tailwindcss()],
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
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
}));

#!/usr/bin/env node
/**
 * Same-origin proxy for Upload → From URL in bundled Docker images.
 * Nginx forwards /api/fetch to 127.0.0.1:8099 (see docker-nginx-render.sh).
 * Dev server uses the same fetch logic via vite.config.ts.
 */
import http from 'node:http';
import { fetchRemoteUrl, UrlFetchError } from './url-fetch-guard.mjs';

const HOST = process.env.URL_FETCH_PROXY_HOST ?? '127.0.0.1';
const PORT = Number(process.env.URL_FETCH_PROXY_PORT ?? 8099);

const server = http.createServer((req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end('Method not allowed');
    return;
  }

  const requestUrl = new URL(req.url ?? '/', `http://${HOST}`);
  if (requestUrl.pathname !== '/api/fetch') {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }

  void (async () => {
    const target = requestUrl.searchParams.get('url');
    if (!target) {
      res.statusCode = 400;
      res.end('Missing url parameter');
      return;
    }
    try {
      const { contentType, body } = await fetchRemoteUrl(target);
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', String(body.length));
      res.end(body);
    } catch (err) {
      res.statusCode = err instanceof UrlFetchError ? err.status : 502;
      res.end(err instanceof Error ? err.message : 'Fetch failed');
    }
  })();
});

server.listen(PORT, HOST, () => {
  console.log(`url-fetch-proxy listening on http://${HOST}:${PORT}`);
});

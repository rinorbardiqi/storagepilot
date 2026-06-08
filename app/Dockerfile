# ── Stage 1: Build the React app ────────────────────────────────────────────
# Used for local `docker build`. In CI, dist/ is pre-built and injected via
# the build context — the builder stage is skipped automatically because
# the COPY below resolves from the context first when dist/ exists.
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
# App-only bundle — landing page is built separately (`pnpm run build:marketing`).
ENV VITE_SITE_MODE=app
RUN pnpm run build

# Emulator binaries (pinned versions for reproducible multi-arch builds)
FROM fsouza/fake-gcs-server:1.54.0 AS fake-gcs
# minio/minio was archived Apr 2026; pgsty/minio is the maintained community fork
FROM pgsty/minio:RELEASE.2026-04-17T00-00-00Z AS minio-bin
FROM mcr.microsoft.com/azure-storage/azurite:3.35.0 AS azurite-bin

# ── Stage 2: UI-only proxy (~30MB) ──────────────────────────────────────────
FROM nginx:alpine-slim AS ui
LABEL org.opencontainers.image.title="StoragePilot"
LABEL org.opencontainers.image.description="Unified web UI for GCS, S3, and Azure storage emulators (UI proxy only)"
LABEL org.opencontainers.image.source="https://github.com/rinorbardiqi/storagepilot"
ENV NGINX_ENTRYPOINT_QUIET_LOGS=1
RUN apk upgrade --no-cache \
    && apk del --no-cache curl 2>/dev/null || true \
    && sed -i 's/error_log  \/var\/log\/nginx\/error.log notice;/error_log  \/dev\/stderr warn;/' /etc/nginx/nginx.conf \
    && rm -rf /var/cache/apk/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker-nginx-render.sh /docker-nginx-render.sh
COPY docker-entrypoint.sh /docker-entrypoint.d/40-storagepilot-env.sh
RUN chmod +x /docker-nginx-render.sh /docker-entrypoint.d/40-storagepilot-env.sh
EXPOSE 80

# ── Stage 3: Full stack (UI + bundled emulators) ─────────────────────────────
FROM nginx:alpine-slim AS full
LABEL org.opencontainers.image.title="StoragePilot Full"
LABEL org.opencontainers.image.description="StoragePilot with bundled fake-gcs-server, MinIO, and Azurite"
LABEL org.opencontainers.image.source="https://github.com/rinorbardiqi/storagepilot"
ENV NGINX_ENTRYPOINT_QUIET_LOGS=1
ENV STORAGEPILOT_MODE=bundled
ENV ENABLED_PROVIDERS=gcs,s3,azure
RUN apk upgrade --no-cache \
    && apk add --no-cache tini wget nodejs \
    && sed -i 's/error_log  \/var\/log\/nginx\/error.log notice;/error_log  \/dev\/stderr warn;/' /etc/nginx/nginx.conf \
    && rm -rf /var/cache/apk/*
COPY --from=fake-gcs /bin/fake-gcs-server /usr/local/bin/fake-gcs-server
COPY --from=minio-bin /usr/bin/minio /usr/local/bin/minio
# Azurite app tree from the official image (/opt/azurite; smaller than npm install -g).
COPY --from=azurite-bin /opt/azurite /opt/azurite
RUN printf '%s\n' '#!/bin/sh' 'exec node /opt/azurite/dist/src/blob/main.js "$@"' \
    > /usr/local/bin/azurite-blob \
    && chmod +x /usr/local/bin/azurite-blob
RUN strip /usr/local/bin/minio /usr/local/bin/fake-gcs-server 2>/dev/null || true
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker-nginx-render.sh /docker-nginx-render.sh
COPY docker-entrypoint-full.sh /docker-entrypoint.d/40-storagepilot-full.sh
COPY scripts/url-fetch-proxy.mjs /usr/local/bin/url-fetch-proxy.mjs
RUN chmod +x /docker-nginx-render.sh /docker-entrypoint.d/40-storagepilot-full.sh /usr/local/bin/url-fetch-proxy.mjs
VOLUME /data
EXPOSE 80 9000
ENTRYPOINT ["/sbin/tini", "--", "/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

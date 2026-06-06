# Stage 1 — build (not included in final image)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Emulator binaries (pinned versions for reproducible multi-arch builds)
FROM fsouza/fake-gcs-server:1.52.3 AS fake-gcs
FROM minio/minio:RELEASE.2025-04-22T22-12-26Z AS minio-bin
FROM minio/mc:RELEASE.2025-04-16T18-13-26Z AS minio-mc

# Stage 2 — UI-only proxy (~30MB)
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

# Stage 3 — Full stack (UI + bundled emulators)
FROM nginx:alpine-slim AS full
LABEL org.opencontainers.image.title="StoragePilot Full"
LABEL org.opencontainers.image.description="StoragePilot with bundled fake-gcs-server, MinIO, and Azurite"
LABEL org.opencontainers.image.source="https://github.com/rinorbardiqi/storagepilot"
ENV NGINX_ENTRYPOINT_QUIET_LOGS=1
ENV STORAGEPILOT_MODE=bundled
ENV ENABLED_PROVIDERS=gcs,s3,azure
RUN apk upgrade --no-cache \
    && apk add --no-cache nodejs npm tini wget \
    && npm install -g azurite@3.34.0 \
    && apk del npm \
    && sed -i 's/error_log  \/var\/log\/nginx\/error.log notice;/error_log  \/dev\/stderr warn;/' /etc/nginx/nginx.conf \
    && rm -rf /var/cache/apk/*
COPY --from=fake-gcs /bin/fake-gcs-server /usr/local/bin/fake-gcs-server
COPY --from=minio-bin /usr/bin/minio /usr/local/bin/minio
COPY --from=minio-mc /usr/bin/mc /usr/local/bin/mc
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker-nginx-render.sh /docker-nginx-render.sh
COPY docker-entrypoint-full.sh /docker-entrypoint.d/40-storagepilot-full.sh
RUN chmod +x /docker-nginx-render.sh /docker-entrypoint.d/40-storagepilot-full.sh
VOLUME /data
EXPOSE 80 9000
ENTRYPOINT ["/sbin/tini", "--", "/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

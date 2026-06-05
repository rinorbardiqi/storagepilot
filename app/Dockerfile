# Stage 1 — build
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 — serve (Debian base: avoids Alpine busybox CVE-2025-60876; no upstream fix yet)
FROM nginx:stable-bookworm
LABEL org.opencontainers.image.title="StoragePilot"
LABEL org.opencontainers.image.description="Unified web UI for GCS, S3, and Azure storage emulators"
LABEL org.opencontainers.image.source="https://github.com/rinorbardiqi/storagepilot"
ENV NGINX_ENTRYPOINT_QUIET_LOGS=1
RUN apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && apt-get purge -y --auto-remove curl 2>/dev/null || true \
    && sed -i 's/error_log  \/var\/log\/nginx\/error.log notice;/error_log  \/dev\/stderr warn;/' /etc/nginx/nginx.conf \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/storagepilot.conf.stub
COPY docker-entrypoint.sh /docker-entrypoint.d/40-storagepilot-env.sh
RUN chmod +x /docker-entrypoint.d/40-storagepilot-env.sh
EXPOSE 80

# Stage 1 — build (not included in final image)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 — serve (alpine-slim: ~26 packages vs 200+ on nginx:bookworm)
FROM nginx:alpine-slim
LABEL org.opencontainers.image.title="StoragePilot"
LABEL org.opencontainers.image.description="Unified web UI for GCS, S3, and Azure storage emulators"
LABEL org.opencontainers.image.source="https://github.com/rinorbardiqi/storagepilot"
ENV NGINX_ENTRYPOINT_QUIET_LOGS=1
RUN apk upgrade --no-cache \
    && apk del --no-cache curl 2>/dev/null || true \
    && sed -i 's/error_log  \/var\/log\/nginx\/error.log notice;/error_log  \/dev\/stderr warn;/' /etc/nginx/nginx.conf \
    && rm -rf /var/cache/apk/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/storagepilot.conf.stub
COPY docker-entrypoint.sh /docker-entrypoint.d/40-storagepilot-env.sh
RUN chmod +x /docker-entrypoint.d/40-storagepilot-env.sh
EXPOSE 80

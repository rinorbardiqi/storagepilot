#!/bin/sh
# Shared nginx config renderer for ui and full images.
# Expects GCS_URL, S3_URL, AZURE_URL and optional provider enable flags.

set -e

GCS_ENABLED="${GCS_ENABLED:-1}"
S3_ENABLED="${S3_ENABLED:-1}"
AZURE_ENABLED="${AZURE_ENABLED:-1}"

resolve_upstream_defaults() {
  if [ "${STORAGEPILOT_MODE:-}" = "bundled" ]; then
    GCS_DEFAULT="http://127.0.0.1:4443"
    S3_DEFAULT="http://127.0.0.1:9000"
    AZURE_DEFAULT="http://127.0.0.1:10000"
    USE_RESOLVER=0
    return
  fi

  HOST="${STORAGEPILOT_HOST:-}"
  if [ -n "$HOST" ] && [ "$HOST" != "compose" ]; then
    GCS_DEFAULT="http://${HOST}:4443"
    S3_DEFAULT="http://${HOST}:9000"
    AZURE_DEFAULT="http://${HOST}:10000"
  else
    GCS_DEFAULT="http://fake-gcs:4443"
    S3_DEFAULT="http://minio:9000"
    AZURE_DEFAULT="http://azurite:10000"
  fi
  USE_RESOLVER=1
}

resolve_upstream_defaults

export GCS_URL="${GCS_URL:-$GCS_DEFAULT}"
export S3_URL="${S3_URL:-$S3_DEFAULT}"
export AZURE_URL="${AZURE_URL:-$AZURE_DEFAULT}"

gcs_block() {
  if [ "$GCS_ENABLED" = "1" ]; then
    cat <<EOF
  location /api/gcs/ {
    set \$gcs_upstream ${GCS_URL};
    rewrite ^/api/gcs/(.*)$ /\$1 break;
    proxy_pass \$gcs_upstream;
    proxy_set_header Host \$http_host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_request_buffering off;
    proxy_buffering off;
    client_max_body_size 5G;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
  }
EOF
  else
    cat <<'EOF'
  location /api/gcs/ {
    default_type application/json;
    return 503 '{"error":"GCS emulator not enabled. Restart with ENABLED_PROVIDERS including gcs."}';
  }
EOF
  fi
}

s3_block() {
  if [ "$S3_ENABLED" = "1" ]; then
    cat <<EOF
  location /api/s3/ {
    set \$s3_upstream ${S3_URL};
    rewrite ^/api/s3/(.*)$ /\$1 break;
    proxy_pass \$s3_upstream;
    proxy_set_header Host \$http_host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_request_buffering off;
    proxy_buffering off;
    client_max_body_size 5G;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
  }
EOF
  else
    cat <<'EOF'
  location /api/s3/ {
    default_type application/json;
    return 503 '{"error":"S3 emulator not enabled. Restart with ENABLED_PROVIDERS including s3."}';
  }
EOF
  fi
}

azure_block() {
  if [ "$AZURE_ENABLED" = "1" ]; then
    cat <<EOF
  location /api/azure/ {
    if (\$request_method = OPTIONS) {
      add_header Access-Control-Allow-Origin \$http_origin always;
      add_header Access-Control-Allow-Methods "GET, PUT, POST, DELETE, HEAD, OPTIONS" always;
      add_header Access-Control-Allow-Headers "Authorization, Content-Type, Content-Length, x-ms-date, x-ms-version, x-ms-blob-type, x-ms-copy-source, x-ms-meta-*" always;
      add_header Access-Control-Max-Age 86400 always;
      add_header Content-Length 0;
      return 204;
    }

    add_header Access-Control-Allow-Origin \$http_origin always;
    add_header Access-Control-Expose-Headers "etag, x-ms-request-id, content-length, content-type, last-modified, x-ms-version" always;
    add_header Vary Origin always;

    set \$azure_upstream ${AZURE_URL};
    rewrite ^/api/azure/(.*)$ /\$1 break;
    proxy_pass \$azure_upstream;
    proxy_set_header Host \$http_host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_request_buffering off;
    proxy_buffering off;
    client_max_body_size 5G;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
  }
EOF
  else
    cat <<'EOF'
  location /api/azure/ {
    default_type application/json;
    return 503 '{"error":"Azure emulator not enabled. Restart with ENABLED_PROVIDERS including azure."}';
  }
EOF
  fi
}

{
  cat <<'HEADER'
server {
  listen 80;
HEADER

  if [ "$USE_RESOLVER" = "1" ]; then
    echo '  resolver 127.0.0.11 valid=10s ipv6=off;'
  fi

  cat <<'MIDDLE'

  location ~* \.mjs$ {
    root /usr/share/nginx/html;
    default_type application/javascript;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
  }

  location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
  }

MIDDLE

  gcs_block
  s3_block
  azure_block

  echo '}'
} > /etc/nginx/conf.d/default.conf

port_from_url() {
  case "$1" in
    *:*) printf '%s\n' "${1##*:}" ;;
    http://*) printf '80\n' ;;
    https://*) printf '443\n' ;;
    *) printf '%s\n' "$1" ;;
  esac
}

GCS_PORT="$(port_from_url "$GCS_URL")"
S3_PORT="$(port_from_url "$S3_URL")"
AZURE_PORT="$(port_from_url "$AZURE_URL")"

ENABLED_LIST=""
[ "$GCS_ENABLED" = "1" ] && ENABLED_LIST="${ENABLED_LIST}gcs "
[ "$S3_ENABLED" = "1" ] && ENABLED_LIST="${ENABLED_LIST}s3 "
[ "$AZURE_ENABLED" = "1" ] && ENABLED_LIST="${ENABLED_LIST}azure "

echo "StoragePilot ready on port 80 [${ENABLED_LIST:-none}] (GCS ${GCS_PORT} · S3 ${S3_PORT} · Azure ${AZURE_PORT})"

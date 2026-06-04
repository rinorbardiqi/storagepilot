#!/bin/sh
set -e

# One env var for standalone / external emulators:
#   STORAGEPILOT_HOST=host.docker.internal
# Uses standard ports: GCS 4443, S3 9000, Azure 10000.
#
# Omit for full docker compose (defaults to internal service names).
# Advanced: GCS_URL, S3_URL, AZURE_URL still override individually.

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

export GCS_URL="${GCS_URL:-$GCS_DEFAULT}"
export S3_URL="${S3_URL:-$S3_DEFAULT}"
export AZURE_URL="${AZURE_URL:-$AZURE_DEFAULT}"

envsubst '${GCS_URL} ${S3_URL} ${AZURE_URL}' \
  < /etc/nginx/storagepilot.conf.stub \
  > /etc/nginx/conf.d/default.conf

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

echo "StoragePilot ready on port 80 (GCS ${GCS_PORT} · S3 ${S3_PORT} · Azure ${AZURE_PORT})"

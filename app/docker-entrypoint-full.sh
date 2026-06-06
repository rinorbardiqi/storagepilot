#!/bin/sh
set -e

# Bundled all-in-one image: start selected emulators, write setup manifest, render nginx.

ENABLED_PROVIDERS="${ENABLED_PROVIDERS:-gcs,s3,azure}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:-storagepilot}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-storagepilot}"

GCS_ENABLED=0
S3_ENABLED=0
AZURE_ENABLED=0

PIDS=""

cleanup() {
  for pid in $PIDS; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup INT TERM

provider_enabled() {
  case ",${ENABLED_PROVIDERS}," in
    *,"$1",*) return 0 ;;
    *) return 1 ;;
  esac
}

# Validate and normalize ENABLED_PROVIDERS
NORMALIZED=""
for token in $(printf '%s' "$ENABLED_PROVIDERS" | tr ',' ' '); do
  token=$(printf '%s' "$token" | tr '[:upper:]' '[:lower:]' | tr -d ' ')
  case "$token" in
    gcs|s3|azure)
      case ",${NORMALIZED}," in
        *,"$token",*) ;;
        *) NORMALIZED="${NORMALIZED}${NORMALIZED:+,}$token" ;;
      esac
      ;;
    *)
      echo "storagepilot: ignoring unknown provider token '$token'" >&2
      ;;
  esac
done

if [ -z "$NORMALIZED" ]; then
  echo "storagepilot: ENABLED_PROVIDERS empty or invalid; defaulting to gcs,s3,azure" >&2
  NORMALIZED="gcs,s3,azure"
fi
ENABLED_PROVIDERS="$NORMALIZED"

provider_enabled gcs && GCS_ENABLED=1
provider_enabled s3 && S3_ENABLED=1
provider_enabled azure && AZURE_ENABLED=1

export STORAGEPILOT_MODE=bundled
export GCS_ENABLED S3_ENABLED AZURE_ENABLED

mkdir -p /data

if [ "$GCS_ENABLED" = "1" ]; then
  mkdir -p /data/gcs
  fake-gcs-server \
    -scheme http \
    -port 4443 \
    -host 127.0.0.1 \
    -filesystem-root /data/gcs \
    -public-host localhost:4443 &
  PIDS="$PIDS $!"
fi

if [ "$S3_ENABLED" = "1" ]; then
  mkdir -p /data/s3
  MINIO_API_CORS_ALLOW_ORIGIN="${MINIO_API_CORS_ALLOW_ORIGIN:-*}" \
  MINIO_ROOT_USER="$MINIO_ROOT_USER" MINIO_ROOT_PASSWORD="$MINIO_ROOT_PASSWORD" \
    minio server /data/s3 --address ":9000" --console-address ":9001" &
  PIDS="$PIDS $!"

  i=0
  while [ "$i" -lt 60 ]; do
    if wget -q -O /dev/null http://127.0.0.1:9000/minio/health/ready 2>/dev/null; then
      break
    fi
    i=$((i + 1))
    sleep 1
  done

  if [ "$i" -ge 60 ]; then
    echo "storagepilot: MinIO did not become ready in time" >&2
    exit 1
  fi

fi

if [ "$AZURE_ENABLED" = "1" ]; then
  mkdir -p /data/azure
  azurite-blob \
    --blobHost 127.0.0.1 \
    --blobPort 10000 \
    --location /data/azure \
    --loose \
    --skipApiVersionCheck &
  PIDS="$PIDS $!"
  sleep 1
fi

# Build setup-manifest.json for the UI
MANIFEST_PROVIDERS="["
first=1
for token in $(printf '%s' "$ENABLED_PROVIDERS" | tr ',' ' '); do
  [ "$first" = "1" ] || MANIFEST_PROVIDERS="${MANIFEST_PROVIDERS},"
  first=0
  MANIFEST_PROVIDERS="${MANIFEST_PROVIDERS}\"${token}\""
done
MANIFEST_PROVIDERS="${MANIFEST_PROVIDERS}]"

PORTS_JSON="{\"ui\":80"
[ "$S3_ENABLED" = "1" ] && PORTS_JSON="${PORTS_JSON},\"s3\":9000"
[ "$GCS_ENABLED" = "1" ] && PORTS_JSON="${PORTS_JSON},\"gcs\":4443"
[ "$AZURE_ENABLED" = "1" ] && PORTS_JSON="${PORTS_JSON},\"azure\":10000"
PORTS_JSON="${PORTS_JSON}}"

printf '{"deployment":"bundled","enabledProviders":%s,"ports":%s}\n' \
  "$MANIFEST_PROVIDERS" "$PORTS_JSON" \
  > /usr/share/nginx/html/setup-manifest.json

. /docker-nginx-render.sh

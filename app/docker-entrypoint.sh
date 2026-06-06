#!/bin/sh
set -e

# UI-only / compose / standalone proxy image.
# One env var for external emulators: STORAGEPILOT_HOST=host.docker.internal
# Advanced: GCS_URL, S3_URL, AZURE_URL override individually.

export GCS_ENABLED=1
export S3_ENABLED=1
export AZURE_ENABLED=1
unset STORAGEPILOT_MODE

. /docker-nginx-render.sh

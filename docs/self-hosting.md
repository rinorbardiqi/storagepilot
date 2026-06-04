# Self-hosting StoragePilot

## Docker Hub

```bash
docker pull storagepilot/storagepilot:latest
```

## Full stack (recommended)

Runs UI + all three emulators. **No environment variables required.**

```bash
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000) (override host port with `PORT`).

## UI only (standalone image)

If emulators already run on your machine, use **one** env var — `STORAGEPILOT_HOST`:

```bash
docker compose -f docker-compose.standalone.yml up -d
```

Or with `docker run`:

```bash
docker run -d --name storagepilot \
  -p 3000:80 \
  -e STORAGEPILOT_HOST=host.docker.internal \
  --add-host=host.docker.internal:host-gateway \
  storagepilot/storagepilot:latest
```

`STORAGEPILOT_HOST` is the hostname where all emulators listen on the default ports:

| Provider | Port |
|----------|------|
| GCS (fake-gcs-server) | 4443 |
| S3 (MinIO) | 9000 |
| Azure (Azurite) | 10000 |

Example with a remote host:

```bash
docker run -d -p 3000:80 -e STORAGEPILOT_HOST=192.168.1.50 storagepilot/storagepilot:latest
```

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STORAGEPILOT_HOST` | No | *(compose mode)* | Host for external emulators (standalone). Omit when using full `docker compose up`. |
| `PORT` | No | `3000` | Host port mapped to the UI (compose only) |
| `MINIO_USER` | No | `storagepilot` | MinIO root user (emulator service) |
| `MINIO_PASSWORD` | No | `storagepilot` | MinIO root password (emulator service) |

Optional per-provider overrides (advanced): `GCS_URL`, `S3_URL`, `AZURE_URL`.

## Data persistence

Emulator data is stored under `./data/gcs`, `./data/s3`, and `./data/azure`.

## Publishing

Tag a release (`v*`) to push multi-arch images to Docker Hub (`storagepilot/storagepilot`) and GHCR.

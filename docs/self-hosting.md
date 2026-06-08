# Self-hosting StoragePilot

## Image tags

| Tag | Contents | Compressed size (Docker Hub) |
|-----|----------|------------------------------|
| `rinorbardiqi/storagepilot:full` | UI + fake-gcs + MinIO + Azurite (recommended) | ~135 MB |
| `rinorbardiqi/storagepilot:ui` | UI proxy only | ~18 MB |
| `rinorbardiqi/storagepilot:latest` | Same as `:ui` (backward compatible) | ~18 MB |

## All-in-one (`:full`)

No compose file required.

```bash
docker pull rinorbardiqi/storagepilot:full
docker run -d \
  --name storagepilot \
  -p 3000:80 \
  -p 9000:9000 \
  -v storagepilot-data:/data \
  rinorbardiqi/storagepilot:full
```

Open [http://localhost:3000](http://localhost:3000).

**License note:** `:full` bundles [MinIO](https://min.io/) (GNU AGPL v3) when `s3` is
enabled, plus fake-gcs-server (BSD-3-Clause) and Azurite (MIT). StoragePilot
application code is MIT. See [THIRD-PARTY-LICENSES.md](../THIRD-PARTY-LICENSES.md).
Use `:ui` if you prefer not to distribute MinIO in your deployment.

### Selective providers

```bash
docker run -d -p 3000:80 -p 9000:9000 \
  -e ENABLED_PROVIDERS=s3 \
  -v storagepilot-data:/data \
  rinorbardiqi/storagepilot:full
```

Valid tokens: `gcs`, `s3`, `azure` (comma-separated). Default: all three.

The UI reads `/setup-manifest.json` at startup and only offers running providers during onboarding.

### Port requirements

| Providers enabled | Expose |
|-------------------|--------|
| Any (UI) | `3000:80` |
| Includes `s3` | `9000:9000` |

S3 uses AWS SigV4 against MinIO directly — it cannot be proxied through nginx on port 80 alone.

## Docker Compose

```bash
docker compose up -d
```

Uses `rinorbardiqi/storagepilot:full` by default. Data under `./data`.

## UI only (`:ui`)

When emulators already run elsewhere:

```bash
docker run -d -p 3000:80 \
  -e STORAGEPILOT_HOST=host.docker.internal \
  --add-host=host.docker.internal:host-gateway \
  rinorbardiqi/storagepilot:ui
```

| Provider | Port |
|----------|------|
| GCS | 4443 |
| S3 | 9000 |
| Azure | 10000 |

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENABLED_PROVIDERS` | No | `gcs,s3,azure` | Emulators to start (`:full` only) |
| `STORAGEPILOT_HOST` | No | *(compose network)* | Host for external emulators (`:ui`) |
| `MINIO_ROOT_USER` | No | `storagepilot` | MinIO root user |
| `MINIO_ROOT_PASSWORD` | No | `storagepilot` | MinIO root password |
| `PORT` | No | `3000` | Host UI port (compose) |

Advanced per-provider overrides: `GCS_URL`, `S3_URL`, `AZURE_URL`.

## Data persistence

`:full` image stores data under `/data` with subdirs `gcs`, `s3`, `azure` per enabled provider.

## Publishing

Tag a release (`v*`) to push:
- `:full` and `:vX.Y.Z-full` from the `full` Dockerfile target
- `:ui`, `:latest`, and `:vX.Y.Z` from the `ui` target

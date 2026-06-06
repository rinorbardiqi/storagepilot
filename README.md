# StoragePilot

Unified open-source web UI for local cloud storage emulators — **GCS** (fake-gcs-server), **S3** (MinIO), and **Azure** (Azurite).

One Docker pull. One origin. Zero CORS headaches.

## Quick start (Docker Hub)

**Image:** [`rinorbardiqi/storagepilot`](https://hub.docker.com/r/rinorbardiqi/storagepilot)

### Option A — All-in-one (`:full`, recommended)

UI plus bundled emulators in a single container. No compose file required.

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

Default MinIO credentials: `storagepilot` / `storagepilot`

#### Choose which providers to run

Set `ENABLED_PROVIDERS` when starting the container (comma-separated: `gcs`, `s3`, `azure`). Default is all three.

```bash
# S3 only
docker run -d --name storagepilot \
  -p 3000:80 -p 9000:9000 \
  -e ENABLED_PROVIDERS=s3 \
  -v storagepilot-data:/data \
  rinorbardiqi/storagepilot:full

# GCS + Azure (no port 9000 needed)
docker run -d --name storagepilot \
  -p 3000:80 \
  -e ENABLED_PROVIDERS=gcs,azure \
  -v storagepilot-data:/data \
  rinorbardiqi/storagepilot:full
```

| Combination | Ports to expose |
|-------------|-----------------|
| All providers | `3000:80`, `9000:9000` |
| Includes `s3` | `9000:9000` (SigV4 requires direct MinIO access) |
| `gcs` and/or `azure` only | `3000:80` |

Onboarding reads `/setup-manifest.json` and only offers providers running in your container.

### Option B — Docker Compose (full image)

```bash
git clone https://github.com/rinorbardiqi/storagepilot.git
cd storagepilot
docker compose up -d
```

Override examples:

```bash
# S3 only
docker compose -f docker-compose.yml -f docker-compose.s3-only.yml up -d

# GCS + Azure only
docker compose -f docker-compose.yml -f docker-compose.gcs-azure.yml up -d
```

Data persists under `./data` (subdirs `gcs`, `s3`, `azure` per enabled provider).

### Option C — UI only (`:ui`)

Use when emulators already run on your machine or another host.

```bash
docker pull rinorbardiqi/storagepilot:ui
docker run -d --name storagepilot \
  -p 3000:80 \
  -e STORAGEPILOT_HOST=host.docker.internal \
  --add-host=host.docker.internal:host-gateway \
  rinorbardiqi/storagepilot:ui
```

Or from the repo:

```bash
docker compose -f docker-compose.standalone.yml up -d
```

`STORAGEPILOT_HOST` is the hostname where emulators listen on the default ports:

| Provider | Port |
|----------|------|
| GCS (fake-gcs-server) | 4443 |
| S3 (MinIO) | 9000 |
| Azure (Azurite) | 10000 |

## Image tags

| Tag | Contents | When to use |
|-----|----------|-------------|
| **`full`** | UI + bundled emulators | Default for new users — one pull, everything works |
| **`ui`** | nginx + React SPA only | External emulators on host or compose network |
| **`latest`** | Same as `:ui` | Backward compatible with v0.1.0 |
| **`v0.2.0-full`** | Pinned bundled release | Production pin for all-in-one |
| **`v0.2.0`** | Pinned UI-only release | Production pin for standalone proxy |

## Docker Compose files

| File | What it runs |
|------|----------------|
| `docker-compose.yml` | All-in-one `:full` image (single service) |
| `docker-compose.s3-only.yml` | Override — S3 only |
| `docker-compose.gcs-azure.yml` | Override — GCS + Azure only |
| `docker-compose.standalone.yml` | UI-only `:ui` image |
| `docker-compose.stack.yml` | Multi-container stack for contributors |
| `docker-compose.dev.yml` | Vite hot-reload overlay (use with `stack.yml`) |

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGEPILOT_IMAGE` | `rinorbardiqi/storagepilot:full` | Image for main compose |
| `ENABLED_PROVIDERS` | `gcs,s3,azure` | Emulators to start (`:full` only) |
| `PORT` | `3000` | Host port mapped to the UI |
| `MINIO_USER` | `storagepilot` | MinIO root user |
| `MINIO_PASSWORD` | `storagepilot` | MinIO root password |
| `STORAGEPILOT_HOST` | *(standalone only)* | Host for external emulators |

Examples:

```bash
# Pinned full image
STORAGEPILOT_IMAGE=rinorbardiqi/storagepilot:v0.2.0-full docker compose up -d

# S3-only via compose
docker compose -f docker-compose.yml -f docker-compose.s3-only.yml up -d

# Standalone UI pointing at host emulators
STORAGEPILOT_HOST=host.docker.internal docker compose -f docker-compose.standalone.yml up -d
```

## First-time setup in the UI

1. Open the app and complete onboarding — providers match what you started in Docker.
2. Confirm each backend shows **Connected** in the sidebar.
3. Create a bucket, upload files, or generate mock data from **Developer Tools**.

## Common commands

```bash
# Pull and restart full stack
docker compose pull storagepilot && docker compose up -d storagepilot

# View logs
docker compose logs -f storagepilot

# Tear down
docker compose down
```

## Local development

```bash
# Separate emulator containers + Vite dev server
docker compose -f docker-compose.stack.yml -f docker-compose.dev.yml up

# Or emulators only + local Vite
docker compose -f docker-compose.stack.yml up fake-gcs minio azurite -d
cd app && pnpm install && pnpm run dev
```

Vite proxies `/api/gcs`, `/api/s3`, and `/api/azure` to the emulators (see `app/vite.config.ts`).

```bash
cd app && pnpm test
```

## Architecture

Browser → nginx (port 3000) → emulators (bundled in `:full` or external in `:ui`).

See [docs/architecture.md](docs/architecture.md) and [docs/self-hosting.md](docs/self-hosting.md).

## License

StoragePilot is [MIT licensed](LICENSE).

The **`:full`** image bundles third-party emulators with their own licenses — notably
**MinIO (AGPL-3.0)** when S3 is enabled. The **`:ui`** image is MIT + nginx only.
See [THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md).

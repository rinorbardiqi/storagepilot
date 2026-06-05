# StoragePilot

Unified open-source web UI for local cloud storage emulators — **GCS** (fake-gcs-server), **S3** (MinIO), and **Azure** (Azurite).

One Docker image. One origin. Zero CORS headaches.

## Quick start (Docker Hub)

The fastest way to run StoragePilot is to pull the pre-built image from Docker Hub — no build step required.

**Image:** [`rinorbardiqi/storagepilot`](https://hub.docker.com/r/rinorbardiqi/storagepilot)

```bash
docker pull rinorbardiqi/storagepilot:latest
```

### Option A — Full stack with Docker Compose (recommended)

Runs the UI plus all three emulators. Clone the repo for the compose file, then start everything:

```bash
git clone https://github.com/rinorbardiqi/storagepilot.git
cd storagepilot
docker compose up -d
```

Compose pulls `rinorbardiqi/storagepilot:latest` automatically — you do not need to build the image locally.

Open [http://localhost:3000](http://localhost:3000).

| Service | URL |
|---------|-----|
| StoragePilot UI | http://localhost:3000 |
| MinIO API | http://localhost:9000 |
| MinIO Console | http://localhost:9001 |
| fake-gcs-server | http://localhost:4443 |
| Azurite (blob) | http://localhost:10000 |

Default MinIO credentials: `storagepilot` / `storagepilot`

Data is persisted under `./data/gcs`, `./data/s3`, and `./data/azure`.

### Option B — UI only with Docker Compose

Use this when emulators are already running on your machine or another host.

From the repo:

```bash
docker compose -f docker-compose.standalone.yml up -d
```

Or with `docker run`:

```bash
docker run -d --name storagepilot \
  -p 3000:80 \
  -e STORAGEPILOT_HOST=host.docker.internal \
  --add-host=host.docker.internal:host-gateway \
  rinorbardiqi/storagepilot:latest
```

`STORAGEPILOT_HOST` is the hostname where your emulators listen on the default ports:

| Provider | Port |
|----------|------|
| GCS (fake-gcs-server) | 4443 |
| S3 (MinIO) | 9000 |
| Azure (Azurite) | 10000 |

Remote emulator host:

```bash
STORAGEPILOT_HOST=192.168.1.50 docker compose -f docker-compose.standalone.yml up -d
```

## Docker Compose

StoragePilot ships with three compose files. Pick the one that matches your setup.

| File | What it runs |
|------|----------------|
| `docker-compose.yml` | UI + GCS + S3 + Azure emulators (full stack) |
| `docker-compose.standalone.yml` | UI only — connects to emulators on your host |
| `docker-compose.dev.yml` | Overlay for hot-reload dev (use with the full stack file) |

### Use the repo compose files

**Full stack** — UI and all emulators together:

```bash
docker compose up -d
```

**UI only** — emulators already running elsewhere:

```bash
docker compose -f docker-compose.standalone.yml up -d
```

**Development** — emulators in Docker, Vite dev server with hot reload:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Open the dev UI at [http://localhost:5173](http://localhost:5173).

### Add StoragePilot to your own `docker-compose.yml`

Drop this service into an existing compose file. No build step — it pulls from Docker Hub.

**Full stack** (emulators in the same compose network — use the internal service names `fake-gcs`, `minio`, `azurite` as shown in the repo's `docker-compose.yml`):

```yaml
services:
  storagepilot:
    image: rinorbardiqi/storagepilot:latest
    ports:
      - "3000:80"
    restart: unless-stopped
    # Omit STORAGEPILOT_HOST — nginx auto-discovers emulator containers on the compose network.
```

**Standalone** (emulators on the Docker host or another machine):

```yaml
services:
  storagepilot:
    image: rinorbardiqi/storagepilot:latest
    ports:
      - "3000:80"
    environment:
      STORAGEPILOT_HOST: host.docker.internal   # or 192.168.1.50 for a remote host
    extra_hosts:
      - "host.docker.internal:host-gateway"     # Linux: lets the container reach the host
    restart: unless-stopped
```

**Pin a version:**

```yaml
services:
  storagepilot:
    image: rinorbardiqi/storagepilot:v0.1.0
    ports:
      - "3000:80"
```

### Compose environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGEPILOT_IMAGE` | `rinorbardiqi/storagepilot:latest` | Docker image to pull |
| `PORT` | `3000` | Host port mapped to the UI |
| `STORAGEPILOT_HOST` | *(not set)* | Host for external emulators (standalone only) |
| `MINIO_USER` | `storagepilot` | MinIO root user (full stack) |
| `MINIO_PASSWORD` | `storagepilot` | MinIO root password (full stack) |

Examples:

```bash
# Custom port and pinned image
PORT=8080 STORAGEPILOT_IMAGE=rinorbardiqi/storagepilot:v0.1.0 docker compose up -d

# Standalone pointing at host emulators
STORAGEPILOT_HOST=host.docker.internal docker compose -f docker-compose.standalone.yml up -d

# Pull latest image and recreate the UI container
docker compose pull storagepilot && docker compose up -d storagepilot
```

## First-time setup in the UI

1. Open the app and complete onboarding — pick one, two, or all providers.
2. Confirm each emulator shows **Connected** in the sidebar.
3. Create a bucket, upload files, or generate mock data from **Developer Tools**.

## Common commands

```bash
# Pull the latest image and restart
docker compose pull storagepilot
docker compose up -d storagepilot

# View UI logs
docker compose logs -f storagepilot

# Change the host port (default 3000)
PORT=8080 docker compose up -d

# Tear down
docker compose down
```

## Local development

For UI changes, run the React app against emulators in Docker:

```bash
# Start emulators only
docker compose up fake-gcs minio azurite -d

# Run the dev server
cd app
npm install
npm run dev
```

Vite proxies `/api/gcs`, `/api/s3`, and `/api/azure` to the emulators (see `app/vite.config.ts`).

```bash
# Run tests
cd app && npm test
```

## Architecture

Browser → nginx (port 3000) → emulators on the Docker network.

See [docs/architecture.md](docs/architecture.md) for the full system design and [docs/self-hosting.md](docs/self-hosting.md) for deployment options and environment variables.

## License

MIT — see [LICENSE](LICENSE).

# StoragePilot

Unified open-source web UI for local cloud storage emulators â€” **GCS** (fake-gcs-server), **S3** (MinIO), and **Azure** (Azurite).

One Docker image. One origin. Zero CORS headaches.

## Quick start

### Option A â€” Full stack (recommended)

Runs the UI plus all three emulators. No environment variables required.

```bash
git clone https://github.com/your-org/storagepilot.git
cd storagepilot
docker compose up
```

Open [http://localhost:3000](http://localhost:3000).

| Service | URL |
|---------|-----|
| StoragePilot UI | http://localhost:3000 |
| MinIO API | http://localhost:9000 |
| MinIO Console | http://localhost:9001 |
| fake-gcs-server | http://localhost:4443 |
| Azurite (blob) | http://localhost:10000 |

Default MinIO credentials: `storagepilot` / `storagepilot`

### Option B â€” UI only (Docker Hub)

Use this when emulators are already running on your machine.

```bash
docker run -d -p 3000:80 \
  -e STORAGEPILOT_HOST=host.docker.internal \
  --add-host=host.docker.internal:host-gateway \
  storagepilot/storagepilot:latest
```

Or with compose:

```bash
docker compose -f docker-compose.standalone.yml up
```

`STORAGEPILOT_HOST` points at the host where emulators listen (ports **4443**, **9000**, **10000**).

### Option C â€” Local development

```bash
# Start emulators
docker compose up fake-gcs minio azurite -d

# Run the React app
cd app
npm install
npm run dev
```

Vite proxies `/api/gcs`, `/api/s3`, and `/api/azure` to the emulators (see `app/vite.config.ts`).

## First-time setup in the UI

1. Open the app and complete onboarding â€” pick one, two, or all providers.
2. Confirm each emulator shows **Connected** in the sidebar.
3. Create a bucket, upload files, or generate mock data from **Developer Tools**.

## Common commands

```bash
# Rebuild UI image after code changes
docker compose build storagepilot
docker compose up -d storagepilot

# View UI logs
docker compose logs -f storagepilot

# Run tests
cd app && npm test

# Tear down
docker compose down
```

## Architecture

Browser â†’ nginx (port 3000) â†’ emulators on the Docker network.

See [docs/architecture.md](docs/architecture.md) for the full system design and [docs/self-hosting.md](docs/self-hosting.md) for deployment options.

## License

MIT â€” see [LICENSE](LICENSE).

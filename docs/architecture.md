# StoragePilot Architecture

## High-level system

```
┌─────────────────────────────────────────────────────────────┐
│                         User's Browser                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            StoragePilot React App (SPA)               │  │
│  │   UI Layer · State Mgmt · Provider Clients            │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP (single origin)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Nginx (StoragePilot container)                  │
│  Static React build + reverse proxy                          │
│  /api/gcs/* → fake-gcs-server                                │
│  /api/s3/*  → MinIO                                          │
│  /api/azure/* → Azurite                                      │
└──────┬────────────────┬────────────────┬────────────────────┘
       ▼                ▼                ▼
   fake-gcs:4443    minio:9000      azurite:10000
       │                │                │
       ▼                ▼                ▼
   ./data/gcs      ./data/s3       ./data/azure
```

**Key decision:** nginx reverse proxy means zero CORS issues and zero auth complexity. The browser only talks to one origin.

## Repository layout

| Path | Purpose |
|------|---------|
| `app/` | React + Vite + TypeScript frontend |
| `app/src/api/` | Provider abstraction and adapters |
| `app/src/store/` | Zustand stores |
| `app/src/hooks/` | Data-fetching and URL sync hooks |
| `app/src/features/` | UI by feature (`browser`, `layout`, `modals`, `detail`, `shared`, `views`) |
| `app/src/lib/` | Pure utilities shared across features |
| `app/tests/unit/` | Vitest unit tests, mirroring feature folders + `api/` |
| `app/tests/integration/` | Vitest against real emulators (`api/`) |
| `app/tests/e2e/` | Playwright specs |
| `docker-compose*.yml` | Full stack, standalone, dev overlay |
| `data/` | Emulator persistent volumes (gitignored) |

## Provider abstraction

All UI code uses the `StorageProvider` interface. Three implementations adapt GCS JSON REST, AWS S3 SDK, and Azure Blob SDK to a common shape. Every instance is wrapped with an instrumentation proxy for the activity log.

See [providers.md](providers.md) for endpoint mapping details.

## State management

Zustand stores with `persist` middleware for connection profiles, preferences, and activity log. URL state syncs via React Router (`/:provider/:bucket/*prefix`).

## Deployment

Two published images from [`app/Dockerfile`](../app/Dockerfile):

| Target | Tag | Size | Contents |
|--------|-----|------|----------|
| `ui` | `:ui`, `:latest` | ~18MB compressed | nginx + React SPA; proxies to external emulators |
| `full` | `:full` | ~135MB compressed (~340MB on disk) | UI + fake-gcs-server + MinIO + Azurite in one container |

### Bundled (`:full`) layout

```
┌─────────────────────────────────────────────────────────────┐
│              Single container (storagepilot:full)            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ nginx :80   │  │ fake-gcs     │  │ MinIO :9000      │  │
│  │ React SPA   │──│ 127.0.0.1    │  │ (browser direct) │  │
│  │ + proxy     │  │ :4443        │  └──────────────────┘  │
│  │ + manifest  │  └──────────────┘  ┌──────────────────┐  │
│  └─────────────┘                    │ Azurite          │  │
│                                     │ 127.0.0.1:10000  │  │
│                                     └──────────────────┘  │
│  /data/gcs · /data/s3 · /data/azure                        │
└─────────────────────────────────────────────────────────────┘
```

`ENABLED_PROVIDERS` (default `gcs,s3,azure`) controls which emulator processes start. The entrypoint writes `/setup-manifest.json` so onboarding only offers running providers.

S3 still talks directly to MinIO on port 9000 from the browser (SigV4 path signing). GCS and Azure are proxied through nginx on port 80.

### UI-only (`:ui`) layout

Nginx resolves upstreams via `STORAGEPILOT_HOST` (standalone) or Docker service names `fake-gcs`, `minio`, `azurite` (multi-container [`docker-compose.stack.yml`](../docker-compose.stack.yml)).

See [self-hosting.md](self-hosting.md) for deployment options.

## Testing pyramid

| Layer | Tool |
|-------|------|
| Unit | Vitest |
| Component | Vitest + Testing Library |
| Provider | Vitest + MSW |
| Integration | Vitest + testcontainers |
| E2E | Playwright |

## Build phases

- **Phase 0:** Scaffold, Docker, provider interface, GCS adapter, shell UI
- **Phase 1:** Bucket list, object table, upload/download/delete, activity log
- **Phase 2:** S3 + Azure adapters, connection profiles, provider switching
- **Phase 3+:** Power-user features, previews, command palette, polish, CI/CD publish

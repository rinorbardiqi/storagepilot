# Provider reference

StoragePilot supports three local emulators through a unified `StorageProvider` interface.

## GCS — fake-gcs-server

- **Adapter:** raw `fetch` against GCS JSON REST API
- **Proxy path:** `/api/gcs/*`
- **Auth:** none (emulator)
- **Quirks:** use `-scheme http`; object keys with `/` are literal prefixes

## S3 — MinIO

- **Adapter:** `@aws-sdk/client-s3` (browser build)
- **Proxy path:** `/api/s3/*`
- **Credentials:** `storagepilot` / `storagepilot` (default in docker-compose)
- **Quirks:** `forcePathStyle: true` required

## Azure — Azurite

- **Adapter:** `@azure/storage-blob`
- **Proxy path:** `/api/azure/*`
- **Account:** `devstoreaccount1` with default Azurite key
- **Quirks:** XML responses; container names lowercase only; CORS editor unsupported

## Error normalisation

All providers throw `StorageError` with codes: `NOT_FOUND`, `FORBIDDEN`, `CONFLICT`, `CONNECTION_FAILED`, `UNKNOWN`.

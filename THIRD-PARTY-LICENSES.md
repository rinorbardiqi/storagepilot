# Third-party licenses

StoragePilot application code is [MIT licensed](LICENSE).

The **`rinorbardiqi/storagepilot:full`** Docker image bundles additional third-party
programs. Those components retain their own licenses. The **`rinorbardiqi/storagepilot:ui`**
image contains only StoragePilot (MIT) and nginx (BSD-2-Clause).

## MinIO (bundled in `:full` when S3 is enabled)

- **Component:** MinIO Object Storage Server
- **License:** [GNU Affero General Public License v3.0 (AGPL-3.0)](https://www.gnu.org/licenses/agpl-3.0.html)
- **Copyright:** MinIO, Inc.
- **Source:** https://github.com/minio/minio
- **Notes:** The `:full` image includes an **unmodified** MinIO binary. AGPL-3.0
  applies to MinIO when distributed as part of this image. StoragePilot
  application code remains MIT-licensed. To avoid distributing MinIO, use
  `rinorbardiqi/storagepilot:ui` and run your own S3-compatible emulator.

## fake-gcs-server (bundled in `:full` when GCS is enabled)

- **Component:** fake-gcs-server
- **License:** [BSD 3-Clause License](https://opensource.org/licenses/BSD-3-Clause)
- **Source:** https://github.com/fsouza/fake-gcs-server

## Azurite (bundled in `:full` when Azure is enabled)

- **Component:** Azurite (Azure Storage emulator)
- **License:** [MIT License](https://opensource.org/licenses/MIT)
- **Copyright:** Microsoft Corporation
- **Source:** https://github.com/Azure/Azurite

## nginx (both `:ui` and `:full` images)

- **Component:** nginx (alpine-slim base image)
- **License:** [BSD 2-Clause License](https://opensource.org/licenses/BSD-2-Clause)
- **Source:** https://nginx.org/

## MinIO Client (`mc`, bundled in `:full` for CORS setup)

- **Component:** MinIO Client
- **License:** [GNU Affero General Public License v3.0 (AGPL-3.0)](https://www.gnu.org/licenses/agpl-3.0.html)
- **Source:** https://github.com/minio/mc

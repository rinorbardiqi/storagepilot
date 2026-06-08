export const SITE_NAME = 'StoragePilot';
export const SITE_TAGLINE = 'Local Cloud Storage Browser';
export const SITE_DESCRIPTION =
  'Unified open-source web UI for local GCS, S3, and Azure storage emulators. One Docker pull, zero CORS headaches.';

/** Landing-only deploy: no live app routes, CTAs point to self-host instructions. */
export const IS_MARKETING_SITE = import.meta.env.VITE_SITE_MODE === 'marketing';

export const GITHUB_REPO_URL = 'https://github.com/rinorbardiqi/storagepilot';
export const DOCKER_HUB_URL = 'https://hub.docker.com/r/rinorbardiqi/storagepilot';
export const DOCKER_IMAGE = 'rinorbardiqi/storagepilot:full';

/** Compressed size on Docker Hub (amd64, post–v0.2.0 slim build). */
export const DOCKER_IMAGE_FULL_COMPRESSED = '~135 MB';
/** Approximate size after `docker pull` (Docker Desktop reported size). */
export const DOCKER_IMAGE_FULL_PULLED = '~340 MB';
export const DOCKER_IMAGE_UI_COMPRESSED = '~18 MB';

export const DOCKER_RUN_SNIPPET = `docker run -d \\
  --name storagepilot \\
  -p 3000:80 -p 9000:9000 \\
  -v storagepilot-data:/data \\
  ${DOCKER_IMAGE}`;

declare const __APP_VERSION__: string;
declare const __GIT_BRANCH__: string;
declare const __EMULATOR_GCS_VERSION__: string;
declare const __EMULATOR_S3_VERSION__: string;
declare const __EMULATOR_AZURE_VERSION__: string;
declare const __DOCKER_MODE__: string;

export const APP_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

export const GIT_BRANCH =
  typeof __GIT_BRANCH__ !== 'undefined' ? __GIT_BRANCH__ : 'dev';

export const EMULATOR_VERSIONS = {
  gcs:
    typeof __EMULATOR_GCS_VERSION__ !== 'undefined'
      ? __EMULATOR_GCS_VERSION__
      : '1.54.0',
  s3:
    typeof __EMULATOR_S3_VERSION__ !== 'undefined'
      ? __EMULATOR_S3_VERSION__
      : 'RELEASE.2026-04-17T00-00-00Z',
  azure:
    typeof __EMULATOR_AZURE_VERSION__ !== 'undefined'
      ? __EMULATOR_AZURE_VERSION__
      : '3.35.0',
} as const;

/** 'stack' = bundled emulators in Docker image; 'standalone' = UI proxy only; 'dev' = Vite dev server */
export const DOCKER_MODE =
  typeof __DOCKER_MODE__ !== 'undefined' ? __DOCKER_MODE__ : 'dev';

export function apiVersionLabel(): string {
  return `API v${APP_VERSION}`;
}

export interface DiagnosticsInput {
  enabledProviders: string[];
  profiles: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    error?: string;
  }>;
  activeProfileId: string | null;
}

export function buildDiagnosticsPayload(input: DiagnosticsInput): Record<string, unknown> {
  return {
    appVersion: APP_VERSION,
    gitBranch: GIT_BRANCH,
    dockerMode: DOCKER_MODE,
    emulatorVersions: EMULATOR_VERSIONS,
    enabledProviders: input.enabledProviders,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    profiles: input.profiles,
    activeProfileId: input.activeProfileId,
    timestamp: new Date().toISOString(),
  };
}

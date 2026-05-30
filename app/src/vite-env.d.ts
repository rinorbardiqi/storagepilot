/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GCS_BASE?: string;
  readonly VITE_S3_BASE?: string;
  readonly VITE_AZURE_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
declare const __GIT_BRANCH__: string;

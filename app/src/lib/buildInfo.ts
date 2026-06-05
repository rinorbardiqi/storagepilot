declare const __APP_VERSION__: string;
declare const __GIT_BRANCH__: string;

export const APP_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

export const GIT_BRANCH =
  typeof __GIT_BRANCH__ !== 'undefined' ? __GIT_BRANCH__ : 'dev';

export function apiVersionLabel(): string {
  return `API v${APP_VERSION}`;
}

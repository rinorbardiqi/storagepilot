/** Build Azure blob query strings with %20 encoding (not +) for SharedKey compatibility. */

export function buildAzureQueryString(params: Record<string, string | undefined>): string {
  return Object.entries(params)
    .filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

export function appendAzureQuery(baseUrl: string, params: Record<string, string | undefined>): string {
  const qs = buildAzureQueryString(params);
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}

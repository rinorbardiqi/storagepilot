export declare class UrlFetchError extends Error {
  status: number;
  constructor(status: number, message: string);
}

export declare function isPrivateAddress(address: string): boolean;

export declare function fetchRemoteUrl(
  target: string,
): Promise<{ contentType: string; body: Buffer }>;

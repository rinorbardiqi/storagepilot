import type { ProviderType } from './types';

export interface ActivityLogEntry {
  id: string;
  method: string;
  provider: ProviderType;
  args: unknown[];
  timestamp: Date;
  status: 'pending' | 'success' | 'error';
  duration: number;
  error?: string;
  httpStatus?: number;
}

/** Minimal logger interface injected into the instrumentation wrapper. */
export interface ActivityLogger {
  addEntry(entry: ActivityLogEntry): void;
  updateEntry(id: string, updates: Partial<ActivityLogEntry>): void;
}

/** No-op logger for environments where activity logging is not needed. */
export const nullLogger: ActivityLogger = {
  addEntry: () => undefined,
  updateEntry: () => undefined,
};

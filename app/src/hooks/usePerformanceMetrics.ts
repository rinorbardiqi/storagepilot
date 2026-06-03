import { useMemo } from 'react';
import { extractBucketFromEntry } from '../lib/activityBucket';
import type { ActivityEntry } from '../store/activityStore';
import { useActivityStore } from '../store/activityStore';

export type OperationKind = 'GET' | 'PUT' | 'LIST' | 'DELETE' | 'OTHER';

const METHOD_KIND: Record<string, OperationKind> = {
  getObject: 'GET',
  getObjectMetadata: 'GET',
  getObjectUrl: 'GET',
  uploadObject: 'PUT',
  createBucket: 'PUT',
  setCorsRules: 'PUT',
  updateMetadata: 'PUT',
  copyObject: 'PUT',
  moveObject: 'PUT',
  listObjects: 'LIST',
  listBuckets: 'LIST',
  listVersions: 'LIST',
  getCorsRules: 'LIST',
  getBucketStats: 'LIST',
  deleteObject: 'DELETE',
  deleteBucket: 'DELETE',
  deleteVersion: 'DELETE',
};

export function classifyOperation(method: string): OperationKind {
  return METHOD_KIND[method] ?? 'OTHER';
}

function entriesInWindow(entries: ActivityEntry[], startMs: number, endMs: number) {
  return entries.filter((e) => {
    const t = e.timestamp.getTime();
    return t >= startMs && t < endMs;
  });
}

function filterByBucket(entries: ActivityEntry[], bucket: string | null) {
  if (!bucket) return entries;
  return entries.filter((e) => extractBucketFromEntry(e) === bucket);
}

export function usePerformanceMetrics(liveWindowMs = 60_000, bucketFilter: string | null = null) {
  const entries = useActivityStore((s) => s.entries);

  return useMemo(() => {
    const scoped = filterByBucket(entries, bucketFilter);
    const now = Date.now();
    const recent = entriesInWindow(scoped, now - liveWindowMs, now);
    const prior = entriesInWindow(scoped, now - liveWindowMs * 2, now - liveWindowMs);

    const completed = recent.filter((e) => e.status !== 'pending');
    const priorCompleted = prior.filter((e) => e.status !== 'pending');
    const successes = completed.filter((e) => e.status === 'success');
    const errors = completed.filter((e) => e.status === 'error');

    const requestsPerSec = recent.length / (liveWindowMs / 1000);
    const priorRps = prior.length / (liveWindowMs / 1000);

    const avgLatency =
      completed.length > 0
        ? completed.reduce((sum, e) => sum + e.duration, 0) / completed.length
        : 0;
    const priorAvgLatency =
      priorCompleted.length > 0
        ? priorCompleted.reduce((sum, e) => sum + e.duration, 0) / priorCompleted.length
        : 0;

    const errorRate = completed.length > 0 ? (errors.length / completed.length) * 100 : 0;

    const activeStreams = recent.filter((e) => e.status === 'pending').length;

    const rpsTrend =
      priorRps > 0
        ? Math.round(((requestsPerSec - priorRps) / priorRps) * 100)
        : requestsPerSec > 0
          ? 100
          : 0;
    const latencyTrend = Math.round(avgLatency - priorAvgLatency);

    const distribution: Record<OperationKind, number> = {
      GET: 0,
      PUT: 0,
      LIST: 0,
      DELETE: 0,
      OTHER: 0,
    };
    for (const e of completed) {
      distribution[classifyOperation(e.method)]++;
    }
    const distributionTotal = Object.values(distribution).reduce((a, b) => a + b, 0);

    const bucketCount = 50;
    const bucketMs = liveWindowMs / bucketCount;
    const timeline: number[] = [];
    for (let i = 0; i < bucketCount; i++) {
      const start = now - liveWindowMs + i * bucketMs;
      const end = start + bucketMs;
      timeline.push(entriesInWindow(scoped, start, end).length);
    }

    const peakRequestsPerSec = timeline.length
      ? Math.max(...timeline) / (bucketMs / 1000)
      : 0;

    const bucketsInLog = [
      ...new Set(entries.map(extractBucketFromEntry).filter((b): b is string => Boolean(b))),
    ].sort();

    return {
      requestsPerSec,
      avgLatency,
      errorRate,
      activeStreams,
      rpsTrend,
      latencyTrend,
      distribution,
      distributionTotal,
      timeline,
      totalRequests: recent.length,
      successCount: successes.length,
      errorCount: errors.length,
      peakRequestsPerSec,
      bucketsInLog,
      hasData: scoped.length > 0,
    };
  }, [entries, liveWindowMs, bucketFilter]);
}

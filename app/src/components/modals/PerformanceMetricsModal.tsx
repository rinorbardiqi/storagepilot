import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { Activity, X } from 'lucide-react';
import { useBuckets } from '../../hooks/useBuckets';
import { usePerformanceMetrics, type OperationKind } from '../../hooks/usePerformanceMetrics';
import { useAppStore } from '../../store/appStore';
import { profileEndpoint } from '../../lib/providerAccent';
import { isDefaultProfileId } from '../../lib/reconcileProfiles';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';

type TimeRange = 'live' | '1h' | '24h';

const RANGE_MS: Record<TimeRange, number> = {
  live: 60_000,
  '1h': 3_600_000,
  '24h': 86_400_000,
};

const RANGE_LABEL: Record<TimeRange, string> = {
  live: 'last 60s',
  '1h': 'last hour',
  '24h': 'last 24h',
};

const DIST_COLORS: Record<OperationKind, string> = {
  GET: 'var(--accent)',
  PUT: 'var(--success)',
  LIST: 'var(--warning)',
  DELETE: 'var(--error)',
  OTHER: 'var(--text-muted)',
};

function niceCeil(value: number): number {
  if (value <= 2) return 2;
  if (value <= 5) return 5;
  if (value <= 10) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  if (normalized <= 1) return magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

function windowAxisSeconds(range: TimeRange): number {
  if (range === 'live') return 60;
  if (range === '1h') return 60;
  return 24;
}

function windowAxisUnit(range: TimeRange): string {
  if (range === 'live') return 's';
  if (range === '1h') return 'm';
  return 'h';
}

function formatChartTime(index: number, pointCount: number, range: TimeRange): string {
  const pct = index / Math.max(pointCount - 1, 1);
  const axisMax = windowAxisSeconds(range);
  const unit = windowAxisUnit(range);
  const value = Math.round(axisMax * pct);
  return `${value}${unit}`;
}

function svgPointFromClient(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  return pt.matrixTransform(matrix.inverse());
}

function clientPointFromSvg(svg: SVGSVGElement, x: number, y: number) {
  const pt = svg.createSVGPoint();
  pt.x = x;
  pt.y = y;
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  return pt.matrixTransform(matrix);
}

function LineChart({
  points,
  range,
  totalRequests,
}: {
  points: number[];
  range: TimeRange;
  totalRequests: number;
}) {
  const chartWrapRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null);

  const w = 560;
  const h = 200;
  const pad = { top: 16, right: 16, bottom: 32, left: 40 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;

  const yMax = niceCeil(Math.max(...points, 1));
  const axisMax = windowAxisSeconds(range);
  const axisUnit = windowAxisUnit(range);

  const coords = points.map((p, i) => {
    const x = pad.left + (i / Math.max(points.length - 1, 1)) * innerW;
    const y = pad.top + innerH - (p / yMax) * innerH;
    return { x, y, value: p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${(pad.left + innerW).toFixed(1)},${pad.top + innerH} L ${pad.left},${pad.top + innerH} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    pct,
    value: Math.round(yMax * pct),
    y: pad.top + innerH - pct * innerH,
  }));

  const xTickCount = range === '24h' ? 5 : 7;
  const xTicks = Array.from({ length: xTickCount }, (_, i) => {
    const pct = i / (xTickCount - 1);
    return {
      pct,
      label: String(Math.round(axisMax * pct)),
      x: pad.left + pct * innerW,
    };
  });

  const handleMouseMove = (event: MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const wrap = chartWrapRef.current;
    const svgPt = svgPointFromClient(svg, event.clientX, event.clientY);
    if (!svgPt || !wrap) {
      setHoverIndex(null);
      setTooltipPos(null);
      return;
    }

    const relX = svgPt.x;
    if (relX < pad.left || relX > pad.left + innerW) {
      setHoverIndex(null);
      setTooltipPos(null);
      return;
    }

    const idx = Math.round(((relX - pad.left) / innerW) * (points.length - 1));
    const clamped = Math.max(0, Math.min(points.length - 1, idx));
    setHoverIndex(clamped);

    const point = coords[clamped];
    const screen = clientPointFromSvg(svg, point.x, point.y);
    if (!screen) {
      setTooltipPos(null);
      return;
    }
    const wrapRect = wrap.getBoundingClientRect();
    setTooltipPos({
      left: screen.x - wrapRect.left,
      top: screen.y - wrapRect.top,
    });
  };

  const clearHover = () => {
    setHoverIndex(null);
    setTooltipPos(null);
  };

  const hover = hoverIndex !== null ? coords[hoverIndex] : null;
  const hoverRequests = hoverIndex !== null ? points[hoverIndex] : 0;

  return (
    <div className="border border-[var(--border)] bg-[var(--bg-base)] p-4">
      <div className="flex items-center justify-between mb-3 gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Activity over window
        </p>
        <p className="text-[10px] font-mono text-[var(--text-muted)]">
          <span className="text-[var(--text-primary)] font-semibold">{totalRequests}</span> total requests
        </p>
      </div>
      <div className="relative" ref={chartWrapRef}>
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-[200px] cursor-crosshair block"
          role="img"
          aria-label="Requests over time"
          onMouseMove={handleMouseMove}
          onMouseLeave={clearHover}
        >
          <defs>
            <linearGradient id="perf-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {yTicks.map(({ pct, value, y }) => (
            <g key={`y-${pct}`}>
              <line
                x1={pad.left}
                y1={y}
                x2={pad.left + innerW}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
                opacity={pct === 0 ? 1 : 0.65}
              />
              <text
                x={pad.left - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-[var(--text-muted)]"
                style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }}
              >
                {value}
              </text>
            </g>
          ))}

          {xTicks.map(({ pct, label, x }) => (
            <g key={`x-${pct}`}>
              <line
                x1={x}
                y1={pad.top}
                x2={x}
                y2={pad.top + innerH}
                stroke="var(--border)"
                strokeWidth="1"
                opacity="0.35"
              />
              <text
                x={x}
                y={h - 10}
                textAnchor="middle"
                className="fill-[var(--text-muted)]"
                style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }}
              >
                {label}
              </text>
            </g>
          ))}

          <text
            x={pad.left + innerW / 2}
            y={h - 2}
            textAnchor="middle"
            className="fill-[var(--text-muted)]"
            style={{ fontSize: 8, fontFamily: 'var(--font-mono)' }}
          >
            Time ({axisUnit})
          </text>

          <rect
            x={pad.left}
            y={pad.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            pointerEvents="all"
          />

          <path d={areaPath} fill="url(#perf-area-fill)" pointerEvents="none" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            pointerEvents="none"
          />

          {hover && hoverIndex !== null && (
            <g pointerEvents="none">
              <line
                x1={hover.x}
                y1={pad.top}
                x2={hover.x}
                y2={pad.top + innerH}
                stroke="var(--accent)"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.7"
              />
              <circle cx={hover.x} cy={hover.y} r="4" fill="var(--accent)" stroke="var(--bg-base)" strokeWidth="2" />
            </g>
          )}
        </svg>

        {hover && hoverIndex !== null && tooltipPos && (
          <div
            className="pointer-events-none absolute z-10 px-2.5 py-1.5 border border-[var(--border)] bg-[var(--bg-surface)] shadow-lg text-[10px] font-mono whitespace-nowrap"
            style={{
              left: tooltipPos.left,
              top: tooltipPos.top,
              transform: 'translate(-50%, calc(-100% - 10px))',
            }}
          >
            <p className="text-[var(--text-muted)]">
              t = {formatChartTime(hoverIndex, points.length, range)}
            </p>
            <p className="text-[var(--text-primary)] font-semibold">
              {hoverRequests} request{hoverRequests === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DonutChart({ distribution, total }: { distribution: Record<OperationKind, number>; total: number }) {
  const kinds: OperationKind[] = ['GET', 'PUT', 'LIST', 'DELETE'];
  const r = 40;
  const cx = 50;
  const cy = 50;
  let offset = 0;

  if (total === 0) {
    return (
      <svg viewBox="0 0 100 100" className="size-28 mx-auto">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="12" />
      </svg>
    );
  }

  const segments = kinds.map((kind) => {
    const value = distribution[kind];
    const pct = value / total;
    const dash = pct * 2 * Math.PI * r;
    const gap = 2 * Math.PI * r - dash;
    const rotation = offset;
    offset += pct * 360;
    return { kind, dash, gap, rotation };
  });

  return (
    <svg viewBox="0 0 100 100" className="size-28 mx-auto">
      {segments.map(({ kind, dash, gap, rotation }) => (
        <circle
          key={kind}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={DIST_COLORS[kind]}
          strokeWidth="12"
          strokeDasharray={`${dash} ${gap}`}
          transform={`rotate(${rotation - 90} ${cx} ${cy})`}
        />
      ))}
    </svg>
  );
}

export function PerformanceMetricsModal() {
  const isOpen = useModalStore((s) => Boolean(s.active.performanceMetrics));
  const closeModal = useModalStore((s) => s.closeModal);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const { buckets } = useBuckets();
  const [range, setRange] = useState<TimeRange>('live');
  const [bucketFilter, setBucketFilter] = useState<string | null>(null);

  const metrics = usePerformanceMetrics(RANGE_MS[range], bucketFilter);

  const profiles = useConnectionStore((s) => s.profiles);
  const connectionStatus = useConnectionStore((s) => s.connectionStatus);
  const testConnection = useConnectionStore((s) => s.testConnection);

  const emulators = profiles.filter((p) => isDefaultProfileId(p.id));

  const bucketOptions = useMemo(() => {
    const names = new Set<string>();
    for (const b of buckets) names.add(b.name);
    for (const b of metrics.bucketsInLog) names.add(b);
    if (currentBucket) names.add(currentBucket);
    return [...names].sort();
  }, [buckets, metrics.bucketsInLog, currentBucket]);

  useEffect(() => {
    if (!isOpen) return;
    const status = useConnectionStore.getState().connectionStatus;
    for (const id of ['default-gcs', 'default-s3', 'default-azure'] as const) {
      if (status[id] === 'connected' || status[id] === 'checking') continue;
      void testConnection(id);
    }
  }, [isOpen, testConnection]);

  useEffect(() => {
    if (!isOpen) return;
    setBucketFilter(currentBucket ?? null);
  }, [isOpen, currentBucket]);

  if (!isOpen) return null;

  const kinds: OperationKind[] = ['GET', 'PUT', 'LIST', 'DELETE'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70">
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl"
        role="dialog"
        aria-labelledby="perf-metrics-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-surface)] z-10 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Activity size={18} className="text-[var(--accent)] shrink-0" />
            <h2
              id="perf-metrics-title"
              className="text-xs font-bold uppercase tracking-[1.2px] text-[var(--text-primary)] truncate"
            >
              Real-Time Performance Metrics
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(['live', '1h', '24h'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                  range === r
                    ? 'bg-[var(--accent)] text-[var(--bg-base)] border-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {r === 'live' ? 'Live' : r}
              </button>
            ))}
            <button
              type="button"
              onClick={() => closeModal('performanceMetrics')}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] ml-2"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">
                Filter by bucket
              </label>
              <select
                value={bucketFilter ?? ''}
                onChange={(e) => setBucketFilter(e.target.value || null)}
                className="w-full h-9 px-3 font-mono text-xs bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)]"
              >
                <option value="">All buckets</option>
                {bucketOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[10px] font-mono text-[var(--text-muted)] sm:pb-2">
              Window: {RANGE_LABEL[range]}
              {bucketFilter ? ` · ${bucketFilter}` : ' · all buckets'}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard
              label="Requests / sec"
              value={metrics.hasData ? metrics.requestsPerSec.toFixed(1) : '—'}
              trend={
                metrics.hasData
                  ? `${metrics.rpsTrend >= 0 ? '+' : ''}${metrics.rpsTrend}%`
                  : undefined
              }
              trendUp={metrics.rpsTrend >= 0}
            />
            <KpiCard
              label="Avg. Latency"
              value={metrics.hasData ? `${Math.round(metrics.avgLatency)}ms` : '—'}
              sub={metrics.hasData ? `peak ${metrics.peakRequestsPerSec.toFixed(1)} req/s` : undefined}
              trend={
                metrics.hasData && metrics.latencyTrend !== 0
                  ? `${metrics.latencyTrend > 0 ? '+' : ''}${metrics.latencyTrend}ms`
                  : undefined
              }
              trendUp={metrics.latencyTrend <= 0}
            />
            <KpiCard
              label="Error Rate"
              value={metrics.hasData ? `${metrics.errorRate.toFixed(2)}%` : '—'}
              sub={
                metrics.hasData
                  ? `${metrics.errorCount} err · ${metrics.successCount} ok`
                  : undefined
              }
              danger
            />
            <KpiCard
              label="Total Requests"
              value={metrics.hasData ? String(metrics.totalRequests) : '—'}
              sub={
                metrics.hasData
                  ? `${RANGE_LABEL[range]}${bucketFilter ? ` · ${bucketFilter}` : ''}`
                  : undefined
              }
              accent
            />
            <KpiCard
              label="Active Streams"
              value={metrics.hasData ? String(metrics.activeStreams) : '—'}
              sub={metrics.hasData ? `${metrics.distributionTotal} completed ops` : undefined}
            />
          </div>

          {!metrics.hasData ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">
              No API activity{bucketFilter ? ` for "${bucketFilter}"` : ''} in this window. Browse, upload, or
              generate fake data to populate metrics.
            </p>
          ) : (
            <LineChart points={metrics.timeline} range={range} totalRequests={metrics.totalRequests} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">
                Operation Distribution
              </p>
              <DonutChart distribution={metrics.distribution} total={metrics.distributionTotal} />
              <div className="flex flex-wrap justify-center gap-4 mt-4 text-[10px] font-mono">
                {kinds.map((kind) => {
                  const count = metrics.distribution[kind];
                  const pct =
                    metrics.distributionTotal > 0
                      ? Math.round((count / metrics.distributionTotal) * 100)
                      : 0;
                  return (
                    <span key={kind} className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: DIST_COLORS[kind] }} />
                      {kind} {pct}% ({count})
                    </span>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">
                Emulator Health
              </p>
              <ul className="flex flex-col gap-2">
                {emulators.map((p) => {
                  const status = connectionStatus[p.id] ?? 'unconfigured';
                  const healthy = status === 'connected';
                  const endpoint = profileEndpoint(p);
                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between p-3 border border-[var(--border)] bg-[var(--bg-base)] text-xs"
                    >
                      <span className="font-mono text-[var(--text-primary)]">
                        {p.name}{' '}
                        <span className="text-[var(--text-muted)]">({endpoint})</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          healthy ? 'text-[var(--success)]' : 'text-[var(--error)]'
                        }`}
                      >
                        {status === 'checking'
                          ? 'Checking…'
                          : healthy
                            ? 'Healthy'
                            : 'Unavailable'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  trend,
  trendUp,
  accent,
  danger,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="p-4 border border-[var(--border)] bg-[var(--bg-base)]">
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-2">{label}</p>
      <p
        className={`text-2xl font-semibold font-mono ${
          danger ? 'text-[var(--error)]' : accent ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] mt-1 font-mono text-[var(--text-muted)]">{sub}</p>}
      {trend && (
        <p
          className={`text-[10px] mt-0.5 font-mono ${
            trendUp ? 'text-[var(--success)]' : 'text-[var(--error)]'
          }`}
        >
          {trend}
        </p>
      )}
    </div>
  );
}

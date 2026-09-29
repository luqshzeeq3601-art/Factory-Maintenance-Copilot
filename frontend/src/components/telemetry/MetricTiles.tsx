import type { Sample } from "../../api/models";
import { formatNumber } from "../../lib/format";
import { ErrorState } from "../ui/States";
import { METRICS, byMetric } from "./metrics";

interface MetricTilesProps {
  samples: Sample[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  windowLabel: string;
}

/** Latest reading per sensor with a sparkline of the window. One hue: the tile title names the series. */
export function MetricTiles({ samples, isLoading, error, onRetry, windowLabel }: MetricTilesProps) {
  if (error && !samples) return <ErrorState compact title="Sensor readings didn't load" message={error.message} onRetry={onRetry} />;
  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {METRICS.map((m) => (
          <div key={m.id} className="skeleton h-[112px]" />
        ))}
      </div>
    );
  }
  const groups = byMetric(samples);
  return (
    <ul className="grid gap-3 grid-cols-2 xl:grid-cols-4">
      {METRICS.map((m) => {
        const series = groups[m.id];
        const latest = series[series.length - 1];
        return (
          <li key={m.id} className="rounded-[var(--radius-card)] border border-line bg-panel p-4 min-w-0">
            <p className="flex items-center gap-2 text-meta font-medium text-body">
              <m.icon className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
              {m.label}
            </p>
            <p className="mt-1.5 font-data text-[22px] leading-8 font-semibold text-ink">
              {latest ? formatNumber(latest.value, m.digits) : "—"}
              <span className="ml-1 text-small font-medium text-body">{m.unit}</span>
            </p>
            <Sparkline values={series.map((s) => s.value)} label={`${m.label}, ${windowLabel.toLowerCase()}`} />
          </li>
        );
      })}
    </ul>
  );
}

export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const w = 160;
  const h = 32;
  if (values.length < 2) return <div className="h-8" />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = w / (values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-2 w-full h-8" role="img" aria-label={`${label}: range ${formatNumber(min, 2)} to ${formatNumber(max, 2)}`}>
      <polyline points={points} fill="none" stroke="var(--color-accent)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

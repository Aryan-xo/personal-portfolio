"use client";
import type { Stats } from "@/app/api/stats/route";

/** Ring colours: shades of the theme's foreground, distinguished by opacity. */
const RING = [1, 0.78, 0.6, 0.45, 0.33, 0.24];

function Donut({ data }: { data: [string, number][] }) {
  const total = data.reduce((a, [, n]) => a + n, 0) || 1;
  const r = 34;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="chart-donut">
      <svg viewBox="0 0 90 90" width="90" height="90" role="img" aria-label="languages by repo count">
        {data.map(([name, n], i) => {
          const len = (n / total) * circ;
          const el = (
            <circle
              key={name}
              cx="45"
              cy="45"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeOpacity={RING[i % RING.length]}
              strokeWidth="14"
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 45 45)"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <ul className="chart-legend">
        {data.map(([name, n], i) => (
          <li key={name}>
            <span className="chart-swatch" style={{ opacity: RING[i % RING.length] }} />
            <span className="chart-name">{name}</span>
            <span className="dim">{Math.round((n / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bars({ data }: { data: [string, number][] }) {
  const max = Math.max(...data.map(([, n]) => n), 1);
  return (
    <ul className="chart-bars">
      {data.map(([name, n]) => (
        <li key={name}>
          <span className="chart-name">{name}</span>
          <span className="chart-track">
            <span className="chart-fill" style={{ width: `${(n / max) * 100}%` }} />
          </span>
          <span className="dim">{n}</span>
        </li>
      ))}
    </ul>
  );
}

/** Last 12 weeks of contributions, as a sparkline. */
function Spark({ days }: { days: [string, number][] }) {
  const weeks: number[] = [];
  for (let i = Math.max(0, days.length - 84); i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7).reduce((a, [, n]) => a + n, 0));
  }
  const max = Math.max(...weeks, 1);
  const w = 100;
  const h = 26;
  const pts = weeks
    .map((n, i) => `${(i / Math.max(1, weeks.length - 1)) * w},${h - (n / max) * h}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart-spark" preserveAspectRatio="none" role="img" aria-label="recent activity">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill="currentColor" fillOpacity=".12" stroke="none" />
    </svg>
  );
}

export default function SideCharts({ stats }: { stats: Stats | null | undefined }) {
  if (stats === undefined) return <p className="side-note dim">loading live stats…</p>;
  if (!stats) return null;

  const langs = (stats.github?.languages ?? []) as [string, number][];
  const levels = (stats.leetcode?.byLevel ?? []) as [string, number][];

  return (
    <>
      {langs.length > 0 && (
        <>
          <p className="side-label dim">languages</p>
          <Donut data={langs.slice(0, 6)} />
        </>
      )}

      {levels.length > 0 && (
        <>
          <p className="side-label dim">leetcode · {stats.leetcode!.total} solved</p>
          <Bars data={levels} />
        </>
      )}

      {stats.contrib && stats.contrib.days.length > 0 && (
        <>
          <p className="side-label dim">
            activity · {stats.contrib.total} contribution{stats.contrib.total === 1 ? "" : "s"}
          </p>
          <Spark days={stats.contrib.days} />
        </>
      )}
    </>
  );
}

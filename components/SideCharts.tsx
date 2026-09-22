"use client";
import type { Stats } from "@/app/api/stats/route";

/** Ring colours: shades of the theme's foreground, distinguished by opacity. */
const RING = [1, 0.78, 0.6, 0.45, 0.33, 0.24];

function Donut({ data, unit = "" }: { data: [string, number][]; unit?: string }) {
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
            <span className="dim">{unit === "%" ? n : Math.round((n / total) * 100)}%</span>
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

/** A compact contribution grid, sized to the sidebar. */
function Grid({ days }: { days: [string, number][] }) {
  const lead = new Date(days[0][0] + "T00:00:00Z").getUTCDay();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...days.map(([, n]) => n)];
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const max = Math.max(...days.map(([, n]) => n), 1);
  const s = 3.4;
  const gap = 1.1;

  return (
    <svg
      className="chart-grid"
      viewBox={`0 0 ${weeks.length * (s + gap)} ${7 * (s + gap)}`}
      role="img"
      aria-label="daily contributions"
    >
      {weeks.map((w, x) =>
        w.map((n, y) =>
          n === null ? null : (
            <rect
              key={`${x}-${y}`}
              x={x * (s + gap)}
              y={y * (s + gap)}
              width={s}
              height={s}
              rx={0.7}
              fill="currentColor"
              fillOpacity={n === 0 ? 0.11 : 0.3 + (n / max) * 0.7}
            />
          )
        )
      )}
    </svg>
  );
}

export default function SideCharts({ stats }: { stats: Stats | null | undefined }) {
  if (stats === undefined) return <p className="side-note dim">loading live stats…</p>;
  if (!stats) return null;

  const levels = (stats.leetcode?.byLevel ?? []) as [string, number][];

  return (
    <>
      {stats.accounts.map((a) => {
        const langs = a.languages as [string, number][];
        // An all-zero calendar means we have no token for this account, not a
        // year off — show nothing rather than an empty grid.
        const days = (a.contrib?.total ? a.contrib.days : []) as [string, number][];
        if (!langs.length && !days.length) return null;

        return (
          <div key={a.user}>
            <p className="side-label dim">
              {a.label} · {a.user}
            </p>

            {langs.length > 0 && <Donut data={langs.slice(0, 6)} unit="%" />}

            {days.length > 0 && (
              <div className="chart-activity">
                <Grid days={days} />
                <p className="chart-caption dim">
                  {a.contrib!.total} contribution{a.contrib!.total === 1 ? "" : "s"},{" "}
                  {a.contrib!.source === "graphql" ? "past year" : "past 90 days"}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {levels.length > 0 && (
        <>
          <p className="side-label dim">leetcode · {stats.leetcode!.total} solved</p>
          <Bars data={levels} />
        </>
      )}
    </>
  );
}

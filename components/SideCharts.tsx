"use client";
import type { Account, Stats } from "@/app/api/stats/route";

/** Ring shades: one hue, separated by weight, so it survives every theme. */
const SHADE = [1, 0.74, 0.55, 0.4, 0.28, 0.19];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function Donut({ data }: { data: [string, number][] }) {
  const total = data.reduce((a, [, n]) => a + n, 0) || 1;
  const R = 26;
  const circ = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="chart-donut">
      <svg viewBox="0 0 64 64" className="chart-ring" role="img" aria-label="languages by share of code">
        {data.map(([name, n], i) => {
          const len = (n / total) * circ;
          const el = (
            <circle
              key={name}
              cx="32"
              cy="32"
              r={R}
              fill="none"
              stroke="currentColor"
              strokeOpacity={SHADE[i % SHADE.length]}
              strokeWidth="11"
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 32 32)"
            />
          );
          offset += len;
          return el;
        })}
      </svg>

      <ul className="chart-legend">
        {data.map(([name, n], i) => (
          <li key={name}>
            <span className="chart-swatch" style={{ opacity: SHADE[i % SHADE.length] }} />
            <span className="chart-name" title={name}>{name}</span>
            <span className="chart-pct">{n}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A full-width contribution calendar: weeks across, weekdays down. */
function Calendar({
  days,
  total,
  year,
  unit = "contribution",
}: {
  days: [string, number][];
  total: number;
  year: boolean;
  unit?: string;
}) {
  const lead = new Date(days[0][0] + "T00:00:00Z").getUTCDay();
  const cells: ([string, number] | null)[] = [...Array(lead).fill(null), ...days];
  const weeks: ([string, number] | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const max = Math.max(...days.map(([, n]) => n), 1);
  const S = 9;   // cell
  const G = 2.6; // gap
  const P = S + G;
  const TOP = 13; // room for month labels

  // One label per month, at the week it begins, with room to breathe.
  const labels: { x: number; text: string }[] = [];
  let seen = -1;
  let lastX = -99;
  weeks.forEach((w, i) => {
    const first = w.find(Boolean);
    if (!first) return;
    const m = new Date(first[0] + "T00:00:00Z").getUTCMonth();
    if (m === seen || i * P - lastX < 26 || i > weeks.length - 3) return;
    seen = m;
    lastX = i * P;
    labels.push({ x: i * P, text: MONTHS[m] });
  });

  const w = weeks.length * P;
  const h = TOP + 7 * P;

  return (
    <div className="chart-cal">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${total} ${unit}s`}>
        {labels.map((l) => (
          <text key={l.text + l.x} x={l.x} y={9} className="cal-month">
            {l.text}
          </text>
        ))}
        {weeks.map((week, x) =>
          week.map((d, y) =>
            d === null ? null : (
              <rect
                key={`${x}-${y}`}
                x={x * P}
                y={TOP + y * P}
                width={S}
                height={S}
                rx="2"
                fill="currentColor"
                fillOpacity={d[1] === 0 ? 0.1 : 0.3 + (d[1] / max) * 0.7}
              >
                <title>{`${d[0]} · ${d[1]} ${unit}${d[1] === 1 ? "" : "s"}`}</title>
              </rect>
            )
          )
        )}
      </svg>

      <div className="cal-foot">
        <span>
          <strong>{total}</strong> {unit}{total === 1 ? "" : "s"}
          <span className="dim"> · {year ? "past year" : "past 90 days"}</span>
        </span>
        <span className="cal-scale">
          <span className="dim">less</span>
          {[0.1, 0.32, 0.53, 0.75, 1].map((o) => (
            <i key={o} style={{ opacity: o }} />
          ))}
          <span className="dim">more</span>
        </span>
      </div>
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
          <span className="chart-pct">{n}</span>
        </li>
      ))}
    </ul>
  );
}

function AccountCard({ a }: { a: Account }) {
  const langs = a.languages as [string, number][];
  const days = (a.contrib?.total ? a.contrib.days : []) as [string, number][];
  if (!langs.length && !days.length) return null;

  return (
    <section className="side-card">
      <header className="card-head">
        <span className="card-label">{a.label}</span>
        <a
          className="card-user"
          href={`https://github.com/${a.user}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {a.user}
        </a>
      </header>

      {langs.length > 0 && <Donut data={langs.slice(0, 6)} />}

      {days.length > 0 && (
        <Calendar
          days={days}
          total={a.contrib!.total}
          year={a.contrib!.source === "graphql"}
        />
      )}
    </section>
  );
}

export default function SideCharts({ stats }: { stats: Stats | null | undefined }) {
  if (stats === undefined) return <p className="side-note dim">loading live stats…</p>;
  if (!stats) return null;

  const levels = (stats.leetcode?.byLevel ?? []) as [string, number][];

  return (
    <>
      <p className="side-label dim">github</p>
      {stats.accounts.map((a) => (
        <AccountCard key={a.user} a={a} />
      ))}

      {levels.length > 0 && (
        <>
          <p className="side-label dim">leetcode</p>
          <section className="side-card">
            <header className="card-head">
              <span className="card-label">{stats.leetcode!.total} solved</span>
              <a
                className="card-user"
                href={`https://leetcode.com/u/${stats.leetcode!.user}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {stats.leetcode!.user}
              </a>
            </header>
            <Bars data={levels} />

            {stats.leetcode!.contrib && stats.leetcode!.contrib.total > 0 && (
              <Calendar
                days={stats.leetcode!.contrib.days as [string, number][]}
                total={stats.leetcode!.contrib.total}
                year
                unit="submission"
              />
            )}

            {stats.leetcode!.ranking && (
              <p className="card-foot dim">
                global rank {stats.leetcode!.ranking.toLocaleString()}
                {/* A one-day streak is just "solved something today". */}
                {(stats.leetcode!.streak ?? 0) > 1 ? ` · ${stats.leetcode!.streak}-day streak` : ""}
              </p>
            )}
          </section>
        </>
      )}
    </>
  );
}

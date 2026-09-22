import { config } from "./config";
import type { Line } from "./commands";

const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

/** Months since Jan 2000, so periods can be compared as plain integers. */
function parseMonth(s: string, fallbackEnd = false): number | null {
  const t = s.trim().toLowerCase();
  if (/^(present|now|current)$/.test(t)) {
    const d = new Date();
    return (d.getFullYear() - 2000) * 12 + d.getMonth();
  }
  const withMonth = t.match(/^([a-z]{3})[a-z]*\s+(\d{4})$/);
  if (withMonth) {
    const m = MONTHS.indexOf(withMonth[1]);
    if (m >= 0) return (Number(withMonth[2]) - 2000) * 12 + m;
  }
  const yearOnly = t.match(/^(\d{4})$/);
  if (yearOnly) return (Number(yearOnly[1]) - 2000) * 12 + (fallbackEnd ? 11 : 0);
  return null;
}

/** "Feb 2025 — Aug 2025" → [start, end] in months since Jan 2000. */
function parsePeriod(period: string): [number, number] | null {
  const [a, b] = period.split(/\s*[—–-]\s*/);
  if (!a || !b) return null;
  const start = parseMonth(a);
  const end = parseMonth(b, true);
  return start === null || end === null || end < start ? null : [start, end];
}

type Row = { label: string; span: [number, number]; kind: "work" | "study" | "lead" };

const shorten = (s: string) =>
  s
    .replace("Indian Institute of Technology, Bombay", "IIT Bombay")
    .replace(/^Undergraduate /, "")
    .split(" · ")[0]
    .split(",")[0]
    .trim();

function rows(): Row[] {
  const schools = new Set<string>(config.education.map((e) => e.school));
  const work: Row[] = [];

  for (const e of config.experience) {
    const span = parsePeriod(e.period);
    if (!span) continue;
    // A stint at the university itself would otherwise collide with the degree.
    const label = schools.has(e.company) ? e.role : e.company;
    work.push({ label: shorten(label), span, kind: "work" });
  }
  for (const r of config.research) {
    const span = parsePeriod(r.period);
    if (span) work.push({ label: shorten(r.lab), span, kind: "work" });
  }
  for (const l of config.leadership) {
    const span = parsePeriod(l.period);
    if (span) work.push({ label: shorten(l.role), span, kind: "lead" });
  }

  // Schooling that predates all of it would squash the chart into the margin,
  // so education only appears where it overlaps the working window.
  const from = Math.min(...work.map((r) => r.span[0]));
  const study: Row[] = [];
  for (const e of config.education) {
    const span = parsePeriod(e.period);
    if (span && span[1] >= from) study.push({ label: shorten(e.school), span, kind: "study" });
  }

  return [...work, ...study].sort((a, b) => b.span[0] - a.span[0]);
}

const FILL = { work: "█", study: "▓", lead: "▒" } as const;

/** Draws the roles as a character gantt chart. */
export function timeline(width = 48): Line[] {
  const data = rows();
  if (!data.length) return [{ text: "  no dated entries", cls: "dim" }];

  const lo = Math.min(...data.map((r) => r.span[0]));
  const hi = Math.max(...data.map((r) => r.span[1]));
  const months = Math.max(1, hi - lo);
  const labelWidth = Math.min(30, Math.max(...data.map((r) => r.label.length)));
  const at = (m: number) => Math.round(((m - lo) / months) * (width - 1));

  // Year ruler across the top.
  const startYear = 2000 + Math.floor(lo / 12);
  const endYear = 2000 + Math.floor(hi / 12);
  let ticks = " ".repeat(width);
  let marks = " ".repeat(width);
  const step = Math.max(1, Math.ceil(5 / Math.max(1, (width - 1) / Math.max(1, endYear - startYear))));
  for (let y = startYear; y <= endYear; y++) {
    const col = at((y - 2000) * 12);
    if (col < 0 || col >= width) continue;
    marks = marks.slice(0, col) + "│" + marks.slice(col + 1);
    if ((y - startYear) % step) continue;
    const label = String(y);
    const put = Math.min(col, width - label.length);
    if (put < 0) continue;
    ticks = ticks.slice(0, put) + label + ticks.slice(put + label.length);
  }

  const pad = (s: string) => s.slice(0, labelWidth).padEnd(labelWidth);
  const out: Line[] = [
    { text: `  ${" ".repeat(labelWidth)}  ${ticks.trimEnd()}`, cls: "dim" },
    { text: `  ${" ".repeat(labelWidth)}  ${marks.trimEnd()}`, cls: "dim" },
  ];

  for (const r of data) {
    const a = at(r.span[0]);
    const b = Math.max(a, at(r.span[1]));
    const bar = " ".repeat(a) + FILL[r.kind].repeat(b - a + 1);
    out.push({ text: `  ${pad(r.label)}  ${bar}`, cls: r.kind === "study" ? "dim" : undefined });
  }

  out.push({ text: "" });
  out.push({ text: `  █ work   ▓ study   ▒ leadership`, cls: "dim" });
  return out;
}

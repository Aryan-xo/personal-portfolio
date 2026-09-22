import type { Line } from "./commands";
import type { Contrib } from "@/app/api/stats/route";

const LEVELS = ["·", "░", "▒", "▓", "█"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** Draws a GitHub-style contribution grid: weeks across, weekdays down. */
export function heatmap(c: Contrib, unit = "contribution"): Line[] {
  if (!c.days.length) return [{ text: "  no activity data", cls: "dim" }];

  // Pad the front so the first column starts on a Sunday.
  const lead = new Date(c.days[0][0] + "T00:00:00Z").getUTCDay();
  const cells: ([string, number] | null)[] = [...Array(lead).fill(null), ...c.days];

  const weeks: ([string, number] | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  // Scale by the busiest day, so a quiet year still shows its own shape.
  const max = Math.max(...c.days.map(([, n]) => n), 1);
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, 1 + Math.floor((n / max) * 3.999)));

  // Month labels above the week each month starts in.
  let months = " ".repeat(weeks.length);
  let seen = -1;
  let lastCol = -99;
  weeks.forEach((w, i) => {
    const first = w.find(Boolean);
    if (!first) return;
    const m = new Date(first[0] + "T00:00:00Z").getUTCMonth();
    // A month needs three columns for its label plus a gap, or short months
    // overwrite each other ("JuJul").
    if (m === seen || i + 3 > weeks.length || i - lastCol < 4) return;
    seen = m;
    lastCol = i;
    months = months.slice(0, i) + MONTHS[m] + months.slice(i + 3);
  });

  const out: Line[] = [{ text: `       ${months.trimEnd()}`, cls: "dim" }];

  for (let d = 0; d < 7; d++) {
    const row = weeks.map((w) => (w[d] ? LEVELS[level(w[d]![1])] : " ")).join("");
    // Label alternate days only; seven stacked labels is noise.
    const label = d % 2 === 1 ? DAYS[d] : "   ";
    out.push({ text: `  ${label}  ${row}` });
  }

  const window = c.source === "graphql" ? "in the last year" : "in the last 90 days";
  out.push(
    { text: "" },
    { text: `  ${c.total} ${unit}${c.total === 1 ? "" : "s"} ${window}`, cls: "accent" },
    { text: `  less ${LEVELS.join("")} more`, cls: "dim" }
  );
  if (c.source === "events") {
    out.push({
      text: "  (derived from public events — set GITHUB_TOKEN for the full calendar)",
      cls: "dim",
    });
  }
  return out;
}

/** A horizontal bar chart, for language and difficulty breakdowns. */
export function bars(rows: [string, number][], width = 24, labelWidth = 18): Line[] {
  if (!rows.length) return [];
  const max = Math.max(...rows.map(([, n]) => n), 1);
  const total = rows.reduce((a, [, n]) => a + n, 0);
  return rows.map(([name, n]) => {
    const filled = Math.max(1, Math.round((n / max) * width));
    const pct = total ? Math.round((n / total) * 100) : 0;
    return {
      text: `  ${name.slice(0, labelWidth).padEnd(labelWidth)}${"█".repeat(filled)}${"░".repeat(width - filled)}  ${String(n).padStart(3)}  ${String(pct).padStart(2)}%`,
    };
  });
}

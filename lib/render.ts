import { config } from "./config";

export type Line = { text: string; cls?: string };

export const A = (text: string): Line => ({ text, cls: "accent" });
export const D = (text: string): Line => ({ text, cls: "dim" });
export const P = (text = ""): Line => ({ text });

export const pad = (s: string, n: number) => s + " ".repeat(Math.max(0, n - s.length));

export function rule(label = "") {
  return D(label ? `── ${label} ${"─".repeat(Math.max(0, 56 - label.length))}` : "─".repeat(60));
}

/**
 * Output is wrapped here rather than by CSS, because the hanging indents that
 * make a bullet list readable cannot be expressed with `pre-wrap` alone. That
 * means the column count has to follow the viewport: the terminal measures its
 * own width and sets this on mount and on resize.
 */
let WRAP = 96;
export const setWrap = (cols: number) => {
  WRAP = Math.max(28, Math.min(120, Math.floor(cols)));
};
export const getWrap = () => WRAP;

/** Greedy word wrap, with every line after the first indented to `hang`. */
export function wrap(text: string, indent = 2, hang = indent): Line[] {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let line = " ".repeat(indent);
  let width = indent;
  for (const w of words) {
    if (width > hang && width + 1 + w.length > WRAP) {
      out.push(line);
      line = " ".repeat(hang) + w;
      width = hang + w.length;
    } else {
      const sep = width > (out.length ? hang : indent) ? " " : "";
      line += sep + w;
      width += sep.length + w.length;
    }
  }
  if (line.trim()) out.push(line);
  // A wrapped line should never open with the "·" that joined the previous item.
  return out.map((t, i) => P(i === 0 ? t : t.replace(/^(\s*)·\s*/, (_, sp) => sp + "  ")));
}

/** Wrap, keeping a class on every resulting line. */
const wrapAs = (cls: Line["cls"], text: string, indent = 0, hang = indent): Line[] =>
  wrap(text, indent, hang).map((l) => ({ ...l, cls }));

// ─────────────────────────────────────────────────────────────
// One renderer per kind of entry. The section commands map over these, and
// `show` uses a single one, so a result opened from search reads exactly as it
// does in its section — there is no second copy of the formatting to drift.
// ─────────────────────────────────────────────────────────────

type Experience = (typeof config.experience)[number];
type Research = (typeof config.research)[number];
type Project = (typeof config.projects)[number];
type Finance = (typeof config.finance)[number];
type Leadership = (typeof config.leadership)[number];
type Achievement = (typeof config.achievements)[number];
type Education = (typeof config.education)[number];

export const renderExperience = (e: Experience): Line[] => [
  ...wrapAs("accent", `${e.role} @ ${e.company}`, 0, 2),
  ...wrapAs("dim", `${e.period} · ${e.location}`, 0, 2),
  ...(e.note ? wrapAs("dim", e.note, 2) : []),
  ...e.bullets.flatMap((b) => wrap(`• ${b}`, 2, 4)),
  ...wrapAs("dim", `[ ${e.stack.join(" · ")} ]`, 2, 4),
];

export const renderResearch = (r: Research): Line[] => [
  ...wrapAs("accent", r.lab, 0, 2),
  ...wrap(`${r.role} · ${r.advisor}`, 2, 4),
  D(`  ${r.period}`),
  ...wrapAs("dim", r.note, 2),
  P(),
  D("  Approach"),
  ...r.approach.flatMap((b) => wrap(`• ${b}`, 2, 4)),
  P(),
  D("  Result"),
  ...r.result.flatMap((b) => wrap(`• ${b}`, 2, 4)),
];

export const renderProject = (p: Project): Line[] => [
  ...wrapAs("accent", p.name, 0, 2),
  ...wrapAs("dim", `${p.period}  ·  ${p.tag}`, 2, 4),
  ...wrap(p.blurb, 2),
  ...wrapAs("dim", `${p.stack.join(" · ")}${p.url ? `  →  ${p.url}` : ""}`, 2, 4),
];

export const renderFinance = (f: Finance): Line[] => [
  ...wrapAs("accent", f.name, 0, 2),
  ...wrapAs("dim", `${f.period}  ·  ${f.tag}`, 2, 4),
  ...f.bullets.flatMap((b) => wrap(`• ${b}`, 2, 4)),
];

export const renderLeadership = (l: Leadership): Line[] => [
  ...wrapAs("accent", l.role, 0, 2),
  ...wrap(l.org, 2, 4),
  D(`  ${l.period}`),
  ...(l.note ? wrapAs("dim", l.note, 2) : []),
  ...l.bullets.flatMap((b) => wrap(`• ${b}`, 2, 4)),
];

export const renderAchievement = (a: Achievement): Line[] =>
  wrap(`${a.year}  ·  ${a.text}`, 2, 10);

export const renderEducation = (e: Education): Line[] => [
  ...wrapAs("accent", e.school, 0, 2),
  ...wrap(e.degree, 2, 4),
  ...wrapAs("dim", `${e.period} · ${e.detail}`, 2, 4),
  ...e.extra.flatMap((x) => wrap(`· ${x}`, 2, 4)),
];

export const renderCertification = (c: string): Line[] => wrap(`• ${c}`, 2, 4);

export const renderSkillGroup = ([group, items]: [string, readonly string[]]): Line[] => {
  const [first, ...rest] = wrap(items.join(" · "), 17, 17);
  return [{ text: `  ${pad(group, 15)}${first.text.trimStart()}` }, ...rest];
};

export const renderInterest = (i: string): Line[] => wrap(`• ${i}`, 2, 4);

export const renderAbout = (): Line[] => [
  ...config.identity.summary.flatMap((s) => (s ? wrap(s, 2) : [P()])),
  P(),
  D(`  ${config.identity.tagline}`),
];

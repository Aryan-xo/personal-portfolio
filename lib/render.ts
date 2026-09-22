import { config } from "./config";

export type Line = { text: string; cls?: string };

export const A = (text: string): Line => ({ text, cls: "accent" });
export const D = (text: string): Line => ({ text, cls: "dim" });
export const P = (text = ""): Line => ({ text });

export const pad = (s: string, n: number) => s + " ".repeat(Math.max(0, n - s.length));

export function rule(label = "") {
  return D(label ? `── ${label} ${"─".repeat(Math.max(0, 56 - label.length))}` : "─".repeat(60));
}

const WRAP = 96;

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
  A(`${e.role} @ ${e.company}`),
  D(`${e.period} · ${e.location}`),
  ...(e.note ? wrap(e.note, 2).map((l) => D(l.text)) : []),
  ...e.bullets.flatMap((b) => wrap(`• ${b}`, 2, 4)),
  D(`  [ ${e.stack.join(" · ")} ]`),
];

export const renderResearch = (r: Research): Line[] => [
  A(r.lab),
  P(`  ${r.role} · ${r.advisor}`),
  D(`  ${r.period}`),
  ...wrap(r.note, 2).map((l) => D(l.text)),
  P(),
  D("  Approach"),
  ...r.approach.flatMap((b) => wrap(`• ${b}`, 2, 4)),
  P(),
  D("  Result"),
  ...r.result.flatMap((b) => wrap(`• ${b}`, 2, 4)),
];

export const renderProject = (p: Project): Line[] => [
  A(p.name),
  D(`  ${p.period}  ·  ${p.tag}`),
  ...wrap(p.blurb, 2),
  D(`  ${p.stack.join(" · ")}${p.url ? `  →  ${p.url}` : ""}`),
];

export const renderFinance = (f: Finance): Line[] => [
  A(f.name),
  D(`  ${f.period}  ·  ${f.tag}`),
  ...f.bullets.flatMap((b) => wrap(`• ${b}`, 2, 4)),
];

export const renderLeadership = (l: Leadership): Line[] => [
  A(l.role),
  P(`  ${l.org}`),
  D(`  ${l.period}`),
  ...(l.note ? wrap(l.note, 2).map((x) => D(x.text)) : []),
  ...l.bullets.flatMap((b) => wrap(`• ${b}`, 2, 4)),
];

export const renderAchievement = (a: Achievement): Line[] =>
  wrap(`${a.year}  ·  ${a.text}`, 2, 10);

export const renderEducation = (e: Education): Line[] => [
  A(e.school),
  P(`  ${e.degree}`),
  D(`  ${e.period} · ${e.detail}`),
  ...e.extra.flatMap((x) => wrap(`· ${x}`, 2, 4)),
];

export const renderCertification = (c: string): Line[] => wrap(`• ${c}`, 2, 4);

export const renderSkillGroup = ([group, items]: [string, readonly string[]]): Line[] => {
  const [first, ...rest] = wrap(items.join(" · "), 17, 17);
  return [{ text: `  ${pad(group, 15)}${first.text.trimStart()}` }, ...rest];
};

export const renderInterest = (i: string): Line[] => [P(`  • ${i}`)];

export const renderAbout = (): Line[] => [
  ...config.identity.summary.flatMap((s) => (s ? wrap(s, 2) : [P()])),
  P(),
  D(`  ${config.identity.tagline}`),
];

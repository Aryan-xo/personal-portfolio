import { config } from "./config";

export type Entry = {
  /** Section heading, and the command that prints this entry in full. */
  section: string;
  command: string;
  title: string;
  meta?: string;
  body: string;
};

/** A flat index over everything in config.ts, built once at module load. */
export const index: Entry[] = (() => {
  const c = config;
  const out: Entry[] = [];

  out.push({
    section: "about",
    command: "about",
    title: c.identity.name,
    meta: c.identity.headline,
    body: [c.identity.summary.join(" "), c.identity.tagline, c.identity.location].join(" "),
  });

  for (const e of c.experience) {
    out.push({
      section: "experience",
      command: "experience",
      title: `${e.role} @ ${e.company}`,
      meta: `${e.period} · ${e.location}`,
      body: [e.note, ...e.bullets, ...e.stack].join(" "),
    });
  }

  for (const r of c.research) {
    out.push({
      section: "research",
      command: "research",
      title: r.lab,
      meta: `${r.role} · ${r.period}`,
      body: [r.note, r.advisor, ...r.approach, ...r.result].join(" "),
    });
  }

  for (const p of c.projects) {
    out.push({
      section: "projects",
      command: "projects",
      title: p.name,
      meta: `${p.period} · ${p.tag}`,
      body: [p.blurb, ...p.stack].join(" "),
    });
  }

  for (const f of c.finance) {
    out.push({
      section: "finance",
      command: "finance",
      title: f.name,
      meta: `${f.period} · ${f.tag}`,
      body: f.bullets.join(" "),
    });
  }

  for (const l of c.leadership) {
    out.push({
      section: "leadership",
      command: "leadership",
      title: l.role,
      meta: `${l.org} · ${l.period}`,
      body: [l.note, ...l.bullets].join(" "),
    });
  }

  for (const a of c.achievements) {
    out.push({ section: "achievements", command: "achievements", title: a.text, meta: a.year, body: a.text });
  }

  for (const e of c.education) {
    out.push({
      section: "education",
      command: "education",
      title: e.school,
      meta: `${e.degree} · ${e.period}`,
      body: [e.detail, ...e.extra].join(" "),
    });
  }

  for (const x of c.certifications) {
    out.push({ section: "certifications", command: "certifications", title: x, body: x });
  }

  for (const [group, items] of Object.entries(c.skills)) {
    out.push({
      section: "skills",
      command: "skills",
      title: group,
      meta: `${(items as readonly string[]).length} items`,
      body: (items as readonly string[]).join(" "),
    });
  }

  for (const x of c.interests) {
    out.push({ section: "interests", command: "interests", title: x, body: x });
  }

  return out;
})();

export type Hit = Entry & { score: number; snippet: string };

/**
 * All query terms must appear somewhere in an entry. A term in the title
 * outweighs one buried in the body, and a whole-word match outweighs a
 * substring, so "go" ranks Go the language above "algorithm".
 */
export function search(query: string, limit = 12): Hit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  const hits: Hit[] = [];
  for (const e of index) {
    const title = e.title.toLowerCase();
    const meta = (e.meta ?? "").toLowerCase();
    const body = e.body.toLowerCase();
    const all = `${title} ${meta} ${body}`;

    let score = 0;
    let ok = true;
    for (const t of terms) {
      if (!all.includes(t)) { ok = false; break; }
      const esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const exact = new RegExp(`\\b${esc}\\b`);
      const prefix = new RegExp(`\\b${esc}`);
      if (title.includes(t)) score += exact.test(title) ? 16 : prefix.test(title) ? 9 : 5;
      if (meta.includes(t)) score += exact.test(meta) ? 5 : 3;
      if (body.includes(t)) score += exact.test(body) ? 4 : prefix.test(body) ? 2 : 1;
    }
    if (!ok) continue;
    hits.push({ ...e, score, snippet: snippetFor(e, terms[0]) });
  }

  return hits.sort((a, b) => b.score - a.score || a.title.length - b.title.length).slice(0, limit);
}

/** A short window of body text around the first match, for context. */
function snippetFor(e: Entry, term: string): string {
  const i = e.body.toLowerCase().indexOf(term);
  if (i < 0) return e.body.slice(0, 90);
  const start = Math.max(0, i - 36);
  const raw = e.body.slice(start, start + 110);
  return (start > 0 ? "…" : "") + raw.trim() + (start + 110 < e.body.length ? "…" : "");
}

/** Split text into alternating non-match / match parts, for highlighting. */
export function highlight(text: string, query: string): { text: string; hit: boolean }[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [{ text, hit: false }];
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text
    .split(re)
    .filter(Boolean)
    .map((part) => ({ text: part, hit: terms.includes(part.toLowerCase()) }));
}

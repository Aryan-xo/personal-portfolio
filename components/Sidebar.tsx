"use client";
import { useMemo, useState } from "react";
import { config } from "@/lib/config";
import { index, search, highlight } from "@/lib/search";
import SideCharts from "./SideCharts";
import type { Stats } from "@/app/api/stats/route";

/** Counts per section, for the idle contents list. */
const SECTIONS = (() => {
  const counts = new Map<string, number>();
  for (const e of index) counts.set(e.section, (counts.get(e.section) ?? 0) + 1);
  return [...counts.entries()];
})();

const STATS: [string, string][] = [
  ["roles", String(config.experience.length)],
  ["projects", String(config.projects.length + config.finance.length)],
  ["awards", String(config.achievements.length)],
  ["indexed", String(index.length)],
];

function Marked({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlight(text, query).map((p, i) =>
        p.hit ? (
          <mark key={i}>{p.text}</mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}

export default function Sidebar({
  onRun,
  stats,
}: {
  onRun: (cmd: string) => void;
  stats: Stats | null | undefined;
}) {
  const [q, setQ] = useState("");
  const hits = useMemo(() => search(q), [q]);
  const searching = q.trim().length > 0;

  return (
    <aside className="sidebar" aria-label="search and contents">
      <div className="side-search">
        <span className="dim">/</span>
        <input
          id="side-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Escape") {
              setQ("");
              (document.querySelector(".inputrow input") as HTMLInputElement)?.focus();
            }
            if (e.key === "Enter" && hits[0]) onRun(`show ${hits[0].id}`);
          }}
          placeholder="search everything"
          aria-label="search"
          spellCheck={false}
        />
        {searching ? (
          <button className="side-clear" onClick={() => setQ("")} aria-label="clear search">
            ✕
          </button>
        ) : (
          <kbd className="side-kbd dim" title="press / or ⌘K">/</kbd>
        )}
      </div>

      {searching ? (
        <div className="side-results">
          <p className="side-count dim">
            {hits.length ? `${hits.length} match${hits.length === 1 ? "" : "es"}` : "no matches"}
          </p>
          {hits.map((h, i) => (
            // Opens this entry alone; the section tag beside it opens the rest.
            <button key={i} className="side-hit" onClick={() => onRun(`show ${h.id}`)}>
              <span className="side-tag">{h.section}</span>
              <span className="side-title">
                <Marked text={h.title} query={q} />
              </span>
              {h.meta && <span className="side-meta dim">{h.meta}</span>}
              <span className="side-snip dim">
                <Marked text={h.snippet} query={q} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="side-idle">
          <p className="side-label dim">contents</p>
          <ul className="side-toc">
            {SECTIONS.map(([name, n]) => (
              <li key={name}>
                <button onClick={() => onRun(name)}>
                  <span>{name}</span>
                  <span className="dim">{n}</span>
                </button>
              </li>
            ))}
          </ul>

          <p className="side-label dim">at a glance</p>
          <dl className="side-stats">
            {STATS.map(([k, v]) => (
              <div key={k}>
                <dt className="dim">{k}</dt>
                <dd className="accent">{v}</dd>
              </div>
            ))}
          </dl>

          <SideCharts stats={stats} />

          <p className="side-label dim">elsewhere</p>
          <ul className="side-links">
            <li><a href={config.contact.github} target="_blank" rel="noopener noreferrer">github</a></li>
            <li><a href={config.contact.githubWork} target="_blank" rel="noopener noreferrer">github · work</a></li>
            <li><a href={config.contact.linkedin} target="_blank" rel="noopener noreferrer">linkedin</a></li>
            <li><a href={config.contact.leetcode} target="_blank" rel="noopener noreferrer">leetcode</a></li>
            <li><a href={config.resumeUrl} target="_blank" rel="noopener noreferrer">resume.pdf</a></li>
          </ul>
        </div>
      )}
    </aside>
  );
}

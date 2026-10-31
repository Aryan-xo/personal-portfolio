import { config, published } from "./config";
import { themes } from "./themes";
import { portraitSmall } from "./portrait";
import { search, byId } from "./search";
import { timeline } from "./timeline";
import { tours, tourNames } from "./tours";
import type { Stats } from "@/app/api/stats/route";
import { heatmap, bars } from "./heatmap";
import {
  A, D, P, pad, rule, wrap,
  renderAbout, renderAchievement, renderCertification, renderEducation,
  renderExperience, renderFinance, renderInterest, renderLeadership,
  renderPost, renderPostSummary, renderProject, renderResearch, renderSkillGroup,
  renderTil,
  type Line,
} from "./render";

export type { Line };
export type CmdResult = {
  lines: Line[];
  /** Hands the terminal a sequence to type to itself. */
  tour?: string[];
  clear?: boolean;
  setTheme?: string;
  setCrt?: boolean;
  setSound?: boolean;
  open?: string;
  effect?: "matrix" | "shake";
  /** Something interactive to render under the text: a form, a photo grid. */
  widget?: Widget;
};

export type Widget = "gallery" | "guestbook" | "hire" | "music";

const posts = () => config.writing.filter(published);
const tils = () => config.til.filter(published);

export const HIRE_STATUS = {
  open: "● Open to new roles",
  selective: "◐ Open to the right role",
  closed: "○ Not looking right now",
} as const;

/**
 * Whether a section has anything to show on this build. Help and the quick
 * chips skip the empty ones, so the live site never advertises a drawer with
 * nothing in it while the content is still a draft.
 */
export function available(name: string): boolean {
  switch (name) {
    case "writing": return posts().length > 0;
    case "til": return tils().length > 0;
    case "now": return published(config.now);
    case "hire": return published(config.hire);
    case "gallery": return config.gallery.length > 0;
    default: return true;
  }
}

export const commandList = [
  ["help", "show this list"],
  ["about", "who I am"],
  ["whoami", "the short version"],
  ["experience", "where I've worked"],
  ["hire", "am I available, and how to reach me"],
  ["research", "lab work in Japan"],
  ["timeline", "the whole thing as a chart"],
  ["tour", "let the terminal show you around"],
  ["gh", "live GitHub and LeetCode stats"],
  ["contrib", "commit activity as a heatmap"],
  ["projects", "things I've built"],
  ["writing", "longer notes · read <slug>"],
  ["til", "today I learned"],
  ["now", "what I'm up to this month"],
  ["gallery", "photographs, mostly at night"],
  ["music", "what I'm listening to"],
  ["guestbook", "leave a note"],
  ["finance", "quant and valuation work"],
  ["skills", "what I work with"],
  ["achievements", "wins worth listing"],
  ["leadership", "positions of responsibility"],
  ["education", "where I studied"],
  ["certifications", "courses and credentials"],
  ["interests", "what I do off the clock"],
  ["contact", "email, phone, address"],
  ["social", "github, linkedin, leetcode"],
  ["resume", "download the PDF"],
  ["neofetch", "system info, portfolio edition"],
  ["theme", "switch colour scheme"],
  ["find", "search everything · find <term>"],
  ["crt", "toggle scanlines and glow"],
  ["sound", "keyclicks and a modem, off by default"],
  ["banner", "reprint the header"],
  ["clear", "wipe the screen"],
] as const;

export const commandNames = [
  ...commandList.map((c) => c[0]),
  "github", "linkedin", "leetcode", "email", "ls", "cat", "pwd", "date", "echo",
  "sudo", "matrix", "vim", "exit", "history", "man", "work", "awards", "quant",
  "por", "certs", "hobbies", "cv", "grep", "search", "gantt", "stats", "heatmap",
  "play", "audio", "blog", "posts", "read", "spotify", "np", "photos", "availability",
  "show",
];

/**
 * Completion candidates for the current input. Completes a bare command, or the
 * argument of a command that takes a fixed set (only `theme` so far).
 */
export function completions(raw: string): string[] {
  const input = raw.replace(/^\s+/, "");
  const m = input.match(/^(\S+)(\s+)(\S*)$/);
  if (m) {
    const [, cmd, , partial] = m;
    if (cmd.toLowerCase() === "theme") {
      return themes.map((t) => t.name).filter((n) => n.startsWith(partial.toLowerCase()));
    }
    if (/^(tour|play)$/i.test(cmd)) {
      return tourNames.filter((n) => n.startsWith(partial.toLowerCase()));
    }
    if (cmd.toLowerCase() === "read") {
      return posts().map((p) => p.slug).filter((n) => n.startsWith(partial.toLowerCase()));
    }
    if (cmd.toLowerCase() === "crt") {
      return ["on", "off"].filter((n) => n.startsWith(partial.toLowerCase()));
    }
    return [];
  }
  if (!input || /\s/.test(input)) return [];
  return commandNames.filter((c) => c.startsWith(input.toLowerCase()) && c !== input.toLowerCase());
}

/**
 * Commands worth putting in the address bar: they print content, so a link to
 * one is meaningful. Toggles and one-shot actions are deliberately excluded.
 */
export const linkable = new Set([
  "about", "whoami", "experience", "research", "projects", "finance", "skills",
  "achievements", "leadership", "education", "certifications", "interests",
  "contact", "social", "timeline", "neofetch", "help",
  "writing", "til", "now", "gallery", "music", "guestbook", "hire",
]);

export function runCommand(
  raw: string,
  ctx: { history: string[]; stats?: Stats | null }
): CmdResult {
  const input = raw.trim();
  const [cmd, ...args] = input.split(/\s+/);
  const arg = args.join(" ");
  const c = config;

  switch (cmd.toLowerCase()) {
    case "":
      return { lines: [] };

    case "help":
    case "man":
      return {
        lines: [
          rule("commands"),
          ...commandList.filter(([name]) => available(name)).map(([name, desc]) => ({
            text: `  ${pad(name, 14)}${desc}`,
            cls: "cmdrow",
          })),
          P(),
          D("  Type to see a suggestion · Tab or → accepts it"),
          D("  ↑ ↓ walks history · Ctrl+L clears"),
          D("  There are a few commands not on this list."),
        ],
      };

    case "whoami":
      return {
        lines: [
          A(c.identity.name),
          P(c.identity.headline),
          P(c.identity.location),
          D(c.identity.tagline),
        ],
      };

    case "about":
      return {
        lines: [rule("about"), ...renderAbout()],
      };

    case "experience":
    case "work":
      return {
        lines: [
          rule("experience"),
          ...c.experience.flatMap((e) => [...renderExperience(e), P()]),
        ],
      };

    case "projects":
      return {
        lines: [
          rule("projects"),
          ...c.projects.flatMap((p) => [...renderProject(p), P()]),
        ],
      };

    case "skills":
      return {
        lines: [
          rule("skills"),
          P(`  ${pad("Top", 15)}${c.topSkills.join(" · ")}`),
          P(),
          ...Object.entries(c.skills).flatMap(([k, v]) =>
            renderSkillGroup([k, v as readonly string[]])
          ),
        ],
      };

    case "achievements":
    case "awards":
      return {
        lines: [
          rule("achievements"),
          ...c.achievements.flatMap(renderAchievement),
        ],
      };

    case "education":
      return {
        lines: [
          rule("education"),
          ...c.education.flatMap((e) => [...renderEducation(e), P()]),
        ],
      };

    case "tour":
    case "play": {
      const name = (arg || "intro").toLowerCase();
      const t = tours[name];
      if (!t) {
        return {
          lines: [
            D("usage: tour [name]"),
            ...Object.entries(tours).map(([k, v]) => P(`  ${pad(k, 13)}${v.label}`)),
          ],
        };
      }
      return {
        lines: [D(`tour: ${t.label} — press any key to stop`)],
        tour: [...t.commands],
      };
    }

    case "contrib":
    case "heatmap": {
      const st = ctx.stats;
      if (st === undefined) return { lines: [D("fetching activity …")] };
      const withData = st?.accounts.filter((a) => a.contrib?.total) ?? [];
      const lc = st?.leetcode?.contrib?.total ? st.leetcode : null;
      if (!withData.length && !lc) {
        return { lines: [{ text: "contrib: no activity data available", cls: "err" }] };
      }
      return {
        lines: [
          rule("contributions"),
          ...withData.flatMap((a) => [
            A(`  ${a.user}  ·  ${a.label}`),
            ...heatmap(a.contrib!),
            P(),
          ]),
          ...(lc
            ? [
                A(`  ${lc.user}  ·  leetcode`),
                ...heatmap(lc.contrib!, "submission"),
                ...((lc.streak ?? 0) > 1 ? [D(`  ${lc.streak}-day streak`)] : []),
                P(),
              ]
            : []),
        ],
      };
    }

    case "gh":
    case "stats": {
      const st = ctx.stats;
      if (st === undefined) return { lines: [D("fetching live stats …")] };
      if (!st) return { lines: [{ text: "gh: could not reach the stats endpoint", cls: "err" }] };

      const out: Line[] = [rule("live stats")];

      for (const a of st.accounts) {
        out.push(A(`  github.com/${a.user}  ·  ${a.label}`));

        if (a.repos !== null) {
          out.push(
            P(`    ${pad(String(a.repos), 6)}public repos`),
            P(`    ${pad(String(a.stars ?? 0), 6)}stars earned`),
            P(`    ${pad(String(a.followers ?? 0), 6)}followers`)
          );
        } else {
          out.push(D("    no public repositories — the work is private"));
        }

        if (a.contrib?.total) {
          const window = a.contrib.source === "graphql" ? "past year" : "past 90 days";
          out.push(P(`    ${pad(String(a.contrib.total), 6)}contributions, ${window}`));
        } else if (a.repos === null) {
          out.push(D("    no public activity to report"));
        }

        if (a.languages.length) {
          out.push(
            P(),
            D(`    languages by share of code${a.languageSource === "private" ? " (private repos, aggregate)" : ""}`),
            ...bars(a.languages, 22, 20).map((l) => P(`  ${l.text.replace(/\s+\d+\s+(\d+)%$/, "  $1%")}`))
          );
        }

        if (a.top.length) {
          out.push(P(), D("    most-starred repos"));
          for (const r of a.top) {
            out.push(P(`    ${r.stars ? `★${r.stars} ` : "   "}${r.name}`));
            if (r.description) out.push(...wrap(r.description, 7).map((l) => D(l.text)));
          }
        }
        out.push(P());
      }

      if (st.leetcode) {
        const l = st.leetcode;
        out.push(
          A(`  leetcode.com/u/${l.user}`),
          P(`    ${pad(String(l.total), 6)}problems solved`),
          ...bars(l.byLevel as [string, number][], 22, 20).map((x) => P(`  ${x.text}`)),
          ...(l.ranking ? [D(`    global rank  ${l.ranking.toLocaleString()}`)] : []),
          ...(l.contrib?.total
            ? [D(`    ${l.contrib.total} submissions in the last year`)]
            : [])
        );
      }

      out.push(P(), D("  Refreshed hourly, straight from the APIs."));
      return { lines: out };
    }

    case "writing":
    case "blog":
    case "posts": {
      const list = posts();
      if (!list.length) return { lines: [D("Nothing published yet. Soon.")] };
      return {
        lines: [
          rule("writing"),
          ...list.flatMap((p) => [...renderPostSummary(p), P()]),
          D("  `read <slug>` opens one."),
        ],
      };
    }

    case "read": {
      const post = posts().find((p) => p.slug === arg.toLowerCase());
      if (!post) {
        return {
          lines: [
            ...(arg ? [{ text: `read: no such post: ${arg}`, cls: "err" }] : [D("usage: read <slug>")]),
            ...posts().map((p) => P(`  ${pad(p.slug, 16)}${p.title}`)),
          ],
        };
      }
      return { lines: [rule("writing"), ...renderPost(post)] };
    }

    case "til": {
      const list = tils();
      if (!list.length) return { lines: [D("Nothing here yet.")] };
      return {
        lines: [rule("today I learned"), ...list.flatMap((t) => [...renderTil(t), P()])],
      };
    }

    case "now": {
      if (!published(c.now)) return { lines: [D("Nothing here yet.")] };
      return {
        lines: [
          rule(`now${c.now.draft ? " (draft)" : ""}`),
          ...c.now.items.flatMap(([k, v]) => {
            const [first, ...rest] = wrap(v, 15, 15);
            return [{ text: `  ${pad(k, 13)}${first.text.trimStart()}` }, ...rest];
          }),
          P(),
          D(`  Updated ${c.now.updated}.`),
        ],
      };
    }

    case "gallery":
    case "photos":
      if (!c.gallery.length) return { lines: [D("The gallery is empty for now — check back after a clear night.")] };
      return {
        lines: [
          rule("gallery"),
          D(`  ${c.gallery.length} photograph${c.gallery.length === 1 ? "" : "s"} · click one to open it, ← → to move between them`),
        ],
        widget: "gallery",
      };

    case "spotify":
    case "music":
    case "np":
      return { lines: [rule("listening")], widget: "music" };

    case "guestbook":
      return {
        lines: [
          rule("guestbook"),
          D("  Say hello, leave a note. It shows up for everyone, so keep it kind."),
        ],
        widget: "guestbook",
      };

    case "hire":
    case "availability": {
      const h = c.hire;
      if (!published(h)) return { lines: [D("`contact` has the ways to reach me.")] };
      return {
        lines: [
          rule(`availability${h.draft ? " (draft)" : ""}`),
          A(`  ${HIRE_STATUS[h.status]}`),
          ...wrap(h.headline, 2),
          P(),
          ...([
            ["Roles", h.roles.join(" · ")],
            ["Where", h.locations.join(" · ")],
            ["Start", h.start],
          ] as const).flatMap(([k, v]) => {
            const [first, ...rest] = wrap(v, 11, 11);
            return [{ text: `  ${pad(k, 9)}${first.text.trimStart()}` }, ...rest];
          }),
          P(),
          ...h.pitch.flatMap((x, i) => [...(i ? [P()] : []), ...wrap(x, 2)]),
          P(),
          D("  Fill this in and it opens an email to me, already written."),
        ],
        widget: "hire",
      };
    }

    case "timeline":
    case "gantt":
      return { lines: [rule("timeline"), ...timeline()] };

    case "research":
      return {
        lines: [
          rule("research"),
          ...c.research.flatMap((r) => [...renderResearch(r), P()]),
        ],
      };

    case "finance":
    case "quant":
      return {
        lines: [
          rule("finance & quant"),
          ...c.finance.flatMap((f) => [...renderFinance(f), P()]),
        ],
      };

    case "leadership":
    case "por":
      return {
        lines: [
          rule("positions of responsibility"),
          ...c.leadership.flatMap((l) => [...renderLeadership(l), P()]),
        ],
      };

    case "certifications":
    case "certs":
      return {
        lines: [rule("certifications"), ...c.certifications.flatMap(renderCertification)],
      };

    case "interests":
    case "hobbies":
      return {
        lines: [rule("interests"), ...c.interests.flatMap(renderInterest)],
      };

    case "contact":
      return {
        lines: [
          rule("contact"),
          P(`  ${pad("email", 11)}${c.contact.email}`),
          P(`  ${pad("institute", 11)}${c.contact.emailAlt}`),
          P(`  ${pad("phone", 11)}${c.contact.phone}`),
          P(`  ${pad("address", 11)}${c.contact.address}`),
          P(),
          D("  `social` for links · `resume` for the PDF"),
        ],
      };

    case "social":
      return {
        lines: [
          rule("social"),
          P(`  ${pad("github", 11)}${c.contact.github}`),
          P(`  ${pad("github/work", 11)}${c.contact.githubWork}`),
          P(`  ${pad("linkedin", 11)}${c.contact.linkedin}`),
          P(`  ${pad("leetcode", 11)}${c.contact.leetcode}`),
          ...(c.contact.twitter ? [P(`  ${pad("x", 11)}${c.contact.twitter}`)] : []),
          ...(c.contact.website ? [P(`  ${pad("web", 11)}${c.contact.website}`)] : []),
          P(),
          D("  Type `github`, `linkedin` or `leetcode` to open in a new tab."),
        ],
      };

    case "github":
      return { lines: [D(`opening ${c.contact.github} …`)], open: c.contact.github };
    case "linkedin":
      return { lines: [D(`opening ${c.contact.linkedin} …`)], open: c.contact.linkedin };
    case "leetcode":
      return { lines: [D(`opening ${c.contact.leetcode} …`)], open: c.contact.leetcode };
    case "email":
      return { lines: [D(`composing to ${c.contact.email} …`)], open: `mailto:${c.contact.email}` };
    case "resume":
    case "cv":
      return { lines: [D(`downloading ${c.resumeUrl} …`)], open: c.resumeUrl };

    case "neofetch": {
      const info: [string, string][] = [
        ["", c.identity.name],
        ["", "─".repeat(24)],
        ["Role", c.identity.title],
        ["Location", c.identity.location],
        ["Email", c.contact.email],
        ...Object.entries(c.facts).map(([k, v]) => [k, v] as [string, string]),
        ["Themes", themes.map((t) => t.name).join(" ")],
      ];
      const art = portraitSmall;
      const w = Math.max(...art.map((l) => l.length));
      return {
        lines: art.map((line, i) => {
          // Centre the info block against the taller art column.
          const off = Math.max(0, Math.floor((art.length - info.length) / 2));
          const [k, v] = info[i - off] ?? ["", ""];
          const right = k ? `${pad(k, 11)}${v}` : v;
          return { text: `${pad(line, w + 4)}${right}`, cls: i - off < 2 ? "accent" : undefined };
        }),
      };
    }

    case "theme": {
      if (!arg) {
        return {
          lines: [
            D("usage: theme <name>"),
            P(`  ${themes.map((t) => t.name).join("  ")}`),
          ],
        };
      }
      const t = themes.find((x) => x.name === arg.toLowerCase());
      if (!t) return { lines: [{ text: `theme: no such theme: ${arg}`, cls: "err" }] };
      return { lines: [D(`theme → ${t.name}`)], setTheme: t.name };
    }

    case "show": {
      const entry = byId(arg);
      if (!entry) {
        return { lines: [{ text: `show: no such entry: ${arg}`, cls: "err" }] };
      }
      return {
        lines: [
          rule(entry.section),
          ...entry.lines,
          P(),
          D(`  Run \`${entry.command}\` for everything in this section.`),
        ],
      };
    }

    case "find":
    case "grep":
    case "search": {
      if (!arg) {
        return {
          lines: [
            D("usage: find <term>"),
            P("  Searches every section — experience, projects, skills, the lot."),
            D("  The sidebar search box does the same thing as you type."),
          ],
        };
      }
      const hits = search(arg, 10);
      if (!hits.length) {
        return { lines: [{ text: `find: nothing matches "${arg}"`, cls: "err" }] };
      }
      return {
        lines: [
          rule(`find "${arg}" — ${hits.length} match${hits.length === 1 ? "" : "es"}`),
          ...hits.flatMap((h) => [
            A(`  ${h.title}`),
            D(`    ${h.section}${h.meta ? ` · ${h.meta}` : ""}`),
            ...wrap(h.snippet, 4).map((l) => D(l.text)),
            D(`    show ${h.id}`),
            P(),
          ]),
          D("  `show <id>` opens one of these on its own."),
        ],
      };
    }

    case "sound":
    case "audio": {
      const on = /^(on|yes|1)$/i.test(arg);
      const off = /^(off|no|0|mute)$/i.test(arg);
      if (!on && !off) {
        return {
          lines: [
            D("usage: sound on | sound off"),
            P("  Key clicks as output arrives, a modem handshake over the boot"),
            P("  sequence, and the thunk of a CRT warming up. All synthesised."),
          ],
        };
      }
      return { lines: [D(`sound → ${on ? "on" : "off"}`)], setSound: on };
    }

    case "crt": {
      const on = /^on$/i.test(arg);
      const off = /^off$/i.test(arg);
      if (!on && !off) {
        return {
          lines: [
            D("usage: crt on | crt off"),
            P("  Turns the scanlines, vignette and phosphor glow on or off."),
            D("  `crt off` is the one to reach for if the screen is hard to read."),
          ],
        };
      }
      return { lines: [D(`crt → ${on ? "on" : "off"}`)], setCrt: on };
    }

    case "banner":
      return { lines: [], clear: false };

    case "clear":
      return { lines: [], clear: true };

    case "ls":
      return {
        lines: [
          {
            text:
              "  about/  experience/  research/  projects/  finance/  skills/\n" +
              "  achievements/  leadership/  education/  certifications/  interests/\n" +
              "  writing/  til/  now/  gallery/  guestbook/  hire/  contact/  resume.pdf",
            cls: "accent",
          },
        ],
      };

    case "pwd":
      return { lines: [P(`/home/${c.user}`)] };

    case "cat":
      if (!arg) return { lines: [D("usage: cat <file>")] };
      if (arg.replace(/\/$/, "") === "resume.pdf")
        return { lines: [D("binary file — use `resume` to download")] };
      return { lines: [{ text: `cat: ${arg}: No such file or directory`, cls: "err" }] };

    case "date":
      return { lines: [P(new Date().toString())] };

    case "echo":
      return { lines: [P(arg)] };

    case "history":
      return { lines: ctx.history.map((h, i) => ({ text: `  ${pad(String(i + 1), 5)}${h}` })) };

    case "sudo":
      return {
        lines: [
          { text: `${c.user} is not in the sudoers file.`, cls: "err" },
          { text: "This incident has been reported.", cls: "err" },
          D("…to nobody. There is no server."),
        ],
        effect: "shake",
      };

    case "matrix":
      return { lines: [D("wake up…")], effect: "matrix" };

    case "vim":
      return {
        lines: [
          D("Vim entered. You are now trapped."),
          P("  :q       nope"),
          P("  :q!      nope"),
          P("  :wq      nope"),
          D("  (type `clear`, it's the only way out)"),
        ],
      };

    case "exit":
    case "logout":
      return {
        lines: [D("There is no exit. This is a website."), D("Try `clear` instead.")],
      };

    default:
      return {
        lines: [
          { text: `${cmd}: command not found`, cls: "err" },
          D("Type `help` for the list."),
        ],
      };
  }
}

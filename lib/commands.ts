import { config } from "./config";
import { themes } from "./themes";
import { portraitSmall } from "./portrait";

export type Line = { text: string; cls?: string };
export type CmdResult = {
  lines: Line[];
  clear?: boolean;
  setTheme?: string;
  setCrt?: boolean;
  open?: string;
  effect?: "matrix" | "shake";
};

const A = (text: string): Line => ({ text, cls: "accent" });
const D = (text: string): Line => ({ text, cls: "dim" });
const P = (text = ""): Line => ({ text });

const pad = (s: string, n: number) => s + " ".repeat(Math.max(0, n - s.length));

function rule(label = "") {
  return D(label ? `── ${label} ${"─".repeat(Math.max(0, 56 - label.length))}` : "─".repeat(60));
}

const WRAP = 88;

/** Greedy word wrap, with every line after the first indented to `hang`. */
function wrap(text: string, indent = 2, hang = indent): Line[] {
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
  return out.map((t, i) =>
    P(i === 0 ? t : t.replace(/^(\s*)·\s*/, (_, sp) => sp + "  "))
  );
}

export const commandList = [
  ["help", "show this list"],
  ["about", "who I am"],
  ["whoami", "the short version"],
  ["experience", "where I've worked"],
  ["research", "lab work in Japan"],
  ["projects", "things I've built"],
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
  ["crt", "toggle scanlines and glow"],
  ["banner", "reprint the header"],
  ["clear", "wipe the screen"],
] as const;

export const commandNames = [
  ...commandList.map((c) => c[0]),
  "github", "linkedin", "leetcode", "email", "ls", "cat", "pwd", "date", "echo",
  "sudo", "matrix", "vim", "exit", "history", "man", "work", "awards", "quant",
  "por", "certs", "hobbies", "cv",
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
    if (cmd.toLowerCase() === "crt") {
      return ["on", "off"].filter((n) => n.startsWith(partial.toLowerCase()));
    }
    return [];
  }
  if (!input || /\s/.test(input)) return [];
  return commandNames.filter((c) => c.startsWith(input.toLowerCase()) && c !== input.toLowerCase());
}

export function runCommand(raw: string, ctx: { history: string[] }): CmdResult {
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
          ...commandList.map(([name, desc]) => ({
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
        lines: [
        rule("about"),
        ...c.identity.summary.flatMap((s) => (s ? wrap(s, 2) : [P()])),
        P(),
        D(`  ${c.identity.tagline}`),
      ],
      };

    case "experience":
    case "work":
      return {
        lines: [
          rule("experience"),
          ...c.experience.flatMap((e) => [
            A(`${e.role} @ ${e.company}`),
            D(`${e.period} · ${e.location}`),
            ...("note" in e && e.note ? wrap(e.note, 2).map((l) => D(l.text)) : []),
            ...e.bullets.flatMap((b) => wrap(`• ${b}`, 2, 4)),
            D(`  [ ${e.stack.join(" · ")} ]`),
            P(),
          ]),
        ],
      };

    case "projects":
      return {
        lines: [
          rule("projects"),
          ...c.projects.flatMap((p) => [
            A(`${p.name}`),
            D(`  ${p.period}  ·  ${p.tag}`),
            ...wrap(p.blurb, 2),
            D(`  ${p.stack.join(" · ")}${p.url ? `  →  ${p.url}` : ""}`),
            P(),
          ]),
        ],
      };

    case "skills":
      return {
        lines: [
          rule("skills"),
          P(`  ${pad("Top", 15)}${c.topSkills.join(" · ")}`),
          P(),
          ...Object.entries(c.skills).flatMap(([k, v]) => {
            const items = (v as readonly string[]).join(" · ");
            const [first, ...rest] = wrap(items, 2 + 15, 2 + 15);
            return [
              { text: `  ${pad(k, 15)}${first.text.trimStart()}`, cls: undefined },
              ...rest,
            ];
          }),
        ],
      };

    case "achievements":
    case "awards":
      return {
        lines: [
          rule("achievements"),
          ...c.achievements.flatMap((a) => wrap(`${a.year}  ·  ${a.text}`, 2, 10)),
        ],
      };

    case "education":
      return {
        lines: [
          rule("education"),
          ...c.education.flatMap((e) => [
            A(e.school),
            P(`  ${e.degree}`),
            D(`  ${e.period} · ${e.detail}`),
            ...e.extra.flatMap((x) => wrap(`· ${x}`, 2, 4)),
            P(),
          ]),
        ],
      };

    case "research":
      return {
        lines: [
          rule("research"),
          ...c.research.flatMap((r) => [
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
            P(),
          ]),
        ],
      };

    case "finance":
    case "quant":
      return {
        lines: [
          rule("finance & quant"),
          ...c.finance.flatMap((f) => [
            A(f.name),
            D(`  ${f.period}  ·  ${f.tag}`),
            ...f.bullets.flatMap((b) => wrap(`• ${b}`, 2, 4)),
            P(),
          ]),
        ],
      };

    case "leadership":
    case "por":
      return {
        lines: [
          rule("positions of responsibility"),
          ...c.leadership.flatMap((l) => [
            A(l.role),
            P(`  ${l.org}`),
            D(`  ${l.period}`),
            ...(l.note ? wrap(l.note, 2).map((x) => D(x.text)) : []),
            ...l.bullets.flatMap((b) => wrap(`• ${b}`, 2, 4)),
            P(),
          ]),
        ],
      };

    case "certifications":
    case "certs":
      return {
        lines: [rule("certifications"), ...c.certifications.flatMap((x) => wrap(`• ${x}`, 2, 4))],
      };

    case "interests":
    case "hobbies":
      return {
        lines: [rule("interests"), ...c.interests.map((x) => P(`  • ${x}`))],
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
              "  contact/  resume.pdf",
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

import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export const revalidate = 3600;

const handle = (url: string) => url.replace(/\/+$/, "").split("/").pop() ?? "";

export type Contrib = {
  /** ISO date → count, oldest first. */
  days: [string, number][];
  total: number;
  /** Full year via GraphQL, or ~90 days reconstructed from public events. */
  source: "graphql" | "events";
};

export type Repo = {
  name: string;
  description: string | null;
  stars: number;
  language: string | null;
  url: string;
};

export type Account = {
  user: string;
  label: string;
  /** Public counts; null when the account has nothing public to report. */
  repos: number | null;
  stars: number | null;
  followers: number | null;
  /** Share of code by bytes, as whole percentages. Never repo-identifying. */
  languages: [string, number][];
  languageSource: "public" | "private" | null;
  /** Empty for an account whose work is private. */
  top: Repo[];
  contrib: Contrib | null;
};

export type Stats = {
  accounts: Account[];
  leetcode: { user: string; total: number; byLevel: [string, number][]; ranking: number | null } | null;
};

type Cfg = { user: string; label: string; token?: string };

const ACCOUNTS: Cfg[] = [
  { user: handle(config.contact.github), label: "personal", token: process.env.GITHUB_TOKEN },
  { user: handle(config.contact.githubWork), label: "work", token: process.env.GITHUB_WORK_TOKEN },
];

const headers = (token?: string): HeadersInit => ({
  Accept: "application/vnd.github+json",
  "User-Agent": "portfolio",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

/** Run promises a few at a time, so a hundred repos don't open a hundred sockets. */
async function pool<T, R>(items: T[], size: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return out;
}

/**
 * Languages that are usually build output, vendored assets or generated
 * reports rather than anything anyone wrote. GitHub counts them by byte like
 * everything else, which lets a coverage report outweigh a service. Remove an
 * entry here if you do author it by hand.
 */
const GENERATED = new Set(["HTML", "CSS", "SCSS", "Less", "Sass", "Stylus"]);

const asPercent = (bytes: Map<string, number>, take = 8): [string, number][] => {
  for (const name of GENERATED) bytes.delete(name);
  const total = [...bytes.values()].reduce((a, b) => a + b, 0);
  if (!total) return [];
  return [...bytes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, take)
    .map(([name, n]) => [name, Math.round((n / total) * 100)] as [string, number])
    .filter(([, pct]) => pct > 0);
};

/**
 * Language mix for an account whose repositories are private. Only the summed
 * byte counts leave this function — never a repository name, description or
 * URL — so the published figures say what the work is written in and nothing
 * about what the work is.
 */
async function privateLanguages(token: string): Promise<[string, number][]> {
  const res = await fetch(
    "https://api.github.com/user/repos?per_page=100&affiliation=owner,collaborator,organization_member",
    { headers: headers(token), next: { revalidate } }
  );
  if (!res.ok) return [];

  const repos: { languages_url: string; fork: boolean }[] = await res.json();
  const bytes = new Map<string, number>();

  await pool(repos.filter((r) => !r.fork), 8, async (r) => {
    const lr = await fetch(r.languages_url, { headers: headers(token), next: { revalidate } });
    if (!lr.ok) return;
    const langs: Record<string, number> = await lr.json();
    for (const [name, n] of Object.entries(langs)) {
      bytes.set(name, (bytes.get(name) ?? 0) + n);
    }
  });

  return asPercent(bytes);
}

/** Language mix from an account's public repositories. */
async function publicLanguages(user: string, token?: string): Promise<[string, number][]> {
  const res = await fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`, {
    headers: headers(token),
    next: { revalidate },
  });
  if (!res.ok) return [];

  const repos: { languages_url: string; fork: boolean }[] = await res.json();
  const bytes = new Map<string, number>();

  await pool(repos.filter((r) => !r.fork), 8, async (r) => {
    const lr = await fetch(r.languages_url, { headers: headers(token), next: { revalidate } });
    if (!lr.ok) return;
    const langs: Record<string, number> = await lr.json();
    for (const [name, n] of Object.entries(langs)) {
      bytes.set(name, (bytes.get(name) ?? 0) + n);
    }
  });

  return asPercent(bytes);
}

/**
 * The contribution calendar is GraphQL-only and needs a token. With one, it
 * covers a full year and includes private contributions when the account has
 * opted into showing them — as daily counts, which name nothing. Without a
 * token we reconstruct roughly ninety days from public events instead.
 */
async function contributions(user: string, token?: string): Promise<Contrib | null> {
  if (token) {
    const query = `query($u: String!) {
      user(login: $u) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks { contributionDays { date contributionCount } }
          }
        }
      }
    }`;
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { u: user } }),
      next: { revalidate },
    });
    if (res.ok) {
      const json = await res.json();
      const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
      if (cal) {
        const days: [string, number][] = cal.weeks.flatMap(
          (w: { contributionDays: { date: string; contributionCount: number }[] }) =>
            w.contributionDays.map((d) => [d.date, d.contributionCount] as [string, number])
        );
        return { days, total: cal.totalContributions, source: "graphql" };
      }
    }
  }

  const res = await fetch(`https://api.github.com/users/${user}/events/public?per_page=100`, {
    headers: headers(token),
    next: { revalidate },
  });
  if (!res.ok) return null;

  const events: { type: string; created_at: string; payload?: { size?: number } }[] = await res.json();
  const counts = new Map<string, number>();
  for (const e of events) {
    const day = e.created_at.slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + (e.type === "PushEvent" ? e.payload?.size ?? 1 : 1));
  }

  const days: [string, number][] = [];
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 89);
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    days.push([key, counts.get(key) ?? 0]);
  }
  return { days, total: [...counts.values()].reduce((a, b) => a + b, 0), source: "events" };
}

async function account({ user, label, token }: Cfg): Promise<Account> {
  const base: Account = {
    user,
    label,
    repos: null,
    stars: null,
    followers: null,
    languages: [],
    languageSource: null,
    top: [],
    contrib: null,
  };

  const [uRes, rRes, contrib] = await Promise.all([
    fetch(`https://api.github.com/users/${user}`, { headers: headers(token), next: { revalidate } }),
    fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`, {
      headers: headers(token),
      next: { revalidate },
    }),
    contributions(user, token),
  ]);

  base.contrib = contrib;

  if (uRes.ok) {
    const u = await uRes.json();
    base.followers = u.followers ?? 0;
  }

  const publicRepos: {
    name: string; description: string | null; stargazers_count: number;
    language: string | null; html_url: string; pushed_at: string; fork: boolean;
  }[] = rRes.ok ? await rRes.json() : [];
  const own = publicRepos.filter((r) => !r.fork);

  if (own.length) {
    base.repos = own.length;
    base.stars = own.reduce((a, r) => a + (r.stargazers_count ?? 0), 0);
    base.top = own
      .sort((a, b) => b.stargazers_count - a.stargazers_count || b.pushed_at.localeCompare(a.pushed_at))
      .slice(0, 6)
      .map((r) => ({
        name: r.name,
        description: r.description,
        stars: r.stargazers_count,
        language: r.language,
        url: r.html_url,
      }));
    base.languages = await publicLanguages(user, token);
    base.languageSource = base.languages.length ? "public" : null;
  } else if (token) {
    // Nothing public, but the token can see the private side. Percentages only.
    base.languages = await privateLanguages(token);
    base.languageSource = base.languages.length ? "private" : null;
  }

  return base;
}

async function leetcode(): Promise<Stats["leetcode"]> {
  const user = handle(config.contact.leetcode);
  const query = `query($u: String!) {
    matchedUser(username: $u) {
      profile { ranking }
      submitStatsGlobal { acSubmissionNum { difficulty count } }
    }
  }`;
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
    body: JSON.stringify({ query, variables: { u: user } }),
    next: { revalidate },
  });
  if (!res.ok) return null;

  const json = await res.json();
  const m = json?.data?.matchedUser;
  if (!m) return null;

  const nums: { difficulty: string; count: number }[] = m.submitStatsGlobal?.acSubmissionNum ?? [];
  return {
    user,
    total: nums.find((n) => n.difficulty === "All")?.count ?? 0,
    byLevel: nums.filter((n) => n.difficulty !== "All").map((n) => [n.difficulty, n.count]),
    ranking: m.profile?.ranking ?? null,
  };
}

export async function GET() {
  // One failing source shouldn't take the others down with it.
  const [accounts, lc] = await Promise.all([
    Promise.all(ACCOUNTS.map((a) => account(a).catch(() => null))),
    leetcode().catch(() => null),
  ]);

  const body: Stats = {
    accounts: accounts.filter((a): a is Account => a !== null),
    leetcode: lc,
  };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}

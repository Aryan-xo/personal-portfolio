import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export const revalidate = 3600;

const handle = (url: string) => url.replace(/\/+$/, "").split("/").pop() ?? "";
const GH_USER = handle(config.contact.github);
const LC_USER = handle(config.contact.leetcode);

export type Contrib = {
  /** ISO date → count, oldest first. */
  days: [string, number][];
  total: number;
  /** Full year via the GraphQL API, or ~90 days derived from public events. */
  source: "graphql" | "events";
};

export type Stats = {
  github: {
    user: string;
    repos: number;
    followers: number;
    stars: number;
    languages: [string, number][];
    top: { name: string; description: string | null; stars: number; language: string | null; url: string }[];
    updated: string | null;
  } | null;
  leetcode: { user: string; total: number; byLevel: [string, number][]; ranking: number | null } | null;
  contrib: Contrib | null;
};

async function github(): Promise<Stats["github"]> {
  // Unauthenticated requests are rate-limited per IP; a token lifts that on
  // deploys where one is configured.
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "portfolio",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
  const opts = { headers, next: { revalidate } };

  const [uRes, rRes] = await Promise.all([
    fetch(`https://api.github.com/users/${GH_USER}`, opts),
    fetch(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed`, opts),
  ]);
  if (!uRes.ok || !rRes.ok) return null;

  const u = await uRes.json();
  const repos: Record<string, never>[] = await rRes.json();
  const own = repos.filter((r: Record<string, unknown>) => !r.fork);

  const langs = new Map<string, number>();
  let stars = 0;
  for (const r of own as unknown as { language: string | null; stargazers_count: number }[]) {
    stars += r.stargazers_count ?? 0;
    if (r.language) langs.set(r.language, (langs.get(r.language) ?? 0) + 1);
  }

  const top = (own as unknown as {
    name: string; description: string | null; stargazers_count: number;
    language: string | null; html_url: string; pushed_at: string;
  }[])
    .sort((a, b) => b.stargazers_count - a.stargazers_count || b.pushed_at.localeCompare(a.pushed_at))
    .slice(0, 6)
    .map((r) => ({
      name: r.name,
      description: r.description,
      stars: r.stargazers_count,
      language: r.language,
      url: r.html_url,
    }));

  const updated = (own as unknown as { pushed_at: string }[])
    .map((r) => r.pushed_at)
    .sort()
    .at(-1) ?? null;

  return {
    user: GH_USER,
    repos: own.length,
    followers: u.followers ?? 0,
    stars,
    languages: [...langs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
    top,
    updated,
  };
}

async function leetcode(): Promise<Stats["leetcode"]> {
  const query = `query($u: String!) {
    matchedUser(username: $u) {
      profile { ranking }
      submitStatsGlobal { acSubmissionNum { difficulty count } }
    }
  }`;
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
    body: JSON.stringify({ query, variables: { u: LC_USER } }),
    next: { revalidate },
  });
  if (!res.ok) return null;

  const json = await res.json();
  const m = json?.data?.matchedUser;
  if (!m) return null;

  const nums: { difficulty: string; count: number }[] = m.submitStatsGlobal?.acSubmissionNum ?? [];
  const all = nums.find((n) => n.difficulty === "All")?.count ?? 0;
  return {
    user: LC_USER,
    total: all,
    byLevel: nums.filter((n) => n.difficulty !== "All").map((n) => [n.difficulty, n.count]),
    ranking: m.profile?.ranking ?? null,
  };
}

/**
 * The contribution calendar is GraphQL-only and needs a token. Without one we
 * reconstruct what we can from public events, which reach back about 90 days —
 * the response says which, so the UI can label it honestly.
 */
async function contributions(): Promise<Contrib | null> {
  const token = process.env.GITHUB_TOKEN;

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
      body: JSON.stringify({ query, variables: { u: GH_USER } }),
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

  const res = await fetch(`https://api.github.com/users/${GH_USER}/events/public?per_page=100`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "portfolio" },
    next: { revalidate },
  });
  if (!res.ok) return null;

  const events: { type: string; created_at: string; payload?: { size?: number } }[] = await res.json();
  const counts = new Map<string, number>();
  for (const e of events) {
    const day = e.created_at.slice(0, 10);
    const n = e.type === "PushEvent" ? e.payload?.size ?? 1 : 1;
    counts.set(day, (counts.get(day) ?? 0) + n);
  }

  // Fill every day in the window, so the grid has no gaps.
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

export async function GET() {
  // One failing provider shouldn't take the other down with it.
  const [gh, lc, cn] = await Promise.allSettled([github(), leetcode(), contributions()]);
  const body: Stats = {
    github: gh.status === "fulfilled" ? gh.value : null,
    leetcode: lc.status === "fulfilled" ? lc.value : null,
    contrib: cn.status === "fulfilled" ? cn.value : null,
  };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}

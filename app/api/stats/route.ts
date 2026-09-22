import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export const revalidate = 3600;

const handle = (url: string) => url.replace(/\/+$/, "").split("/").pop() ?? "";
const GH_USER = handle(config.contact.github);
const LC_USER = handle(config.contact.leetcode);

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

export async function GET() {
  // One failing provider shouldn't take the other down with it.
  const [gh, lc] = await Promise.allSettled([github(), leetcode()]);
  const body: Stats = {
    github: gh.status === "fulfilled" ? gh.value : null,
    leetcode: lc.status === "fulfilled" ? lc.value : null,
  };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}

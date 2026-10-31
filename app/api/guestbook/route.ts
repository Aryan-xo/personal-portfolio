import { NextResponse, type NextRequest } from "next/server";

export type Note = { name: string; message: string; at: string };
export type Guestbook = { open: boolean; notes: Note[] };

/*
 * Notes live in a Redis list, newest first, through Upstash's REST API — a
 * fetch per command, so no client library and no connection to keep warm.
 * Installing Upstash from the Vercel Marketplace sets the KV_* pair; the
 * UPSTASH_* names are what Upstash's own console hands out.
 */
const URL_ = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const KEY = "guestbook";
const KEEP = 200;
const SHOW = 50;

async function redis<T>(...command: (string | number)[]): Promise<T> {
  const res = await fetch(URL_!, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`redis ${res.status}`);
  return (await res.json()).result as T;
}

export async function GET() {
  if (!URL_ || !TOKEN) return NextResponse.json({ open: false, notes: [] } satisfies Guestbook);
  try {
    const raw = await redis<string[]>("LRANGE", KEY, 0, SHOW - 1);
    const notes = raw.flatMap((r) => {
      try {
        return [JSON.parse(r) as Note];
      } catch {
        return [];
      }
    });
    return NextResponse.json({ open: true, notes } satisfies Guestbook);
  } catch {
    return NextResponse.json({ open: false, notes: [] } satisfies Guestbook);
  }
}

/** Collapse whitespace and drop control characters; the client is not trusted to. */
const clean = (s: unknown, max: number) =>
  typeof s === "string"
    ? s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
    : "";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  if (!URL_ || !TOKEN) return fail("The guestbook isn't open yet.", 503);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail("That didn't arrive in one piece.");
  }

  // A field no person can see. Anything that fills it in is a bot; it is told
  // the note was saved so it has no reason to try again.
  if (clean(body.website, 200)) return NextResponse.json({ ok: true });

  const name = clean(body.name, 40);
  const message = clean(body.message, 280);
  if (!name || !message) return fail("Both a name and a message, please.");
  // Links are nearly all of what a public guestbook attracts, and none of what
  // anyone means to leave on a portfolio.
  if (/https?:\/\/|www\.|\.(com|net|ru|xyz|io)\b/i.test(`${name} ${message}`)) {
    return fail("No links, sorry — it keeps the spam out.");
  }

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    // One note a minute from each address. SET NX fails if the key is still there.
    const first = await redis<string | null>("SET", `${KEY}:rate:${ip}`, 1, "NX", "EX", 60);
    if (first !== "OK") return fail("One note a minute — give it a moment.", 429);

    const note: Note = { name, message, at: new Date().toISOString() };
    await redis("LPUSH", KEY, JSON.stringify(note));
    await redis("LTRIM", KEY, 0, KEEP - 1);
    return NextResponse.json({ ok: true, note });
  } catch {
    return fail("Couldn't save that just now. Try again in a bit.", 502);
  }
}

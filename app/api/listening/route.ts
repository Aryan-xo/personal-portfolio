import { NextResponse } from "next/server";

export type Track = {
  title: string;
  artist: string;
  album: string;
  url: string;
  image: string | null;
};

export type Listening =
  | { configured: false }
  | { configured: true; playing: boolean; track: Track | null; playedAt: string | null };

/*
 * Cached at the CDN for half a minute: recent enough to feel live, and a busy
 * page doesn't spend Last.fm's rate limit one visitor at a time. A route
 * `revalidate` would do nothing here — the no-store fetch below makes the
 * handler dynamic regardless.
 */
const json = (body: Listening) =>
  NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });

/*
 * Last.fm rather than Spotify's own API, which since February 2026 only works
 * for an app owner on Premium. Spotify scrobbles to Last.fm once the accounts
 * are linked, free tier included, and reading a public profile's recent tracks
 * needs nothing more than an API key.
 */
const { LASTFM_API_KEY: key, LASTFM_USER: user } = process.env;

// Last.fm's grey star, served when it has no artwork for a track.
const PLACEHOLDER = "2a96cbd8b46e442fc41c2b86b821562f";

type LastfmTrack = {
  name: string;
  artist: { "#text": string };
  album: { "#text": string };
  image: { size: string; "#text": string }[];
  date?: { uts: string };
  "@attr"?: { nowplaying?: string };
};

const toTrack = (t: LastfmTrack): Track => {
  const title = t.name;
  const artist = t.artist["#text"];
  const image = t.image.find((i) => i.size === "medium")?.["#text"] || null;
  return {
    title,
    artist,
    album: t.album["#text"],
    // Into Spotify rather than Last.fm: that's where a reader can press play.
    url: `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`,
    image: image && !image.includes(PLACEHOLDER) ? image : null,
  };
};

export async function GET() {
  if (!key || !user) return json({ configured: false });

  try {
    const url = new URL("https://ws.audioscrobbler.com/2.0/");
    url.search = new URLSearchParams({
      method: "user.getrecenttracks",
      user,
      api_key: key,
      format: "json",
      limit: "1",
    }).toString();

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`lastfm ${res.status}`);
    // The playing track, if any, comes first and carries no date.
    const t: LastfmTrack | undefined = (await res.json()).recenttracks?.track?.[0];
    if (!t) return json({ configured: true, playing: false, track: null, playedAt: null });

    return json({
      configured: true,
      playing: t["@attr"]?.nowplaying === "true",
      track: toTrack(t),
      playedAt: t.date ? new Date(Number(t.date.uts) * 1000).toISOString() : null,
    });
  } catch {
    return json({ configured: true, playing: false, track: null, playedAt: null });
  }
}

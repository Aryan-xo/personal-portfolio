"use client";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { config } from "@/lib/config";
import type { Widget as Kind } from "@/lib/commands";
import type { Listening } from "@/app/api/listening/route";
import type { Guestbook as Book, Note } from "@/app/api/guestbook/route";

/**
 * The parts of the terminal that are not text. Each one sits under the output
 * of the command that asked for it.
 *
 * Clicks are stopped at the edge: the terminal pulls focus back to its prompt
 * on any click, which would otherwise steal it from every form field here.
 */
export default function Widget({ kind }: { kind: Kind }) {
  return (
    <div className="widget" onClick={(e) => e.stopPropagation()}>
      {kind === "gallery" && <Gallery />}
      {kind === "guestbook" && <Guestbook />}
      {kind === "hire" && <Hire />}
      {kind === "music" && <Music />}
    </div>
  );
}

export function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const units: [number, string][] = [
    [60, "minute"], [60, "hour"], [24, "day"], [7, "week"], [4.35, "month"], [12, "year"],
  ];
  let n = s / 60;
  let unit = "minute";
  for (let i = 1; i < units.length && n >= units[i][0]; i++) {
    n /= units[i][0];
    unit = units[i][1];
  }
  const r = Math.floor(n);
  return `${r} ${unit}${r === 1 ? "" : "s"} ago`;
}

// ── Music ──────────────────────────────────────────────────

/** Shared by the command and the sidebar; refreshes once a minute while mounted. */
export function useListening(): Listening | null | undefined {
  const [data, setData] = useState<Listening | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    const load = () =>
      fetch("/api/listening")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => live && setData(d))
        .catch(() => live && setData(null));
    load();
    const t = setInterval(load, 60_000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);
  return data;
}

export function NowPlaying({ data, compact = false }: { data: Listening; compact?: boolean }) {
  if (!data.configured || !data.track) return null;
  const { track, playing, playedAt } = data;
  return (
    <a className={`np ${compact ? "np-compact" : ""}`} href={track.url} target="_blank" rel="noopener noreferrer">
      {track.image && (
        // Last.fm's CDN, already sized; not worth routing through the optimiser.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.image} alt="" width={compact ? 40 : 64} height={compact ? 40 : 64} />
      )}
      <span className="np-text">
        <span className="np-state dim">
          {playing ? <><span className="np-eq" aria-hidden /> playing now</> : `last played ${playedAt ? ago(playedAt) : ""}`}
        </span>
        <span className="np-title accent">{track.title}</span>
        <span className="np-artist">{track.artist}</span>
      </span>
    </a>
  );
}

function Music() {
  const data = useListening();
  if (data === undefined) return <p className="dim">  tuning in …</p>;
  if (!data || !data.configured) return <p className="dim">  Music isn&apos;t connected yet.</p>;
  if (!data.track) return <p className="dim">  Nothing played recently.</p>;
  return <NowPlaying data={data} />;
}

// ── Gallery ────────────────────────────────────────────────

function Gallery() {
  const photos = config.gallery;
  const [open, setOpen] = useState<number | null>(null);

  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length)),
    [photos.length]
  );

  const isOpen = open !== null;
  // Hand the keyboard back to the prompt on close, so the next thing typed
  // lands somewhere.
  useEffect(() => {
    if (!isOpen) return;
    return () => (document.querySelector(".inputrow input") as HTMLInputElement | null)?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (open === null) return;
    // Capture phase, so the terminal's own key handling never sees these.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, step]);

  const p = open === null ? null : photos[open];

  return (
    <>
      <div className="gallery">
        {photos.map((ph, i) => (
          <button key={ph.src} className="gallery-item" onClick={() => setOpen(i)} aria-label={`Open ${ph.caption ?? ph.alt}`}>
            <Image src={ph.src} alt={ph.alt} fill sizes="(max-width: 820px) 45vw, 240px" />
            {ph.caption && <span className="gallery-cap">{ph.caption}</span>}
          </button>
        ))}
      </div>

      {p &&
        createPortal(
          <div className="lightbox" role="dialog" aria-modal aria-label={p.alt} onClick={() => setOpen(null)}>
            <figure onClick={(e) => e.stopPropagation()}>
              <div className="lightbox-img">
                <Image src={p.src} alt={p.alt} fill sizes="92vw" priority />
              </div>
              <figcaption>
                <span className="accent">{p.caption ?? p.alt}</span>
                <span className="dim">{[p.place, p.date].filter(Boolean).join(" · ")}</span>
                {p.exif && (
                  <span className="dim exif">
                    {[p.exif.camera, p.exif.focal, p.exif.aperture, p.exif.shutter, p.exif.iso && `ISO ${p.exif.iso}`]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </span>
                )}
                {photos.length > 1 && <span className="dim">{open! + 1} / {photos.length}</span>}
              </figcaption>
            </figure>
            {photos.length > 1 && (
              <>
                <button className="lightbox-nav prev" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="Previous photo">←</button>
                <button className="lightbox-nav next" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="Next photo">→</button>
              </>
            )}
            <button className="lightbox-close" onClick={() => setOpen(null)} aria-label="Close">esc ✕</button>
          </div>,
          document.body
        )}
    </>
  );
}

// ── Guestbook ──────────────────────────────────────────────

function Guestbook() {
  const [book, setBook] = useState<Book | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<{ busy?: boolean; error?: string; sent?: boolean }>({});

  useEffect(() => {
    fetch("/api/guestbook")
      .then((r) => (r.ok ? r.json() : null))
      .then(setBook)
      .catch(() => setBook(null));
  }, []);

  const sign = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ busy: true });
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, website }),
      });
      const body = await res.json();
      if (!res.ok) return setState({ error: body.error ?? "Something went wrong." });
      if (body.note) setBook((b) => b && { ...b, notes: [body.note as Note, ...b.notes] });
      setMessage("");
      setState({ sent: true });
    } catch {
      setState({ error: "Couldn't reach the server." });
    }
  };

  if (book === undefined) return <p className="dim">  opening the book …</p>;
  if (!book || !book.open) return <p className="dim">  The guestbook isn&apos;t open yet.</p>;

  return (
    <div className="guestbook">
      <form className="form" onSubmit={sign}>
        <label>
          <span className="dim">name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required autoComplete="name" />
        </label>
        <label>
          <span className="dim">message</span>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={280} rows={3} required />
        </label>
        {/* Hidden from people, not from bots. */}
        <input className="hp" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" aria-hidden />
        <div className="form-row">
          <button type="submit" disabled={state.busy}>{state.busy ? "signing …" : "sign the guestbook"}</button>
          <span className="dim">{message.length}/280</span>
          {state.error && <span className="err">{state.error}</span>}
          {state.sent && <span className="accent">Thanks — you&apos;re in.</span>}
        </div>
      </form>

      {book.notes.length ? (
        <ul className="notes">
          {book.notes.map((n, i) => (
            <li key={`${n.at}-${i}`}>
              <span className="accent">{n.name}</span> <span className="dim">· {ago(n.at)}</span>
              <p>{n.message}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="dim">No notes yet. Be the first.</p>
      )}
    </div>
  );
}

// ── Hire ───────────────────────────────────────────────────

function Hire() {
  const [f, setF] = useState({ name: "", company: "", role: "", message: "" });
  const [copied, setCopied] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((x) => ({ ...x, [k]: e.target.value }));

  // No server and no form service: it writes the email and the reader's own
  // mail app sends it, so nothing can go missing in between.
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `${f.role || "An opportunity"}${f.company ? ` at ${f.company}` : ""}`;
    const body = [
      `Hi ${config.identity.name.split(" ")[0]},`,
      "",
      f.message || "I came across your portfolio and would like to talk.",
      "",
      ...(f.role ? [`Role: ${f.role}`] : []),
      ...(f.company ? [`Company: ${f.company}`] : []),
      "",
      f.name,
    ].join("\n");
    window.location.href = `mailto:${config.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(config.contact.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className="hire">
      <form className="form" onSubmit={send}>
        <div className="form-grid">
          <label>
            <span className="dim">your name</span>
            <input value={f.name} onChange={set("name")} autoComplete="name" required />
          </label>
          <label>
            <span className="dim">company</span>
            <input value={f.company} onChange={set("company")} autoComplete="organization" />
          </label>
          <label>
            <span className="dim">role (optional)</span>
            <input value={f.role} onChange={set("role")} />
          </label>
        </div>
        <label>
          <span className="dim">message</span>
          <textarea value={f.message} onChange={set("message")} rows={3} placeholder="A line or two about the role is plenty." />
        </label>
        <div className="form-row">
          <button type="submit">write the email →</button>
          <a className="btn" href={config.resumeUrl} target="_blank" rel="noopener noreferrer">resume.pdf</a>
          <a className="btn" href={config.contact.linkedin} target="_blank" rel="noopener noreferrer">linkedin</a>
          <button type="button" onClick={copy}>{copied ? "copied ✓" : "copy email"}</button>
        </div>
      </form>
    </div>
  );
}

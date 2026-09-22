"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { config } from "@/lib/config";
import { themes, defaultTheme } from "@/lib/themes";
import { runCommand, completions, linkable, type Line } from "@/lib/commands";
import { setWrap } from "@/lib/render";
import * as audio from "@/lib/audio";
import { tours } from "@/lib/tours";
import AsciiPortrait from "./AsciiPortrait";
import MatrixRain from "./MatrixRain";
import StreamedLines from "./StreamedLines";
import Sidebar from "./Sidebar";
import Screensaver from "./Screensaver";
import Resizer from "./Resizer";
import ThemePicker from "./ThemePicker";
import type { Stats } from "@/app/api/stats/route";

/**
 * A block keeps the command that produced it, not the text. Output is wrapped
 * to a column count that depends on the viewport, so the lines have to be
 * derivable again when the window changes size.
 */
type Block = { id: number; prompt?: string; cmd?: string; lines?: Line[] };

const QUICK = [
  "about",
  "experience",
  "timeline",
  "gh",
  "research",
  "projects",
  "finance",
  "skills",
  "achievements",
  "leadership",
  "education",
  "certifications",
  "interests",
  "contact",
  "resume",
];

export default function Terminal() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [theme, setTheme] = useState(defaultTheme.name);
  // undefined while in flight, null if the endpoint failed.
  const [stats, setStats] = useState<Stats | null | undefined>(undefined);
  const [crt, setCrt] = useState(true);
  const [cols, setCols] = useState(96);
  const [sound, setSound] = useState(false);
  const touring = useRef(false);
  const settled = useRef(0);
  const [matrix, setMatrix] = useState(false);
  const [idle, setIdle] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  // Inline suggestion: the remainder of the single best completion, shown as
  // ghost text after the cursor. Tab or → accepts it.
  const hits = completions(input);
  const ghost =
    hits.length && input && !input.endsWith(" ")
      ? hits[0].slice(input.trimStart().split(/\s+/).pop()!.length)
      : "";
  const endRef = useRef<HTMLDivElement>(null);

  /*
   * Preferences are written when the reader changes one, never from an effect
   * that watches the value. An effect keyed on state runs once with the
   * default before the stored value has been read, and in development React
   * invokes it twice — so the default gets saved over the stored preference
   * between the two restores, and the choice is lost on every reload.
   */
  const chooseTheme = useCallback((name: string) => {
    setTheme(name);
    try {
      localStorage.setItem("theme", name);
    } catch {}
  }, []);

  const chooseSound = useCallback((on: boolean) => {
    setSound(on);
    audio.setSound(on);
    try {
      localStorage.setItem("sound", on ? "on" : "off");
    } catch {}
    if (on) audio.powerOn();
  }, []);

  const chooseCrt = useCallback((on: boolean) => {
    setCrt(on);
    try {
      localStorage.setItem("crt", on ? "on" : "off");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved && themes.some((t) => t.name === saved)) setTheme(saved);
      setCrt(localStorage.getItem("crt") !== "off");
      const s = localStorage.getItem("sound") === "on";
      setSound(s);
      audio.setSound(s);
    } catch {}
  }, []);

  // Apply the theme as CSS variables.
  useEffect(() => {
    const t = themes.find((x) => x.name === theme) ?? defaultTheme;
    const r = document.documentElement.style;
    r.setProperty("--bg", t.bg);
    r.setProperty("--fg", t.fg);
    r.setProperty("--accent", t.accent);
    r.setProperty("--dim", t.dim);
    r.setProperty("--glow", t.glow);
    document.documentElement.classList.toggle("light", !!t.light);
    // Drives the scanlines, vignette and glow; `--scanline` comes with it.
    document.documentElement.classList.toggle("crt-dark", !t.light);
  }, [theme]);

  // `plain` lives on <html> so it also covers the ::before/::after overlays.
  useEffect(() => {
    document.documentElement.classList.toggle("plain", !crt);
  }, [crt]);

  /**
   * Keep the newest output in view. Sticks to the bottom only when the reader
   * is already there, so scrolling up to re-read something isn't yanked back
   * by the next streamed word.
   */
  const follow = useCallback((force = false) => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (!force && distance >= 140) return;
    // Decide against the current scroll position, but scroll after the next
    // paint — when output is skipped to the end, the taller content has not
    // been laid out yet at the moment this is called.
    requestAnimationFrame(() => {
      const e = scrollRef.current;
      if (e) e.scrollTop = e.scrollHeight;
    });
  }, []);

  useEffect(() => {
    follow(true);
  }, [blocks, follow]);

  const submit = useCallback(
    (raw: string) => {
      const line = raw.trim();
      const res = runCommand(line, { history, stats });

      if (line) setHistory((h) => [...h, line]);
      setHistIdx(-1);
      setInput("");

      if (res.clear) {
        setBlocks([]);
        const url = new URL(window.location.href);
        url.searchParams.delete("c");
        window.history.replaceState(null, "", url);
        return;
      }
      setBlocks((b) => [...b, { id: nextId.current++, prompt: line, cmd: line }]);

      // Reflect the last meaningful command in the URL, so the page can be
      // linked straight to a section.
      const verb = line.split(/\s+/)[0]?.toLowerCase();
      if (verb && linkable.has(verb)) {
        const url = new URL(window.location.href);
        url.searchParams.set("c", verb);
        window.history.replaceState(null, "", url);
      }

      if (res.setTheme) chooseTheme(res.setTheme);
      if (res.setCrt !== undefined) chooseCrt(res.setCrt);
      if (res.setSound !== undefined) chooseSound(res.setSound);
      if (res.tour) void runTour(res.tour);
      if (res.open) window.open(res.open, "_blank", "noopener,noreferrer");
      if (res.effect === "matrix") setMatrix(true);
      if (res.effect === "shake") {
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [history, stats, chooseTheme, chooseCrt, chooseSound]
  );

  /*
   * Stopping is armed a beat after the tour begins, and only while one is
   * running. Registering it globally killed any tour started from the prompt:
   * React's handler runs before the event reaches the window, so `tour` would
   * start the run and the same Enter keypress would then stop it.
   */
  const armStop = useCallback(() => {
    const stop = () => {
      touring.current = false;
    };
    const t = setTimeout(() => {
      for (const ev of ["keydown", "pointerdown"]) window.addEventListener(ev, stop);
    }, 250);
    return () => {
      clearTimeout(t);
      for (const ev of ["keydown", "pointerdown"]) window.removeEventListener(ev, stop);
    };
  }, []);

  /**
   * Types a sequence into the prompt as though someone were at the keyboard,
   * waiting for each command's output to settle before starting the next. Any
   * key or click stops it, since a visitor who has decided to drive should not
   * have to fight the demo.
   */
  const runTour = useCallback(
    async (commands: string[]) => {
      if (touring.current) return;
      touring.current = true;
      const disarm = armStop();

      const wait = (ms: number) =>
        new Promise((r) => setTimeout(r, ms));
      const stopped = () => !touring.current;

      await wait(700);
      for (const cmd of commands) {
        if (stopped()) break;
        for (const ch of cmd) {
          if (stopped()) break;
          setInput((v) => v + ch);
          audio.key(true);
          await wait(45 + Math.random() * 65);
        }
        if (stopped()) break;
        await wait(260);
        audio.enterKey();

        const before = settled.current;
        submit(cmd);

        // Wait for the streamed output, with a ceiling in case it never lands.
        const until = Date.now() + 6000;
        while (settled.current === before && Date.now() < until && !stopped()) {
          await wait(80);
        }
        await wait(650);
      }
      touring.current = false;
      disarm();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );



  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    follow(true);
    if (e.key === "Enter") audio.enterKey();
    else if (e.key.length === 1 || e.key === "Backspace") audio.key();

    // `/` on an empty prompt jumps to the sidebar search, the way it does in
    // less and vim.
    if (e.key === "/" && !input) {
      const box = document.getElementById("side-search") as HTMLInputElement | null;
      if (box) {
        e.preventDefault();
        box.focus();
        return;
      }
    }
    if (e.key === "Enter") {
      submit(input);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const i = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(i);
      setInput(history[i]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx < 0) return;
      const i = histIdx + 1;
      if (i >= history.length) {
        setHistIdx(-1);
        setInput("");
      } else {
        setHistIdx(i);
        setInput(history[i]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (ghost) {
        setInput(input + ghost + (hits.length === 1 ? " " : ""));
      } else if (hits.length > 1) {
        setBlocks((b) => [
          ...b,
          { id: nextId.current++, prompt: input, lines: [{ text: "  " + hits.join("  ") }] },
        ]);
      }
    } else if (e.key === "ArrowRight" && ghost) {
      const el = e.currentTarget;
      if (el.selectionStart === input.length && el.selectionEnd === input.length) {
        e.preventDefault();
        setInput(input + ghost);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setBlocks([]);
    }
  };

  const focus = () => {
    inputRef.current?.focus();
  };

  // Re-wrap every block when the column count changes. Rendering a command is
  // pure — the side effects ran when it was submitted — so this is safe.
  const rendered = useMemo(() => {
    // Set the column count before anything is formatted with it.
    setWrap(cols);
    return blocks.map((b) =>
      b.cmd !== undefined ? runCommand(b.cmd, { history, stats }).lines : b.lines!
    );
  }, [blocks, cols, history, stats]);

  // Measure how many characters fit and wrap output to match.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Fixed, so the probe never contributes to the document's scroll width —
    // absolutely positioned it resolved against the viewport and widened the
    // page by its own length.
    const probe = document.createElement("span");
    probe.textContent = "0".repeat(100);
    probe.style.cssText =
      "position:fixed;top:0;left:0;visibility:hidden;white-space:pre;pointer-events:none;";
    el.appendChild(probe);

    const measure = () => {
      const chWidth = probe.getBoundingClientRect().width / 100;
      if (!chWidth) return;
      const fit = Math.floor(el.clientWidth / chWidth) - 1; // spare a column for the scrollbar
      setCols((prev) => (Math.abs(prev - fit) < 2 ? prev : fit));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
      probe.remove();
    };
  }, []);

  // Drift into the screensaver after a couple of minutes untouched.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      setIdle(false);
      clearTimeout(timer);
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
      timer = setTimeout(() => setIdle(true), 120_000);
    };
    reset();
    for (const ev of ["keydown", "pointerdown", "pointermove", "wheel"]) {
      window.addEventListener(ev, reset, { passive: true });
    }
    return () => {
      clearTimeout(timer);
      for (const ev of ["keydown", "pointerdown", "pointermove", "wheel"]) {
        window.removeEventListener(ev, reset);
      }
    };
  }, []);

  // Warm the live stats so `gh` answers instantly. The response is cached for
  // an hour, so this costs nothing on repeat visits.
  useEffect(() => {
    let live = true;
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && setStats(d))
      .catch(() => live && setStats(null));
    return () => {
      live = false;
    };
  }, []);

  // Open straight to a section when the URL asks for one.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    const q = new URLSearchParams(window.location.search);
    const play = q.get("play")?.toLowerCase();
    if (play && tours[play]) {
      void runTour([...tours[play].commands]);
      return;
    }
    const c = q.get("c");
    if (c && linkable.has(c.toLowerCase())) submit(c.toLowerCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ⌘K / Ctrl+K reaches the search from anywhere.
  useEffect(() => {
    const onHotkey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
      const box = document.getElementById("side-search") as HTMLInputElement | null;
      if (!box) return;
      e.preventDefault();
      box.focus();
      box.select();
    };
    window.addEventListener("keydown", onHotkey);
    return () => window.removeEventListener("keydown", onHotkey);
  }, []);

  return (
    <div className="shell">
    <div className={`term ${shake ? "shake" : ""}`} onClick={focus}>
      {matrix && <MatrixRain onDone={() => setMatrix(false)} />}
      {idle && <Screensaver onWake={() => setIdle(false)} />}

      {/* Everything that scrolls lives here; the prompt below stays pinned. */}
      <div className="scroll" ref={scrollRef}>
        <header className="header">
          <AsciiPortrait />
          <div className="headline">
            <h1 className="glowtext">{config.identity.name}</h1>
            <p className="accent">{config.identity.headline}</p>
            <p className="accent">{config.identity.location}</p>
            <p className="dim">{config.identity.tagline}</p>
            <p className="hint">
              Type <span className="accent">help</span> and press Enter.
            </p>
            <ThemePicker
              theme={theme}
              onTheme={chooseTheme}
              crt={crt}
              onCrt={chooseCrt}
              sound={sound}
              onSound={chooseSound}
            />
          </div>
        </header>

        {blocks.map((b, i) => (
          <div key={b.id} className="block">
            {b.prompt !== undefined && (
              <div className="echo">
                <Prompt />
                <span>{b.prompt}</span>
              </div>
            )}
            {/* Only the newest block streams; earlier ones have already settled. */}
            <StreamedLines
              lines={rendered[i]}
              stream={i === blocks.length - 1}
              // Soft while streaming, so scrolling up mid-flow isn't fought;
              // forced on completion, so finished output always lands at the
              // prompt.
              onProgress={() => follow()}
              onDone={() => {
                follow(true);
                settled.current += 1;
              }}
            />
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="inputrow">
        <Prompt />
        <span className="typed">{input}</span>
        <span className="cursor" />
        {ghost && <span className="ghost">{ghost}</span>}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            follow(true);
          }}
          onKeyDown={onKey}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          aria-label="terminal input"
        />
      </div>

      <nav className="chips" aria-label="quick commands">
        {QUICK.map((c) => (
          <button key={c} onClick={() => submit(c)}>
            {c}
          </button>
        ))}
      </nav>
    </div>

    <Resizer />

    <Sidebar
      stats={stats}
      onRun={(cmd) => {
        submit(cmd);
        focus();
      }}
    />
    </div>
  );
}

function Prompt() {
  return (
    <span className="ps1">
      <span className="accent">
        {config.user}@{config.host}
      </span>
      <span className="dim">:</span>
      <span className="path">~</span>
      <span className="dim">$&nbsp;</span>
    </span>
  );
}

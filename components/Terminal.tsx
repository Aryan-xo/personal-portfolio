"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { config } from "@/lib/config";
import { themes, defaultTheme } from "@/lib/themes";
import { runCommand, completions, type Line } from "@/lib/commands";
import AsciiPortrait from "./AsciiPortrait";
import MatrixRain from "./MatrixRain";
import StreamedLines from "./StreamedLines";

type Block = { id: number; prompt?: string; lines: Line[] };

const QUICK = [
  "about",
  "experience",
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
  const [crt, setCrt] = useState(true);
  const [matrix, setMatrix] = useState(false);
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

  // Apply theme as CSS variables.
  useEffect(() => {
    const t = themes.find((x) => x.name === theme) ?? defaultTheme;
    const r = document.documentElement.style;
    r.setProperty("--bg", t.bg);
    r.setProperty("--fg", t.fg);
    r.setProperty("--accent", t.accent);
    r.setProperty("--dim", t.dim);
    r.setProperty("--glow", t.glow);
    r.setProperty("--scanline", t.light ? "0" : "0.10");
    document.documentElement.classList.toggle("light", !!t.light);
    try {
      localStorage.setItem("theme", t.name);
    } catch {}
  }, [theme]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved && themes.some((t) => t.name === saved)) setTheme(saved);
      setCrt(localStorage.getItem("crt") !== "off");
    } catch {}
  }, []);

  // `plain` lives on <html> so it also covers the ::before/::after overlays.
  useEffect(() => {
    document.documentElement.classList.toggle("plain", !crt);
    try {
      localStorage.setItem("crt", crt ? "on" : "off");
    } catch {}
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
      const res = runCommand(line, { history });

      if (line) setHistory((h) => [...h, line]);
      setHistIdx(-1);
      setInput("");

      if (res.clear) {
        setBlocks([]);
        return;
      }
      setBlocks((b) => [...b, { id: nextId.current++, prompt: line, lines: res.lines }]);

      if (res.setTheme) setTheme(res.setTheme);
      if (res.setCrt !== undefined) setCrt(res.setCrt);
      if (res.open) window.open(res.open, "_blank", "noopener,noreferrer");
      if (res.effect === "matrix") setMatrix(true);
      if (res.effect === "shake") {
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    },
    [history]
  );

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    follow(true);
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

  return (
    <div className={`term ${shake ? "shake" : ""}`} onClick={focus}>
      {matrix && <MatrixRain onDone={() => setMatrix(false)} />}

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
              {" "}Hard to read? <span className="accent">crt off</span>.
            </p>
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
              lines={b.lines}
              stream={i === blocks.length - 1}
              // Soft while streaming, so scrolling up mid-flow isn't fought;
              // forced on completion, so finished output always lands at the
              // prompt.
              onProgress={() => follow()}
              onDone={() => follow(true)}
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

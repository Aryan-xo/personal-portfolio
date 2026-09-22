"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { config } from "@/lib/config";
import { themes, defaultTheme } from "@/lib/themes";
import { runCommand, completions, type Line } from "@/lib/commands";
import AsciiPortrait from "./AsciiPortrait";
import MatrixRain from "./MatrixRain";

type Block = { prompt?: string; lines: Line[] };

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
  const [matrix, setMatrix] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    try {
      localStorage.setItem("theme", t.name);
    } catch {}
  }, [theme]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved && themes.some((t) => t.name === saved)) setTheme(saved);
    } catch {}
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [blocks]);

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
      setBlocks((b) => [...b, { prompt: line, lines: res.lines }]);

      if (res.setTheme) setTheme(res.setTheme);
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
        setBlocks((b) => [...b, { prompt: input, lines: [{ text: "  " + hits.join("  ") }] }]);
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

  const focus = () => inputRef.current?.focus();

  return (
    <div className={`term ${shake ? "shake" : ""}`} onClick={focus}>
      {matrix && <MatrixRain onDone={() => setMatrix(false)} />}

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
        </div>
      </header>

      <div className="scroll">
        {blocks.map((b, i) => (
          <div key={i} className="block">
            {b.prompt !== undefined && (
              <div className="echo">
                <Prompt />
                <span>{b.prompt}</span>
              </div>
            )}
            {b.lines.map((l, j) => (
              <div key={j} className={l.cls ?? ""}>
                {l.text || " "}
              </div>
            ))}
          </div>
        ))}

        <div className="inputrow">
          <Prompt />
          <span className="typed">{input}</span>
          <span className="cursor" />
          {ghost && <span className="ghost">{ghost}</span>}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            aria-label="terminal input"
          />
        </div>
        <div ref={endRef} />
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

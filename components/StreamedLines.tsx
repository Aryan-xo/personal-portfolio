"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Line } from "@/lib/commands";

type Chunk = { line: number; text: string };

/** Split output into word-sized chunks, keeping each word's leading indent. */
function toChunks(lines: Line[]): Chunk[] {
  const out: Chunk[] = [];
  lines.forEach((l, i) => {
    const parts = l.text.match(/\s*\S+|\s+/g);
    if (!parts) {
      out.push({ line: i, text: "" }); // a blank line still costs a beat
      return;
    }
    for (const text of parts) out.push({ line: i, text });
  });
  return out;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Reveals output a word at a time, the way a model's response lands rather than
 * a fixed-rate typewriter: short words arrive in bursts, punctuation draws a
 * breath, and the whole run is budgeted so long output never outstays it.
 */
export default function StreamedLines({
  lines,
  stream,
  onProgress,
  onDone,
}: {
  lines: Line[];
  stream: boolean;
  onProgress?: () => void;
  onDone?: () => void;
}) {
  const chunks = useMemo(() => toChunks(lines), [lines]);
  const [shown, setShown] = useState(stream ? 0 : chunks.length);
  const done = shown >= chunks.length;

  // A speed multiplier that divides the per-chunk delay, so a long block lands
  // in roughly the same time as a short one instead of running for half a
  // minute. Short output stays at 1x and keeps its unhurried cadence.
  const rate = useMemo(() => {
    const budget = 1800; // ms to finish a block
    const naive = chunks.length * 26; // ms it would take at 1x
    return Math.max(1, Math.min(14, naive / budget));
  }, [chunks.length]);

  useEffect(() => {
    if (!stream || prefersReducedMotion()) {
      setShown(chunks.length);
      onDone?.();
      return;
    }
    setShown(0);
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      // Emit a small burst per tick; a real stream does not arrive one word at
      // a time on a metronome. Faster blocks take bigger bites, which also
      // keeps the number of React renders down.
      const burst = 1 + Math.floor(Math.random() * 2) + Math.floor(rate / 4);
      i = Math.min(chunks.length, i + burst);
      setShown(i);
      onProgress?.();
      if (i >= chunks.length) {
        onDone?.();
        return;
      }
      const tail = chunks[i - 1]?.text ?? "";
      const pause = /[.!?:]$/.test(tail) ? 90 : /,$/.test(tail) ? 45 : 0;
      const delay = (16 + tail.length * 1.6 + Math.random() * 14 + pause) / rate;
      timer = setTimeout(step, delay);
    };
    timer = setTimeout(step, 30);

    const skip = () => {
      clearTimeout(timer);
      i = chunks.length;
      setShown(i);
      onDone?.();
    };

    // Register on the next macrotask. The keystroke that submitted the command
    // is still bubbling when this effect runs, and would otherwise skip the
    // stream it just started.
    const arm = setTimeout(() => {
      window.addEventListener("keydown", skip);
      window.addEventListener("pointerdown", skip);
    }, 0);

    return () => {
      clearTimeout(timer);
      clearTimeout(arm);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunks, stream, rate]);

  const visible = useRef<string[]>([]);
  visible.current = [];
  let lastLine = -1;
  for (let i = 0; i < shown; i++) {
    const c = chunks[i];
    visible.current[c.line] = (visible.current[c.line] ?? "") + c.text;
    lastLine = c.line;
  }

  return (
    <>
      {lines.slice(0, lastLine + 1).map((l, i) => (
        <div key={i} className={l.cls ?? ""}>
          {visible.current[i] || " "}
          {!done && i === lastLine && <span className="stream-caret" />}
        </div>
      ))}
    </>
  );
}

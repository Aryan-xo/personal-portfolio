"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const KEY = "sidebar-width";
const MIN = 320;
const DEFAULT = 0.34; // share of the window, used until someone drags

const maxWidth = () => Math.min(window.innerWidth * 0.62, 960);
const clamp = (n: number) => Math.max(MIN, Math.min(maxWidth(), n));

/**
 * The divider between the terminal and the sidebar. Width lives in a CSS
 * variable on `.shell`, so dragging never re-renders the panes it sits
 * between — only the grid template changes.
 */
export default function Resizer() {
  const [width, setWidth] = useState<number | null>(null);
  const latest = useRef<number | null>(null);

  const apply = useCallback((w: number | null) => {
    const shell = document.querySelector<HTMLElement>(".shell");
    if (!shell) return;
    if (w === null) shell.style.removeProperty("--side-w");
    else shell.style.setProperty("--side-w", `${w}px`);
  }, []);

  useEffect(() => {
    let saved: number | null = null;
    try {
      const v = Number(localStorage.getItem(KEY));
      if (v) saved = clamp(v);
    } catch {}
    const w = saved ?? clamp(window.innerWidth * DEFAULT);
    setWidth(w);
    apply(w);

    // Keep a dragged width legal when the window changes size.
    const onResize = () => setWidth((prev) => (prev === null ? prev : clamp(prev)));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [apply]);

  useEffect(() => {
    if (width === null) return;
    latest.current = width;
    apply(width);
  }, [width, apply]);

  /* Saved on release rather than from an effect: settling on the width you
     started at is a no-op state update, which React skips, and the effect
     would never run to record it. */
  const save = useCallback((w: number | null) => {
    try {
      if (w === null) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, String(w));
    } catch {}
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    document.body.classList.add("resizing");

    const startX = e.clientX;
    const startW = width ?? clamp(window.innerWidth * DEFAULT);

    const move = (ev: PointerEvent) => {
      // Dragging left widens the sidebar, which is on the right.
      setWidth(clamp(startW - (ev.clientX - startX)));
    };
    const up = () => {
      document.body.classList.remove("resizing");
      el.releasePointerCapture(e.pointerId);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      save(latest.current);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 64 : 16;
    if (e.key === "ArrowLeft") setWidth((w) => { const n = clamp((w ?? MIN) + step); save(n); return n; });
    else if (e.key === "ArrowRight") setWidth((w) => { const n = clamp((w ?? MIN) - step); save(n); return n; });
    else if (e.key === "Home" || e.key === "Enter") reset();
    else return;
    e.preventDefault();
  };

  const reset = () => {
    save(null);
    setWidth(clamp(window.innerWidth * DEFAULT));
  };

  return (
    <div
      className="resizer"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar — arrow keys adjust, Home resets"
      aria-valuenow={width ?? undefined}
      aria-valuemin={MIN}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onDoubleClick={reset}
      title="Drag to resize · double-click to reset"
    >
      <span className="resizer-grip" />
    </div>
  );
}

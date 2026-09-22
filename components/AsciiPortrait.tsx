"use client";
import { useEffect, useRef, useState } from "react";
import { portrait, portraitShade } from "@/lib/portrait";

/**
 * Renders the ASCII portrait, revealing it line by line, and brightens the
 * characters under the pointer.
 *
 * The torch is a masked overlay positioned by CSS variables rather than
 * per-character state: the portrait is ~4,500 spans, and re-rendering them on
 * every mouse move would cost far more than the effect is worth.
 */
export default function AsciiPortrait({
  animate = true,
  speed = 18,
}: {
  animate?: boolean;
  speed?: number;
}) {
  const [shown, setShown] = useState(animate ? 0 : portrait.length);
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  useEffect(() => {
    if (!animate) return;
    const id = setInterval(
      () => setShown((n) => (n >= portrait.length ? (clearInterval(id), n) : n + 1)),
      speed
    );
    return () => clearInterval(id);
  }, [animate, speed]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
        // Fade the torch out as the pointer leaves the portrait's neighbourhood.
        const dx = Math.max(0, Math.max(r.left - e.clientX, e.clientX - r.right));
        const dy = Math.max(0, Math.max(r.top - e.clientY, e.clientY - r.bottom));
        const near = Math.hypot(dx, dy) < 160 ? 1 : 0;
        el.style.setProperty("--torch", String(near));
      });
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  const art = (
    <>
      {portrait.slice(0, shown).map((line, y) => (
        <div key={y} className="portrait-row">
          {line.split("").map((ch, x) => (
            <span key={x} style={{ opacity: 0.32 + (Number(portraitShade[y]?.[x] ?? 5) / 9) * 0.68 }}>
              {ch}
            </span>
          ))}
        </div>
      ))}
    </>
  );

  return (
    <div className="portrait-wrap" ref={ref}>
      <pre className="portrait" aria-label="ASCII portrait">
        {art}
      </pre>
      {/* A second copy at full brightness, revealed only inside the torch. */}
      <pre className="portrait portrait-torch" aria-hidden="true">
        {art}
      </pre>
    </div>
  );
}

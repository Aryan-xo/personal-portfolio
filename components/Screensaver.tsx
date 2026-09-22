"use client";
import { useEffect, useRef } from "react";
import { portrait } from "@/lib/portrait";

/**
 * After a spell of inactivity the portrait dissolves into drifting characters
 * and slowly reassembles. Any input dismisses it.
 */
export default function Screensaver({ onWake }: { onWake: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    let raf = 0;

    const CELL = 9;
    const rows = portrait.length;
    const cols = Math.max(...portrait.map((l) => l.length));

    type P = { x: number; y: number; hx: number; hy: number; ch: string; vx: number; vy: number };
    let parts: P[] = [];
    let offX = 0;
    let offY = 0;

    const layout = () => {
      cv.width = window.innerWidth * devicePixelRatio;
      cv.height = window.innerHeight * devicePixelRatio;
      cv.style.width = `${window.innerWidth}px`;
      cv.style.height = `${window.innerHeight}px`;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      offX = (window.innerWidth - cols * CELL) / 2;
      offY = (window.innerHeight - rows * CELL) / 2;
    };

    const seed = () => {
      parts = [];
      portrait.forEach((line, y) => {
        [...line].forEach((ch, x) => {
          if (ch === " ") return;
          const hx = offX + x * CELL;
          const hy = offY + y * CELL;
          parts.push({
            x: hx + (Math.random() - 0.5) * window.innerWidth * 0.9,
            y: hy + (Math.random() - 0.5) * window.innerHeight * 0.9,
            hx,
            hy,
            ch,
            vx: 0,
            vy: 0,
          });
        });
      });
    };

    layout();
    seed();

    const style = getComputedStyle(document.documentElement);
    const fg = style.getPropertyValue("--fg").trim() || "#7cf9a6";
    const bg = style.getPropertyValue("--bg").trim() || "#04120a";

    let t = 0;
    const draw = () => {
      t += 0.016;
      ctx.fillStyle = bg;
      ctx.globalAlpha = 0.22; // trails
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalAlpha = 1;
      ctx.font = `${CELL + 1}px ui-monospace, monospace`;
      ctx.fillStyle = fg;

      // Breathe: gather into the portrait, hold, scatter, repeat.
      const phase = (Math.sin(t * 0.22) + 1) / 2;
      for (const p of parts) {
        const pull = 0.006 + phase * 0.03;
        p.vx += (p.hx - p.x) * pull;
        p.vy += (p.hy - p.y) * pull;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.x += p.vx + Math.sin(t + p.hy * 0.05) * (1 - phase) * 0.6;
        p.y += p.vy + Math.cos(t + p.hx * 0.05) * (1 - phase) * 0.6;
        ctx.globalAlpha = 0.35 + phase * 0.65;
        ctx.fillText(p.ch, p.x, p.y);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      layout();
      seed();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="saver" onPointerDown={onWake}>
      <canvas ref={ref} />
      <p className="saver-hint dim">press any key</p>
    </div>
  );
}

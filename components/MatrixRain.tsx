"use client";
import { useEffect, useRef } from "react";

export default function MatrixRain({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    let raf = 0;
    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789";
    let cols: number[] = [];
    const size = 16;

    const resize = () => {
      cv.width = window.innerWidth;
      cv.height = window.innerHeight;
      cols = Array(Math.ceil(cv.width / size)).fill(0).map(() => Math.random() * -50);
    };
    resize();
    window.addEventListener("resize", resize);

    const start = Date.now();
    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.font = `${size}px ui-monospace, monospace`;
      cols.forEach((y, i) => {
        const ch = chars[(Math.random() * chars.length) | 0];
        ctx.fillStyle = Math.random() > 0.97 ? "#d7ffe4" : "#00ff41";
        ctx.fillText(ch, i * size, y * size);
        cols[i] = y * size > cv.height && Math.random() > 0.975 ? 0 : y + 1;
      });
      if (Date.now() - start > 6000) {
        window.removeEventListener("resize", resize);
        onDone();
        return;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    const skip = () => onDone();
    window.addEventListener("keydown", skip);
    window.addEventListener("click", skip);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("click", skip);
    };
  }, [onDone]);

  return <canvas ref={ref} className="fixed inset-0 z-50 bg-black cursor-pointer" />;
}

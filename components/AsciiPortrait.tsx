"use client";
import { useEffect, useState } from "react";
import { portrait, portraitShade } from "@/lib/portrait";

/** Renders the ASCII portrait, revealing it line by line. */
export default function AsciiPortrait({
  animate = true,
  speed = 28,
}: {
  animate?: boolean;
  speed?: number;
}) {
  const [shown, setShown] = useState(animate ? 0 : portrait.length);

  useEffect(() => {
    if (!animate) return;
    const id = setInterval(
      () => setShown((n) => (n >= portrait.length ? (clearInterval(id), n) : n + 1)),
      speed
    );
    return () => clearInterval(id);
  }, [animate, speed]);

  return (
    <pre className="portrait" aria-label="ASCII portrait">
      {portrait.slice(0, shown).map((line, y) => (
        <div key={y} className="portrait-row">
          {line.split("").map((ch, x) => (
            <span key={x} style={{ opacity: 0.32 + (Number(portraitShade[y]?.[x] ?? 5) / 9) * 0.68 }}>
              {ch}
            </span>
          ))}
        </div>
      ))}
    </pre>
  );
}

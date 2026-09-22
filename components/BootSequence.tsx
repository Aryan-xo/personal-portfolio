"use client";
import { useEffect, useRef, useState } from "react";
import { config } from "@/lib/config";
import * as audio from "@/lib/audio";

const STEPS: [string, string][] = [
  ["ARYAN BIOS v4.2.1 — (C) 2026", ""],
  ["Detecting CPU", "1 brain @ 3 cups/day"],
  ["Memory test", "8192K OK"],
  ["Initialising display adapter", "CRT 80x24"],
  ["Mounting /dev/experience", "OK"],
  ["Mounting /dev/projects", "OK"],
  ["Loading kernel module: curiosity", "OK"],
  ["Loading kernel module: caffeine", "OK"],
  ["Starting network", "linkedin github mail"],
  ["Decoding portrait.ascii", "OK"],
  ["", ""],
  [`Welcome, visitor. You are logged in as guest@${config.host}.`, ""],
];

export default function BootSequence({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(0);
  const done = useRef(false);

  const finish = (e?: Event) => {
    if (done.current) return;
    done.current = true;
    // Otherwise the key that skipped the boot lands in the prompt below.
    e?.preventDefault();
    onDone();
  };

  /*
   * Sound is on unless it has been turned off, but a browser will not play
   * anything before a gesture — so the handshake is attempted immediately for
   * anyone returning, and otherwise waits for the first key or click, which on
   * this screen is also what skips the boot.
   */
  useEffect(() => {
    let off = false;
    try {
      off = localStorage.getItem("sound") === "off";
    } catch {}
    audio.setSound(!off);
    if (off) return;

    const play = () => {
      audio.powerOn();
      audio.handshake();
    };
    play();

    const onGesture = () => {
      play();
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
    window.addEventListener("pointerdown", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, []);

  useEffect(() => {
    if (n >= STEPS.length) {
      const t = setTimeout(finish, 420);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((v) => v + 1), 90 + Math.random() * 130);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  useEffect(() => {
    window.addEventListener("keydown", finish);
    window.addEventListener("click", finish);
    return () => {
      window.removeEventListener("keydown", finish);
      window.removeEventListener("click", finish);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="boot" onClick={() => finish()}>
      {STEPS.slice(0, n).map(([label, status], i) => (
        <div key={i} className="boot-row">
          <span>{label}</span>
          {status && (
            <>
              <span className="boot-dots" />
              <span className="accent">{status}</span>
            </>
          )}
        </div>
      ))}
      <div className="boot-skip dim">press any key to skip</div>
    </div>
  );
}

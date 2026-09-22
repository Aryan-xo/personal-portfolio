"use client";
import { useEffect, useState } from "react";
import BootSequence from "@/components/BootSequence";
import Terminal from "@/components/Terminal";

export default function Home() {
  const [booted, setBooted] = useState(false);

  // Skip the boot on repeat visits within the same tab session.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("booted")) setBooted(true);
    } catch {}
  }, []);

  const done = () => {
    try {
      sessionStorage.setItem("booted", "1");
    } catch {}
    setBooted(true);
  };

  return <div className="crt">{booted ? <Terminal /> : <BootSequence onDone={done} />}</div>;
}

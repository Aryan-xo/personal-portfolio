"use client";
import { themes } from "@/lib/themes";

/**
 * Swatches for the themes and a switch for the CRT overlays. Each swatch is
 * painted in the colours it selects, so the choice is visible rather than a
 * name you have to try.
 */
export default function ThemePicker({
  theme,
  onTheme,
  crt,
  onCrt,
  sound,
  onSound,
}: {
  theme: string;
  onTheme: (name: string) => void;
  crt: boolean;
  onCrt: (on: boolean) => void;
  sound: boolean;
  onSound: (on: boolean) => void;
}) {
  return (
    <div className="picker" onClick={(e) => e.stopPropagation()}>
      <div className="picker-swatches" role="radiogroup" aria-label="Colour theme">
        {themes.map((t) => (
          <button
            key={t.name}
            role="radio"
            aria-checked={t.name === theme}
            aria-label={t.name}
            title={t.name}
            className={`swatch${t.name === theme ? " is-on" : ""}`}
            style={{ background: t.bg, borderColor: t.dim }}
            onClick={() => onTheme(t.name)}
          >
            <span style={{ background: t.fg }} />
          </button>
        ))}
      </div>

      <button
        className={`picker-crt${crt ? " is-on" : ""}`}
        onClick={() => onCrt(!crt)}
        aria-pressed={crt}
        title={crt ? "Turn the scanlines and glow off" : "Turn the scanlines and glow on"}
      >
        crt {crt ? "on" : "off"}
      </button>

      <button
        className={`picker-crt${sound ? " is-on" : ""}`}
        onClick={() => onSound(!sound)}
        aria-pressed={sound}
        title={sound ? "Mute the key clicks" : "Key clicks, a modem and a CRT warming up"}
      >
        sound {sound ? "on" : "off"}
      </button>
    </div>
  );
}

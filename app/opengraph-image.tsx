import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { config } from "@/lib/config";
import { portrait } from "@/lib/portrait";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${config.identity.name} — ${config.identity.headline}`;

const BG = "#04120a";
const FG = "#7cf9a6";
const DIM = "#5aa876";

const font = (name: string) =>
  readFile(join(process.cwd(), "assets", "fonts", name));

/** The share card: the same portrait and prompt the site opens with. */
export default async function Image() {
  const [regular, bold] = await Promise.all([
    font("JetBrainsMono-Regular.ttf"),
    font("JetBrainsMono-Bold.ttf"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 48,
          padding: "0 64px",
          background: BG,
          color: FG,
          fontFamily: "JetBrains Mono",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 8.4,
            lineHeight: 1,
            whiteSpace: "pre",
            flexShrink: 0,
          }}
        >
          {portrait.join("\n")}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 60, fontWeight: 700, letterSpacing: 1 }}>
            {config.identity.name}
          </div>
          <div style={{ fontSize: 25, marginTop: 14 }}>{config.identity.headline}</div>
          <div style={{ fontSize: 22, color: DIM, marginTop: 6 }}>
            {config.identity.location}
          </div>
          <div style={{ fontSize: 20, color: DIM, marginTop: 22, maxWidth: 560 }}>
            {config.identity.tagline}
          </div>
          {/* Spaces are written into the string: flex children would otherwise
              have the whitespace between them collapsed away. */}
          <div style={{ display: "flex", fontSize: 22, marginTop: 30 }}>
            <div style={{ color: FG }}>{`${config.user}@${config.host}`}</div>
            <div style={{ color: DIM }}>:~$&nbsp;</div>
            <div>help</div>
            <div style={{ color: FG }}>_</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "JetBrains Mono", data: regular, weight: 400, style: "normal" },
        { name: "JetBrains Mono", data: bold, weight: 700, style: "normal" },
      ],
    }
  );
}

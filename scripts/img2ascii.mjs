// Photo → ASCII portrait. Writes lib/portrait.ts
//
//   node scripts/img2ascii.mjs [source.jpg]
//   node scripts/preview-ascii.mjs out.png   # look at the result
//
// Three things decide how good the output is:
//
//   Tone      Luminance is dithered rather than rounded, so a gradient keeps
//             its gradation instead of banding into flat steps.
//   Structure Edges are detected separately and drawn with glyphs that follow
//             their direction, which is what lets glasses and a jawline read
//             as lines rather than as smudges of the right darkness.
//   Ramp      The characters come from lib/ramp.json, measured from the font
//             the site actually renders with — see scripts/calibrate-ramp.mjs.
import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";
import { writeFile, readFile, access } from "node:fs/promises";

const src = process.argv[2] ?? "me.jpg";

const OPTS = {
  width: 100,         // character columns for the header portrait
  smallWidth: 30,     // compact portrait used by `neofetch`
  aspect: 2.05,       // terminal cell height ÷ width
  crop: { left: 1010, top: 415, width: 690, height: 840 }, // null for the whole frame
  alphaCut: 190,      // alpha below this counts as background
  equalise: 0.25,     // 0 = the photo's own tones, 1 = full histogram equalisation
  gamma: 1.0,         // <1 lifts shadows so dark clothing keeps its shape
  contrast: 1.2,
  exposure: 1.22,      // >1 lightens the whole image before quantising
  dither: 0.85,       // how much quantisation error to carry into neighbours
  edges: 0.5,         // 0 disables directional glyphs; higher = fewer, stronger
  edgeCeiling: 0.82,  // no edge glyphs in near-white areas, where they read as dirt
  trimBlank: true,    // drop fully blank rows top and bottom
};

const { ramp: RAMP } = JSON.parse(await readFile("lib/ramp.json", "utf8"));
const DARKEST = RAMP.length - 1;

const CUTOUT = "cutout.png";
let cut;
try {
  await access(CUTOUT);
  cut = await readFile(CUTOUT);
  console.error("using cached cutout.png (delete it to re-segment)");
} catch {
  console.error("segmenting subject from background …");
  let pipe = sharp(src).rotate();
  if (OPTS.crop) pipe = pipe.extract(OPTS.crop);
  const blob = await removeBackground(new Blob([await pipe.png().toBuffer()], { type: "image/png" }));
  cut = Buffer.from(await blob.arrayBuffer());
  await writeFile(CUTOUT, cut);
}

const meta = await sharp(cut).metadata();

/** Sobel gradients, in the direction the edge runs rather than across it. */
function sobel(lum, keep, W, H) {
  const mag = new Float32Array(W * H);
  const dir = new Float32Array(W * H);
  const at = (x, y) => {
    const cx = Math.max(0, Math.min(W - 1, x));
    const cy = Math.max(0, Math.min(H - 1, y));
    const i = cy * W + cx;
    return keep[i] ? lum[i] : 1; // treat cut-out background as white
  };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const gx =
        -at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1) +
        at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1);
      const gy =
        -at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1) +
        at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1);
      const i = y * W + x;
      mag[i] = Math.hypot(gx, gy);
      // The edge itself is perpendicular to the gradient.
      dir[i] = Math.atan2(gy, gx) + Math.PI / 2;
    }
  }
  return { mag, dir };
}

/** Which of `| / \ _ -` lies along an edge at this angle. */
function edgeGlyph(angle) {
  let deg = ((angle * 180) / Math.PI) % 180;
  if (deg < 0) deg += 180;
  if (deg < 22.5 || deg >= 157.5) return "-";
  if (deg < 67.5) return "\\";
  if (deg < 112.5) return "|";
  return "/";
}

async function render(W) {
  const H = Math.max(1, Math.round((W * meta.height) / meta.width / OPTS.aspect));

  const { data } = await sharp(cut)
    .resize(W, H, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const lum = new Float32Array(W * H);
  const keep = new Uint8Array(W * H);
  for (let i = 0, p = 0; i < W * H; i++, p += 4) {
    keep[i] = data[p + 3] >= OPTS.alphaCut ? 1 : 0;
    lum[i] = (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) / 255;
  }

  // Histogram-equalise across the subject. A linear stretch fails on a backlit
  // photo, where almost every pixel sits in the bottom third of the range.
  const hist = new Float64Array(256);
  let kept = 0;
  for (let i = 0; i < lum.length; i++) {
    if (!keep[i]) continue;
    hist[Math.max(0, Math.min(255, Math.round(lum[i] * 255)))]++;
    kept++;
  }
  const cdf = new Float64Array(256);
  let acc = 0;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    cdf[i] = acc / kept;
  }
  const equalise = (x) => {
    const e = cdf[Math.max(0, Math.min(255, Math.round(x * 255)))];
    return OPTS.equalise * e + (1 - OPTS.equalise) * Math.max(0, Math.min(1, x));
  };

  // Tone per cell, before quantisation.
  const tone = new Float32Array(W * H);
  for (let i = 0; i < lum.length; i++) {
    if (!keep[i]) continue;
    let v = Math.pow(equalise(lum[i]), OPTS.gamma);
    v = (v - 0.5) * OPTS.contrast + 0.5;
    tone[i] = Math.max(0, Math.min(1, v * OPTS.exposure));
  }

  const { mag, dir } = sobel(tone, keep, W, H);
  let magMax = 0;
  for (let i = 0; i < mag.length; i++) if (keep[i] && mag[i] > magMax) magMax = mag[i];
  const edgeCut = magMax * OPTS.edges;

  // Floyd–Steinberg: carry each cell's rounding error into its neighbours, so
  // a slow gradient dissolves into a mix of two glyphs instead of banding.
  const err = new Float32Array(W * H);
  const rows = [];
  const shade = [];

  for (let y = 0; y < H; y++) {
    let line = "";
    let sh = "";
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!keep[i]) { line += " "; sh += "0"; continue; }

      const wanted = Math.max(0, Math.min(1, tone[i] + err[i]));
      const idx = Math.round((1 - wanted) * DARKEST); // ramp runs light → dark
      const got = 1 - idx / DARKEST;

      if (OPTS.dither) {
        const e = (wanted - got) * OPTS.dither;
        const spread = (dx, dy, w) => {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= W || ny >= H) return;
          const j = ny * W + nx;
          if (keep[j]) err[j] += e * w;
        };
        spread(1, 0, 7 / 16);
        spread(-1, 1, 3 / 16);
        spread(0, 1, 5 / 16);
        spread(1, 1, 1 / 16);
      }

      const isEdge =
        OPTS.edges > 0 && mag[i] >= edgeCut && tone[i] < OPTS.edgeCeiling;
      line += isEdge ? edgeGlyph(dir[i]) : RAMP[idx];
      sh += String(Math.max(0, Math.min(9, Math.round((1 - got) * 9))));
    }
    rows.push(line.replace(/\s+$/, ""));
    shade.push(sh);
  }

  if (OPTS.trimBlank) {
    while (rows.length && !rows[0].trim()) { rows.shift(); shade.shift(); }
    while (rows.length && !rows.at(-1).trim()) { rows.pop(); shade.pop(); }
  }

  return { rows, shade };
}

const big = await render(OPTS.width);
const small = await render(OPTS.smallWidth);

await writeFile(
  "lib/portrait.ts",
  `// Generated by scripts/img2ascii.mjs — do not edit by hand.
export const portrait: string[] = ${JSON.stringify(big.rows, null, 2)};
export const portraitShade: string[] = ${JSON.stringify(big.shade, null, 2)};

/** Compact variant, sized to sit beside a column of text. */
export const portraitSmall: string[] = ${JSON.stringify(small.rows, null, 2)};
export const portraitSmallShade: string[] = ${JSON.stringify(small.shade, null, 2)};
`
);
console.log(big.rows.join("\n"));
console.error(`\n→ lib/portrait.ts (${OPTS.width}×${big.rows.length} and ${OPTS.smallWidth}×${small.rows.length})`);

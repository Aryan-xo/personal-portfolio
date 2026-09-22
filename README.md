# Terminal Portfolio

A CRT-terminal portfolio: BIOS boot sequence, an ASCII-art portrait generated
from a photo, and ~25 commands. Next.js 16 + TypeScript, statically rendered.

## Editing the content

Everything visible on the site lives in **`lib/config.ts`** — name, experience,
projects, skills, achievements, contact details. Nothing else needs touching to
keep the site current.

## Regenerating the ASCII portrait

```bash
node scripts/img2ascii.mjs me.jpg      # writes lib/portrait.ts
node scripts/preview-ascii.mjs out.png # render it as an image to check it
```

The first run segments the subject from the background and caches the result as
`cutout.png`; delete that file after changing `OPTS.crop` so it re-segments.

Tunables sit in `OPTS` at the top of `scripts/img2ascii.mjs`:

| Option | Effect |
| --- | --- |
| `crop` | Region of the source photo to use. Crop tight to head-and-shoulders — a full-body shot leaves the face too small to read. |
| `width` / `smallWidth` | Character columns for the header portrait and for `neofetch`. |
| `equalise` | `0` keeps the photo's own tones, `1` fully flattens the histogram. Around `0.25` keeps a face legible. |
| `contrast`, `gamma` | Standard tone controls, applied after equalisation. |
| `alphaCut` | Alpha threshold for what counts as background. Raise it if a halo appears. |

## Commands

`help` lists the public ones. `sudo`, `matrix`, `vim`, `ls`, `cat`, `pwd`,
`date`, `echo`, `history` and `exit` are there too but unlisted.

Themes: `theme <name>` — phosphor, amber, ice, matrix, vapor, paper. The choice
persists in `localStorage`.

## Develop

```bash
npm run dev     # http://localhost:3000
npm run build
```
